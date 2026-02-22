import os
import uuid
import asyncio
import edge_tts
from pydub import AudioSegment
import random

# Configure pydub to use imageio-ffmpeg bundled binary
try:
    import imageio_ffmpeg
    ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
    AudioSegment.converter = ffmpeg_path
    AudioSegment.ffmpeg = ffmpeg_path
    AudioSegment.ffprobe = ffmpeg_path
except ImportError:
    pass

OUTPUT_DIR = "static/audio"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def _load_audio_workaround(filepath):
    """
    Workaround for missing ffprobe: Convert MP3 to WAV using ffmpeg 
    and load the WAV using pydub.
    """
    if not os.path.exists(filepath):
        return None
        
    try:
        # If it's already a wav, load it
        if filepath.endswith('.wav'):
            return AudioSegment.from_wav(filepath)
            
        # Convert to wav
        wav_path = filepath.replace('.mp3', '_temp.wav')
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        import subprocess
        subprocess.run([ffmpeg_exe, '-i', filepath, '-y', wav_path], stderr=subprocess.DEVNULL, check=True)
        
        audio = AudioSegment.from_wav(wav_path)
        
        # Cleanup temp wav
        if os.path.exists(wav_path):
            os.remove(wav_path)
            
        return audio
    except Exception as e:
        print(f"Audio load workaround failed: {e}")
        return None

async def generate_podcast(topic: str, duration: int = 1, voices: list = None):
    """
    Generate a podcast episode with custom speaker voices.
    voices: list of voice IDs to use for Speaker 1, 2, 3...
    """
    # Default voices if none provided
    if not voices:
        voices = ["en-US-GuyNeural", "en-US-JennyNeural", "en-US-AriaNeural"]
    
    num_speakers = min(len(voices), 3)
    
    # Expanded script segments for more variety
    intros = [
        "Welcome to Universe FM. I'm Speaker 1, and today we're discussing {topic}.",
        "Hello everyone, Speaker 1 here. We've got a fascinating topic today: {topic}."
    ]
    
    body_segments = [
        ("Speaker 2", "I've been looking into {topic} recently, and it's incredible how much is changing."),
        ("Speaker 1", "That's true. Speaker 3, what's your take on the current state of {topic}?"),
        ("Speaker 3", "I think the most interesting part of {topic} is the human element behind it."),
        ("Speaker 2", "Exactly. We often forget the people behind the technology for {topic}."),
        ("Speaker 1", "Moving on, how do we see {topic} evolving over the next decade?"),
        ("Speaker 3", "I see {topic} becoming much more accessible to the average person."),
        ("Speaker 2", "And hopefully more sustainable too.")
    ]
    
    outros = [
        "That's all for today's episode on {topic}. Thanks for listening!",
        "We'll be back next time with more insights into {topic}. Stay curious."
    ]

    # Filter body segments based on number of speakers
    if num_speakers == 1:
        script = [("Speaker 1", intros[0].format(topic=topic))]
        script.append(("Speaker 1", f"Talking about {topic} is always a pleasure. There's so much to cover."))
        script.append(("Speaker 1", outros[0].format(topic=topic)))
    elif num_speakers == 2:
        script = [("Speaker 1", intros[0].format(topic=topic))]
        script.append(("Speaker 2", f"Thanks for having me. {topic.capitalize()} is a big world."))
        script.extend([s for s in body_segments if s[0] != "Speaker 3"])
        script.append(("Speaker 1", outros[0].format(topic=topic)))
    else:
        script = [("Speaker 1", intros[0].format(topic=topic))]
        script.append(("Speaker 2", f"Glad to be here."))
        script.append(("Speaker 3", f"And me as well. {topic.capitalize()} is something I'm very passionate about."))
        script.extend(body_segments)
        script.append(("Speaker 1", outros[0].format(topic=topic)))

    # Scale script based on duration
    full_script = []
    loops = max(1, duration // 1)
    full_script.append(script[0])
    if num_speakers > 1:
        full_script.append(script[1])

    for i in range(loops):
        # Add varied body content
        for speaker, text in script[2:-1]:
            full_script.append((speaker, text))
            if i < loops - 1:
                # Add a filler
                filler = random.choice([
                    "That's a valid point.",
                    "I see where you're coming from.",
                    "Let's look at this from another angle.",
                    "Wait, I just thought of something."
                ])
                full_script.append((speaker, filler))

    full_script.append(script[-1])
    
    # Speaker to Voice mapping
    speaker_map = {
        f"Speaker {i+1}": voices[i] for i in range(num_speakers)
    }
    
    combined_audio = AudioSegment.silent(duration=0)
    
    try:
        for speaker, text in full_script:
            voice = speaker_map.get(speaker, voices[0])
            filename = f"part_{uuid.uuid4().hex[:8]}.mp3"
            filepath = os.path.join(OUTPUT_DIR, filename)
            
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(filepath)
            
            if os.path.exists(filepath):
                part_audio = _load_audio_workaround(filepath)
                if part_audio:
                    combined_audio += part_audio + AudioSegment.silent(duration=800) # Natural pause
                
                try: os.remove(filepath)
                except: pass
            
        final_filename = f"podcast_{uuid.uuid4().hex[:8]}.mp3"
        final_filepath = os.path.join(OUTPUT_DIR, final_filename)
        combined_audio.export(final_filepath, format="mp3")
        
        return {
            "status": "success",
            "topic": topic,
            "duration": duration,
            "filename": final_filename,
            "url": f"/static/audio/{final_filename}",
            "num_speakers": num_speakers
        }
    except Exception as e:
        error_msg = str(e)
        if "ffmpeg" in error_msg.lower() or "avconv" in error_msg.lower():
            error_msg = "FFMPEG is missing on the system. Please install it to enable podcast mixing."
        return {"status": "error", "error": error_msg}

def get_podcast_topics():
    # Return common suggestions instead of restricted sectors
    return [
        {"id": "ai", "label": "Artificial Intelligence"},
        {"id": "space", "label": "Space Exploration"},
        {"id": "future", "label": "Future of Work"},
        {"id": "climate", "label": "Climate Change"}
    ]
