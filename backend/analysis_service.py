import os
import uuid
import speech_recognition as sr
from pydub import AudioSegment
import imageio_ffmpeg

# Configure pydub to use bundled FFmpeg for transcoding if needed
ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
AudioSegment.converter = ffmpeg_exe

MOODS = {
    "happy": ["happy", "joy", "great", "awesome", "wonderful", "celebrate", "smile", "love", "excited", "fantastic", "cheerful", "glad", "delighted", "positive", "amazing", "thrilled", "blessed", "content", "ecstatic", "jovial", "elated", "jubilant", "merry", "pleased", "radiant", "sunny", "vibrant", "wonderful", "terrific", "superb", "excellent", "magnificent"],
    "sad": ["sad", "unhappy", "cry", "gloomy", "depressed", "lonely", "dark", "pain", "sorry", "miss", "heartbroken", "miserable", "negative", "hopeless", "grief", "sorrow", "tear", "unfortunate", "dejected", "blue", "melancholy", "somber", "weep", "mourn", "despair", "misery", "woe", "anguish", "distress", "sorrowful", "wretched"],
    "angry": ["angry", "mad", "hate", "furious", "annoyed", "wrong", "stop", "shout", "rage", "irritated", "cruel", "mean", "aggressive", "enraged", "offended", "hostile", "bitter", "resentful", "indignant", "pissed", "vengeful", "scornful", "fuming", "outraged", "livid", "irate", "vicious", "spiteful"],
    "calm": ["calm", "peace", "quiet", "relax", "smooth", "soft", "breath", "meditate", "gentle", "silent", "serene", "tranquil", "peaceful", "still", "restful", "mellow", "composed", "placid", "unruffled", "shanti", "halcyon", "harmonious", "soothing", "mild", "undisturbed"],
    "energetic": ["fast", "run", "jump", "power", "loud", "intense", "active", "go", "dynamic", "vibrant", "strong", "fast-paced", "vivid", "lively", "spirited", "bold", "mighty", "forceful", "electric", "wild", "hyper", "fiery", "vigorous", "strenuous", "animated", "brisk", "explosive"]
}

def _load_audio_workaround(filepath):
    """
    Workaround for missing ffprobe: Convert any format to WAV using ffmpeg 
    and load the WAV using pydub.
    """
    if not os.path.exists(filepath):
        return None
        
    try:
        # If it's already a wav, load it
        if filepath.lower().endswith('.wav'):
            return AudioSegment.from_wav(filepath)
            
        # Convert to wav
        temp_wav = f"{filepath}_temp_{uuid.uuid4().hex[:4]}.wav"
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        import subprocess
        subprocess.run([ffmpeg_exe, '-i', filepath, '-y', temp_wav], stderr=subprocess.PIPE, check=True)
        
        audio = AudioSegment.from_wav(temp_wav)
        
        # Cleanup
        if os.path.exists(temp_wav):
            os.remove(temp_wav)
            
        return audio
    except Exception as e:
        print(f"Analysis audio load workaround failed: {e}")
        return None

def analyze_text_mood(text: str):
    import string
    # Remove punctuation and lowercase
    text = text.translate(str.maketrans('', '', string.punctuation)).lower()
    words = text.split()
    
    if not words:
        return {"neutral": 100.0, "happy": 0.0, "sad": 0.0, "angry": 0.0, "calm": 0.0, "energetic": 0.0}
    
    negations = {"not", "no", "never", "dont", "cannot", "isnt", "arent", "wasnt", "werent"}
    scores = {mood: 0 for mood in MOODS.keys()}
    found_any = False
    
    negated = False
    for i, word in enumerate(words):
        # Look ahead for negation
        if word in negations:
            negated = True
            continue
            
        match_found = False
        for mood, keywords in MOODS.items():
            for k in keywords:
                # Direct match
                if k == word:
                    match_found = True
                    # If negated, we might want to flip or at least ignore. 
                    # Simple approach: if negated, don't add to this mood.
                    if not negated:
                        scores[mood] += 1
                        found_any = True
                    else:
                        # If negated happy -> maybe sad? For now, just skip to avoid false positive
                        # Or we could have a "opposite" map. 
                        pass
                    break
                # Only allow partial match if it's significant (avoid 'unhappy' matching 'happy')
                # Actually, 'unhappy' should be 'sad'. 
                # Let's check for specific sub-words carefully.
                if len(k) > 4 and k in word and not word.startswith("un") and not word.startswith("in"):
                    match_found = True
                    if not negated:
                        scores[mood] += 1
                        found_any = True
                    break
            if match_found: break
            
        # Reset negation after one word
        if not word in negations:
            negated = False
            
    if not found_any:
        return {"neutral": 100.0, "happy": 0.0, "sad": 0.0, "angry": 0.0, "calm": 0.0, "energetic": 0.0}
        
    total = sum(scores.values())
    percentages = {mood: round((count / total) * 100, 1) for mood, count in scores.items()}
    percentages["neutral"] = 0.0
    return percentages

async def analyze_audio_mood(audio_path: str):
    """
    Transcribe audio then analyze mood from text.
    """
    # Simplified: convert to wav and use speech_recognition
    # We can reuse logic from translate_service if needed
    recognizer = sr.Recognizer()
    
    # Use workaround to load audio safely
    audio = _load_audio_workaround(audio_path)
    if not audio:
        return {"status": "error", "error": "Could not decode audio file. Please ensure it is a valid audio format."}

    wav_path = audio_path.rsplit('.', 1)[0] + f"_mood_{uuid.uuid4().hex[:4]}.wav"
    audio.export(wav_path, format="wav")
    
    try:
        with sr.AudioFile(wav_path) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)
            mood_result = analyze_text_mood(text)
            return {
                "status": "success",
                "transcribed_text": text,
                "mood": mood_result
            }
    except Exception as e:
        return {"status": "error", "error": f"Could not analyze mood: {str(e)}"}
    finally:
        if os.path.exists(wav_path):
            os.remove(wav_path)
