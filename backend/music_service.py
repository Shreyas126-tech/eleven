import os
import uuid
import asyncio
from pydub import AudioSegment
from pydub.generators import Sine, Square, Sawtooth, Triangle
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

INSTRUMENTS = {
    "piano": {"generator": Sine, "vol": -10, "decay": 100},
    "guitar": {"generator": Triangle, "vol": -12, "decay": 150},
    "synth": {"generator": Sawtooth, "vol": -15, "decay": 50},
    "flute": {"generator": Sine, "vol": -8, "decay": 200}
}

NOTES = {
    "C3": 130.81, "F3": 174.61, "G3": 196.00, "Bb3": 233.08,
    "A3": 220.00,
    "C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23, "G4": 392.00, "A4": 440.00, "B4": 493.88,
    "C5": 523.25, "E5": 659.25, "G5": 783.99, "A5": 880.00, "B5": 987.77,
    "C6": 1046.50, "D6": 1174.66, "E6": 1318.51
}

def generate_note(freq, duration_ms, instrument="piano"):
    inst = INSTRUMENTS.get(instrument, INSTRUMENTS["piano"])
    gen = inst["generator"](freq)
    audio = gen.to_audio_segment(duration=duration_ms, volume=inst["vol"])
    return audio.fade_out(inst["decay"])

async def generate_music(instrument: str, duration: int = 10, scale: str = "major"):
    """
    Generate procedural music melody based on instrument and scale with distinct patterns.
    """
    # Define instrument-specific patterns
    patterns = {
        "piano": {
            "notes": ["C4", "E4", "G4", "A4", "C5", "E5"],
            "rhythm": [250, 250, 500], # Faster, classical feel
            "scale": "major"
        },
        "guitar": {
            "notes": ["A3", "C4", "E4", "G4", "A4"],
            "rhythm": [250, 250, 500, 250, 250, 500], # Faster, strummy
            "scale": "blues"
        },
        "synth": {
            "notes": ["C3", "F3", "G3", "Bb3", "C4"],
            "rhythm": [125, 125, 250, 125, 125, 250], # Techno/Arp pulse
            "scale": "pentatonic"
        },
        "flute": {
            "notes": ["G5", "A5", "B5", "D6", "E6"], # Higher octave for flute
            "rhythm": [1500, 2000, 1000], # Very long, airy notes (legato)
            "scale": "lydian"
        }
    }
    
    pattern = patterns.get(instrument, patterns["piano"])
    combined_audio = AudioSegment.silent(duration=0)
    
    current_ms = 0
    target_ms = duration * 1000
    
    try:
        while current_ms < target_ms:
            note_name = random.choice(pattern["notes"])
            # If note_name not in NOTES, fallback to C4
            freq = NOTES.get(note_name, 261.63)
            
            note_duration = random.choice(pattern["rhythm"])
            # Ensure we don't overshoot duration too much
            if current_ms + note_duration > target_ms:
                note_duration = target_ms - current_ms
                
            part = generate_note(freq, note_duration, instrument)
            combined_audio += part
            current_ms += note_duration
            
        final_filename = f"music_{uuid.uuid4().hex[:8]}.mp3"
        final_filepath = os.path.join(OUTPUT_DIR, final_filename)
        combined_audio.export(final_filepath, format="mp3")
        
        return {
            "status": "success",
            "instrument": instrument,
            "duration": duration,
            "filename": final_filename,
            "url": f"/static/audio/{final_filename}"
        }
    except Exception as e:
        error_msg = str(e)
        if "ffmpeg" in error_msg.lower() or "avconv" in error_msg.lower():
            error_msg = "FFMPEG is missing on the system. Please install it to enable music generation."
        return {"status": "error", "error": error_msg}

async def generate_ringtone(beat_type: str = "basic"):
    """
    Generate a 15-second ringtone loop.
    """
    # Simply generate a faster melody for a ringtone
    res = await generate_music(instrument="synth", duration=15)
    res["type"] = "ringtone"
    return res

def get_instruments():
    return [{"id": k, "label": k.capitalize()} for k in INSTRUMENTS.keys()]
