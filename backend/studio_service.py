import os
import uuid
from pydub import AudioSegment
import numpy as np

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
        # If it's already a wav/mp3, try direct load if WAV, else convert
        if filepath.endswith('.wav'):
            return AudioSegment.from_wav(filepath)
            
        # Convert to wav
        wav_path = filepath + "_temp.wav"
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
        # Final fallback: try from_file and hope for the best
        try: return AudioSegment.from_file(filepath)
        except: return None

async def process_audio(input_path: str, effect: str):
    """
    Process an uploaded audio file with various effects.
    """
    audio = _load_audio_workaround(input_path)
    if not audio:
        return {"status": "error", "error": "Could not load background track. Ensure the format is supported."}
    
    if effect == "speed_up":
        audio = audio.speedup(playback_speed=1.5)
    elif effect == "slowed":
        # Slowing down requires changing the sample rate or using a stretch algorithm
        # A simple way in pydub/ffmpeg is to change frame rate
        audio = audio._spawn(audio.raw_data, overrides={
            "frame_rate": int(audio.frame_rate * 0.75)
        }).set_frame_rate(audio.frame_rate)
    elif effect == "reverb":
        # Simulate reverb with a delay overlay
        delay_ms = 100
        combined = audio.overlay(audio - 10, position=delay_ms)
        combined = combined.overlay(audio - 20, position=delay_ms * 2)
        audio = combined
    elif effect == "enhance":
        # Basic normalization and compression feel
        audio = audio.normalize()
    elif effect == "trigger":
        # Stutter effect: repeat a small segment
        segment = audio[:200]
        audio = (segment * 4) + audio[800:]
        
    filename = f"studio_{uuid.uuid4().hex[:8]}.mp3"
    filepath = os.path.join(OUTPUT_DIR, filename)
    audio.export(filepath, format="mp3")
    
    return {
        "status": "success",
        "effect": effect,
        "filename": filename,
        "url": f"/static/audio/{filename}"
    }

async def create_mashup(audio_path1: str, audio_path2: str, crossfade_style: str = "smooth", balance: float = 0.5):
    """
    Generate a mashup of two songs by overlaying them.
    crossfade_style: smooth, instant, overlap
    balance: 0.0 (all track 1) to 1.0 (all track 2)
    """
    audio1 = _load_audio_workaround(audio_path1)
    audio2 = _load_audio_workaround(audio_path2)
    
    if not audio1 or not audio2:
        return {"status": "error", "error": "Could not load one or both tracks for mashup."}
    
    # Adjust volumes based on balance
    # pydub gain is in dB. 0.5 balance = no change.
    # We'll use a simple linear-to-dB mapping for the sake of the mashup
    gain1 = (1.0 - balance - 0.5) * 20 # -10dB to +10dB
    gain2 = (balance - 0.5) * 20
    
    audio1 = audio1 + gain1
    audio2 = audio2 + gain2
    
    # Trim to same length
    min_len = min(len(audio1), len(audio2))
    audio1 = audio1[:min_len]
    audio2 = audio2[:min_len]
    
    # Apply "crossfade" (actually just different overlay offsets/fades for mashup feel)
    if crossfade_style == "overlap":
        # Start track 2 slightly later (e.g. 500ms)
        mashup = audio1.overlay(audio2, position=500)
    elif crossfade_style == "smooth":
        # Simple overlay with a slight fade in on both
        mashup = audio1.overlay(audio2.fade_in(2000))
    else: # instant
        mashup = audio1.overlay(audio2)
    
    filename = f"mashup_{uuid.uuid4().hex[:8]}.mp3"
    filepath = os.path.join(OUTPUT_DIR, filename)
    mashup.export(filepath, format="mp3")
    
    return {
        "status": "success",
        "filename": filename,
        "url": f"/static/audio/{filename}",
        "config": {"style": crossfade_style, "balance": balance}
    }
