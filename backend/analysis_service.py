import os
import uuid
import speech_recognition as sr
from pydub import AudioSegment
import imageio_ffmpeg

# Configure pydub to use bundled FFmpeg for transcoding if needed
ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
AudioSegment.converter = ffmpeg_exe

MOODS = {
    "happy": ["happy", "joy", "great", "awesome", "wonderful", "celebrate", "smile", "love", "excited", "fantastic", "cheerful", "glad", "delighted", "positive"],
    "sad": ["sad", "unhappy", "cry", "gloomy", "depressed", "lonely", "dark", "pain", "sorry", "miss", "heartbroken", "gloomy", "miserable", "Negative"],
    "angry": ["angry", "mad", "hate", "furious", "annoyed", "wrong", "stop", "shout", "rage", "irritated", "cruel", "mean", "aggressive"],
    "calm": ["calm", "peace", "quiet", "relax", "smooth", "soft", "breath", "meditate", "gentle", "silent", "serene", "tranquil"],
    "energetic": ["fast", "run", "jump", "power", "loud", "intense", "active", "go", "dynamic", "vibrant", "strong", "fast-paced"]
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
        subprocess.run([ffmpeg_exe, '-i', filepath, '-y', temp_wav], stderr=subprocess.DEVNULL, check=True)
        
        audio = AudioSegment.from_wav(temp_wav)
        
        # Cleanup
        if os.path.exists(temp_wav):
            os.remove(temp_wav)
            
        return audio
    except Exception as e:
        print(f"Analysis audio load workaround failed: {e}")
        return None

def analyze_text_mood(text: str):
    text = text.lower()
    scores = {mood: 0 for mood in MOODS.keys()}
    words = text.split()
    
    if not words:
        return {mood: 0 for mood in MOODS.keys()}
        
    for word in words:
        # Check for direct matches and semantic hints
        for mood, keywords in MOODS.items():
            if any(k in word for k in keywords):
                scores[mood] += 1
                
    total = sum(scores.values())
    if total == 0:
        # Fallback to a neutral state if no emotions detected
        return {mood: 0 for mood in MOODS.keys()}
        
    percentages = {mood: round((count / total) * 100, 1) for mood, count in scores.items()}
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
