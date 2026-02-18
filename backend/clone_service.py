import os
import uuid
import asyncio
import edge_tts

OUTPUT_DIR = "static/audio"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Pre-defined celebrity voice presets (approximations using edge-tts)
CELEBRITY_PRESETS = [
    {
        "id": "morgan_freeman",
        "name": "Morgan Freeman",
        "voice": "en-US-ChristopherNeural",
        "rate": "-10%",
        "pitch": "-5Hz",
        "avatar": "🧔🏿‍♂️",
        "description": "Deep, soothing, authoritative"
    },
    {
        "id": "scarlett_johansson",
        "name": "Scarlett Johansson",
        "voice": "en-US-AriaNeural",
        "rate": "+0%",
        "pitch": "-2Hz",
        "avatar": "👩🏼",
        "description": "Raspy, elegant, charming"
    },
    {
        "id": "david_attenborough",
        "name": "David Attenborough",
        "voice": "en-GB-RyanNeural",
        "rate": "-5%",
        "pitch": "-2Hz",
        "avatar": "👴🏻",
        "description": "British, nature documentary style"
    },
    {
        "id": "taylor_swift",
        "name": "Taylor Swift",
        "voice": "en-US-JennyNeural",
        "rate": "+5%",
        "pitch": "+2Hz",
        "avatar": "👱‍♀️",
        "description": "Bright, pop star energy"
    },
    {
        "id": "donald_trump",
        "name": "Donald Trump",
        "voice": "en-US-RogerNeural",  # Older male voice
        "rate": "-5%",
        "pitch": "-2Hz",
        "avatar": "👱‍♂️",
        "description": "Bold, distinctive cadence"
    },
    {
        "id": "barack_obama",
        "name": "Barack Obama",
        "voice": "en-US-GuyNeural",
        "rate": "-10%",
        "pitch": "-2Hz",
        "avatar": "👨🏾‍⚖️",
        "description": "Smooth, rhythmic, presidential"
    },
    {
        "id": "elon_musk",
        "name": "Elon Musk",
        "voice": "en-US-EricNeural",
        "rate": "+0%",
        "pitch": "+0Hz",
        "avatar": "🚀",
        "description": "Tech visionary, slightly stuttered"
    },
    {
        "id": "narendra_modi",
        "name": "Narendra Modi",
        "voice": "en-IN-PrabhatNeural",
        "rate": "-10%",
        "pitch": "-2Hz",
        "avatar": "🇮🇳",
        "description": "Measured, powerful, Indian accent"
    },
    {
        "id": "yogi_adityanath",
        "name": "Yogi Adityanath",
        "voice": "hi-IN-MadhurNeural",
        "rate": "-5%",
        "pitch": "-5Hz",
        "avatar": "🕉️",
        "description": "Deep, serious, authoritative"
    },
    {
        "id": "mamata_bannerjee",
        "name": "Mamata Bannerjee",
        "voice": "en-IN-NeerjaNeural",
        "rate": "+5%",
        "pitch": "+2Hz",
        "avatar": "👩🏽",
        "description": "Sharp, energetic, Bengali accent"
    },
    {
        "id": "rahul_gandhi",
        "name": "Rahul Gandhi",
        "voice": "en-IN-PrabhatNeural",
        "rate": "+5%",
        "pitch": "+2Hz",
        "avatar": "🚶",
        "description": "Younger, earnest, Indian accent"
    },
    {
        "id": "snoop_dogg",
        "name": "Snoop Dogg",
        "voice": "en-US-SteffanNeural",
        "rate": "-15%",
        "pitch": "-5Hz",
        "avatar": "🕶️",
        "description": "Laid back, rhythm & rhymin'"
    }
]

def get_celebrities():
    """Return list of available celebrity presets."""
    return CELEBRITY_PRESETS


async def clone_voice(celebrity_id: str, text: str, mode: str = "speak"):
    """
    Generate speech/singing using the celebrity's approximate voice settings.
    """
    preset = next((c for c in CELEBRITY_PRESETS if c["id"] == celebrity_id), None)
    if not preset:
        return {"status": "error", "error": "Celebrity not found"}

    filename = f"clone_{uuid.uuid4().hex[:8]}.mp3"
    filepath = os.path.join(OUTPUT_DIR, filename)

    # Apply voice modifications
    voice = preset["voice"]
    rate = preset["rate"]
    pitch = preset["pitch"]
    
    # If singing mode, make it more rhythmic/musical
    final_text = text
    if mode == "sing":
        # Add musical notes if not present
        if "♪" not in text:
            lines = text.split('\n')
            final_text = " ... ".join([f"♪ {line.strip()} ♪" for line in lines if line.strip()])
        # Enhance pitch variation for singing
        # (This is a heuristic, real AI singing requires different models)
        try:
            base_pitch = int(pitch.replace('Hz', ''))
            new_pitch = base_pitch + 5
            pitch = f"{new_pitch:+d}Hz"
        except ValueError:
            pitch = "+0Hz" 
    
    try:
        communicate = edge_tts.Communicate(final_text, voice, rate=rate, pitch=pitch)
        await communicate.save(filepath)

        return {
            "status": "success",
            "filename": filename,
            "url": f"/static/audio/{filename}",
            "text": text,
            "celebrity": preset["name"],
            "mode": mode
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}
