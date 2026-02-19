import os
import uuid
import asyncio
import edge_tts

OUTPUT_DIR = "static/audio"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Voice presets organized by age groups and tune styles
VOICE_PRESETS = [
    # ============ Age Group Voices ============
    {
        "id": "child_girl",
        "name": "Child Girl",
        "voice": "en-US-AnaNeural",
        "rate": "+25%",
        "pitch": "+15Hz",
        "avatar": "👧",
        "description": "Young girl, bright and cheerful",
        "category": "Age Group"
    },
    {
        "id": "child_boy",
        "name": "Child Boy",
        "voice": "en-US-GuyNeural",
        "rate": "+20%",
        "pitch": "+12Hz",
        "avatar": "👦",
        "description": "Young boy, energetic and playful",
        "category": "Age Group"
    },
    {
        "id": "teenager_female",
        "name": "Teenager (Female)",
        "voice": "en-US-AriaNeural",
        "rate": "+8%",
        "pitch": "+6Hz",
        "avatar": "👩‍🎤",
        "description": "Teenage girl, expressive and trendy",
        "category": "Age Group"
    },
    {
        "id": "teenager_male",
        "name": "Teenager (Male)",
        "voice": "en-US-EricNeural",
        "rate": "+5%",
        "pitch": "+4Hz",
        "avatar": "🧑‍🎤",
        "description": "Teenage boy, casual and upbeat",
        "category": "Age Group"
    },
    {
        "id": "young_adult_female",
        "name": "Young Adult (Female)",
        "voice": "en-US-JennyNeural",
        "rate": "+0%",
        "pitch": "+0Hz",
        "avatar": "👩",
        "description": "Young woman, clear and confident",
        "category": "Age Group"
    },
    {
        "id": "young_adult_male",
        "name": "Young Adult (Male)",
        "voice": "en-US-GuyNeural",
        "rate": "+0%",
        "pitch": "+0Hz",
        "avatar": "👨",
        "description": "Young man, natural and warm",
        "category": "Age Group"
    },
    {
        "id": "middle_aged_female",
        "name": "Middle-Aged (Female)",
        "voice": "en-US-AriaNeural",
        "rate": "-10%",
        "pitch": "-3Hz",
        "avatar": "👩‍💼",
        "description": "Mature woman, poised and authoritative",
        "category": "Age Group"
    },
    {
        "id": "middle_aged_male",
        "name": "Middle-Aged (Male)",
        "voice": "en-US-ChristopherNeural",
        "rate": "-8%",
        "pitch": "-5Hz",
        "avatar": "👨‍💼",
        "description": "Mature man, steady and commanding",
        "category": "Age Group"
    },
    {
        "id": "elderly_female",
        "name": "Elderly Woman",
        "voice": "en-GB-SoniaNeural",
        "rate": "-25%",
        "pitch": "-8Hz",
        "avatar": "👵",
        "description": "Elderly woman, warm and wise",
        "category": "Age Group"
    },
    {
        "id": "elderly_male",
        "name": "Elderly Man",
        "voice": "en-GB-RyanNeural",
        "rate": "-20%",
        "pitch": "-12Hz",
        "avatar": "👴",
        "description": "Elderly man, deep and grandfatherly",
        "category": "Age Group"
    },
    # ============ Tune / Style Variations ============
    {
        "id": "robotic",
        "name": "Robotic",
        "voice": "en-US-GuyNeural",
        "rate": "+5%",
        "pitch": "-15Hz",
        "avatar": "🤖",
        "description": "Flat, monotone robotic delivery",
        "category": "Tune Style"
    },
    {
        "id": "whisper",
        "name": "Whisper",
        "voice": "en-US-AriaNeural",
        "rate": "-30%",
        "pitch": "-5Hz",
        "avatar": "🤫",
        "description": "Soft, breathy whisper voice",
        "category": "Tune Style"
    },
    {
        "id": "dramatic",
        "name": "Dramatic",
        "voice": "en-US-ChristopherNeural",
        "rate": "-25%",
        "pitch": "-8Hz",
        "avatar": "🎭",
        "description": "Theatrical, dramatic narration",
        "category": "Tune Style"
    },
    {
        "id": "cheerful",
        "name": "Cheerful",
        "voice": "en-US-JennyNeural",
        "rate": "+20%",
        "pitch": "+10Hz",
        "avatar": "😊",
        "description": "Happy, enthusiastic and bright",
        "category": "Tune Style"
    },
    {
        "id": "deep_bass",
        "name": "Deep Bass",
        "voice": "en-US-ChristopherNeural",
        "rate": "-20%",
        "pitch": "-20Hz",
        "avatar": "🔊",
        "description": "Ultra-deep bass voice",
        "category": "Tune Style"
    },
    {
        "id": "high_pitch",
        "name": "High Pitch",
        "voice": "en-US-AnaNeural",
        "rate": "+15%",
        "pitch": "+25Hz",
        "avatar": "🎵",
        "description": "Squeaky high-pitched voice",
        "category": "Tune Style"
    },
    {
        "id": "storyteller",
        "name": "Storyteller",
        "voice": "en-GB-RyanNeural",
        "rate": "-12%",
        "pitch": "-2Hz",
        "avatar": "📖",
        "description": "Calm, engaging narration style",
        "category": "Tune Style"
    },
    {
        "id": "news_anchor",
        "name": "News Anchor",
        "voice": "en-US-GuyNeural",
        "rate": "+5%",
        "pitch": "+2Hz",
        "avatar": "📺",
        "description": "Professional news broadcast voice",
        "category": "Tune Style"
    },
]


def get_voice_presets():
    """Return list of available voice presets."""
    return VOICE_PRESETS


async def clone_voice(preset_id: str, text: str, mode: str = "speak"):
    """
    Generate speech/singing using the selected voice preset settings.
    """
    preset = next((p for p in VOICE_PRESETS if p["id"] == preset_id), None)
    if not preset:
        return {"status": "error", "error": "Voice preset not found"}

    filename = f"clone_{uuid.uuid4().hex[:8]}.mp3"
    filepath = os.path.join(OUTPUT_DIR, filename)

    # Apply voice modifications
    voice = preset["voice"]
    rate = preset["rate"]
    pitch = preset["pitch"]
    
    # If singing mode, make it more rhythmic/musical
    final_text = text
    if mode == "sing":
        if "♪" not in text:
            lines = text.split('\n')
            final_text = " ... ".join([f"♪ {line.strip()} ♪" for line in lines if line.strip()])
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
            "preset_name": preset["name"],
            "category": preset["category"],
            "mode": mode
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}
