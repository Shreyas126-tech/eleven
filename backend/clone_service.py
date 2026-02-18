import os
import uuid
import asyncio
import edge_tts

OUTPUT_DIR = "static/audio"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Celebrity voice presets mapped to the closest edge-tts voice characteristics
# Each celebrity is mapped to a voice + specific tuning parameters to approximate their style
CELEBRITY_PRESETS = {
    "morgan_freeman": {
        "name": "Morgan Freeman",
        "avatar": "🎭",
        "description": "Deep, authoritative, warm narration voice",
        "voice": "en-US-GuyNeural",
        "rate": "-15%",
        "pitch": "-10Hz",
        "style": "narration",
    },
    "scarlett_johansson": {
        "name": "Scarlett Johansson",
        "avatar": "🌟",
        "description": "Smooth, sultry, captivating voice",
        "voice": "en-US-JennyNeural",
        "rate": "-5%",
        "pitch": "-3Hz",
        "style": "gentle",
    },
    "david_attenborough": {
        "name": "David Attenborough",
        "avatar": "🌿",
        "description": "Distinguished British documentary narrator",
        "voice": "en-GB-RyanNeural",
        "rate": "-20%",
        "pitch": "-5Hz",
        "style": "documentary",
    },
    "oprah_winfrey": {
        "name": "Oprah Winfrey",
        "avatar": "✨",
        "description": "Warm, inspiring, motivational voice",
        "voice": "en-US-AriaNeural",
        "rate": "-5%",
        "pitch": "+2Hz",
        "style": "empathetic",
    },
    "james_earl_jones": {
        "name": "James Earl Jones",
        "avatar": "🎬",
        "description": "Deep, booming, iconic voice (Darth Vader)",
        "voice": "en-US-GuyNeural",
        "rate": "-25%",
        "pitch": "-15Hz",
        "style": "authoritative",
    },
    "emma_watson": {
        "name": "Emma Watson",
        "avatar": "📚",
        "description": "Elegant British accent, articulate",
        "voice": "en-GB-SoniaNeural",
        "rate": "-5%",
        "pitch": "+0Hz",
        "style": "refined",
    },
    "amitabh_bachchan": {
        "name": "Amitabh Bachchan",
        "avatar": "🎥",
        "description": "Deep, commanding Indian voice",
        "voice": "hi-IN-MadhurNeural",
        "rate": "-15%",
        "pitch": "-8Hz",
        "style": "dramatic",
    },
    "priyanka_chopra": {
        "name": "Priyanka Chopra",
        "avatar": "💫",
        "description": "Elegant, modern, confident Indian voice",
        "voice": "en-IN-NeerjaNeural",
        "rate": "-5%",
        "pitch": "+2Hz",
        "style": "confident",
    },
    "benedict_cumberbatch": {
        "name": "Benedict Cumberbatch",
        "avatar": "🎩",
        "description": "Rich baritone British voice (Sherlock)",
        "voice": "en-GB-RyanNeural",
        "rate": "-10%",
        "pitch": "-3Hz",
        "style": "mysterious",
    },
    "taylor_swift": {
        "name": "Taylor Swift",
        "avatar": "🎤",
        "description": "Sweet, youthful, melodic speaking voice",
        "voice": "en-US-JennyNeural",
        "rate": "+0%",
        "pitch": "+5Hz",
        "style": "cheerful",
    },
    "samuel_l_jackson": {
        "name": "Samuel L. Jackson",
        "avatar": "😎",
        "description": "Bold, intense, commanding voice",
        "voice": "en-US-GuyNeural",
        "rate": "+5%",
        "pitch": "-5Hz",
        "style": "intense",
    },
    "adele": {
        "name": "Adele",
        "avatar": "🎵",
        "description": "Rich, soulful British voice",
        "voice": "en-GB-SoniaNeural",
        "rate": "-10%",
        "pitch": "-5Hz",
        "style": "soulful",
    },
}


def get_celebrities():
    """Return list of available celebrity voice presets."""
    return [
        {
            "id": celeb_id,
            "name": info["name"],
            "avatar": info["avatar"],
            "description": info["description"],
        }
        for celeb_id, info in CELEBRITY_PRESETS.items()
    ]


async def clone_voice(celebrity_id: str, text: str):
    """
    Generate speech in a celebrity's voice style using edge-tts with tuned parameters.
    """
    preset = CELEBRITY_PRESETS.get(celebrity_id)
    if not preset:
        return {
            "status": "error",
            "error": f"Celebrity '{celebrity_id}' not found. Available: {list(CELEBRITY_PRESETS.keys())}"
        }

    filename = f"clone_{celebrity_id}_{uuid.uuid4().hex[:8]}.mp3"
    filepath = os.path.join(OUTPUT_DIR, filename)

    try:
        communicate = edge_tts.Communicate(
            text,
            preset["voice"],
            rate=preset.get("rate", "+0%"),
            pitch=preset.get("pitch", "+0Hz"),
        )
        await communicate.save(filepath)

        return {
            "status": "success",
            "filename": filename,
            "url": f"/static/audio/{filename}",
            "celebrity": preset["name"],
            "text": text,
        }

    except Exception as e:
        return {
            "status": "error",
            "error": f"Voice cloning failed: {str(e)}"
        }


async def clone_voice_sing(celebrity_id: str, lyrics: str):
    """
    Generate a 'singing' style output using a celebrity's voice.
    Adds musical annotations to make the TTS output more song-like.
    """
    preset = CELEBRITY_PRESETS.get(celebrity_id)
    if not preset:
        return {
            "status": "error",
            "error": f"Celebrity '{celebrity_id}' not found."
        }

    # Add musical pauses and emphasis for a song-like effect
    lines = lyrics.strip().split('\n')
    musical_lines = []
    for line in lines:
        line = line.strip()
        if line:
            musical_lines.append(f"♪ {line} ♪")

    musical_text = " ... ".join(musical_lines)

    filename = f"sing_{celebrity_id}_{uuid.uuid4().hex[:8]}.mp3"
    filepath = os.path.join(OUTPUT_DIR, filename)

    try:
        # Use a slightly slower rate for singing
        sing_rate = str(int(preset.get("rate", "+0%").replace('%', '').replace('+', '')) - 10) + "%"
        if not sing_rate.startswith('-') and not sing_rate.startswith('+'):
            sing_rate = '-' + sing_rate if int(sing_rate.replace('%', '')) > 0 else '+' + sing_rate

        communicate = edge_tts.Communicate(
            musical_text,
            preset["voice"],
            rate=sing_rate,
            pitch=preset.get("pitch", "+0Hz"),
        )
        await communicate.save(filepath)

        return {
            "status": "success",
            "filename": filename,
            "url": f"/static/audio/{filename}",
            "celebrity": preset["name"],
            "lyrics": lyrics,
            "mode": "singing",
        }

    except Exception as e:
        return {
            "status": "error",
            "error": f"Voice cloning (singing) failed: {str(e)}"
        }
