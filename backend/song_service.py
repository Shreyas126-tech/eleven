import os
import uuid
import asyncio
import edge_tts
import random

OUTPUT_DIR = "static/audio"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ============= Lyrics Templates by Genre =============
# These templates help generate song-like lyrics based on user prompts
SONG_STRUCTURES = {
    "pop": {
        "intro": "Yeah, yeah, yeah...",
        "verse_style": "upbeat and catchy",
        "chorus_repeat": 2,
    },
    "rock": {
        "intro": "Woah oh oh...",
        "verse_style": "powerful and energetic",
        "chorus_repeat": 2,
    },
    "jazz": {
        "intro": "Ba da ba da...",
        "verse_style": "smooth and soulful",
        "chorus_repeat": 1,
    },
    "classical": {
        "intro": "",
        "verse_style": "elegant and poetic",
        "chorus_repeat": 1,
    },
    "electronic": {
        "intro": "Da da da da...",
        "verse_style": "rhythmic and futuristic",
        "chorus_repeat": 2,
    },
    "hiphop": {
        "intro": "Yo, yo, yo...",
        "verse_style": "rhythmic and bold",
        "chorus_repeat": 2,
    },
    "rnb": {
        "intro": "Ooh baby...",
        "verse_style": "smooth and emotional",
        "chorus_repeat": 2,
    },
    "country": {
        "intro": "Well now...",
        "verse_style": "storytelling and heartfelt",
        "chorus_repeat": 2,
    },
    "lofi": {
        "intro": "Mmm...",
        "verse_style": "chill and relaxed",
        "chorus_repeat": 1,
    },
    "ambient": {
        "intro": "Aah...",
        "verse_style": "ethereal and dreamy",
        "chorus_repeat": 1,
    },
    "bollywood": {
        "intro": "La la la la...",
        "verse_style": "dramatic and melodic",
        "chorus_repeat": 2,
    },
    "indian_classical": {
        "intro": "Sa re ga ma...",
        "verse_style": "traditional and spiritual",
        "chorus_repeat": 1,
    },
}

# Voices suited for different singing styles
SINGING_VOICES = {
    "male_pop": {"voice": "en-US-GuyNeural", "rate": "-15%", "pitch": "+2Hz"},
    "female_pop": {"voice": "en-US-AriaNeural", "rate": "-15%", "pitch": "+5Hz"},
    "male_deep": {"voice": "en-US-GuyNeural", "rate": "-20%", "pitch": "-8Hz"},
    "female_soft": {"voice": "en-US-JennyNeural", "rate": "-20%", "pitch": "+3Hz"},
    "male_british": {"voice": "en-GB-RyanNeural", "rate": "-15%", "pitch": "+0Hz"},
    "female_british": {"voice": "en-GB-SoniaNeural", "rate": "-15%", "pitch": "+3Hz"},
    "hindi_female": {"voice": "hi-IN-SwaraNeural", "rate": "-15%", "pitch": "+3Hz"},
    "hindi_male": {"voice": "hi-IN-MadhurNeural", "rate": "-15%", "pitch": "+0Hz"},
}


def _generate_lyrics(prompt: str, genre: str = "") -> str:
    """
    Generate song lyrics based on the user's prompt and genre.
    Creates a structured song with verse, chorus, and bridge.
    """
    genre_info = SONG_STRUCTURES.get(genre, SONG_STRUCTURES.get("pop"))
    
    # Extract key themes from the prompt
    theme = prompt.strip()
    
    # Build the lyrics
    lines = []
    
    # Intro
    if genre_info["intro"]:
        lines.append(genre_info["intro"])
        lines.append("")
    
    # Verse 1
    lines.append(f"Verse 1:")
    lines.append(f"I feel the rhythm of {theme},")
    lines.append(f"It's calling out to me tonight,")
    lines.append(f"Every moment, every heartbeat,")
    lines.append(f"Makes everything feel so right.")
    lines.append("")
    
    # Chorus
    lines.append(f"Chorus:")
    lines.append(f"Oh, {theme}!")
    lines.append(f"You light up my world like the stars above,")
    lines.append(f"Oh, {theme}!")
    lines.append(f"This feeling is more than enough.")
    lines.append("")
    
    # Verse 2
    lines.append(f"Verse 2:")
    lines.append(f"Through the highs and all the lows,")
    lines.append(f"With {theme} the music flows,")
    lines.append(f"We dance beneath the moonlit sky,")
    lines.append(f"Let all our worries pass us by.")
    lines.append("")
    
    # Chorus repeat
    lines.append(f"Chorus:")
    lines.append(f"Oh, {theme}!")
    lines.append(f"You light up my world like the stars above,")
    lines.append(f"Oh, {theme}!")
    lines.append(f"This feeling is more than enough.")
    lines.append("")
    
    # Bridge
    lines.append(f"Bridge:")
    lines.append(f"And when the night is over,")
    lines.append(f"We'll remember {theme} forever,")
    lines.append(f"Together we'll shine so bright.")
    lines.append("")
    
    # Final Chorus
    lines.append(f"Final Chorus:")
    lines.append(f"Oh, {theme}!")
    lines.append(f"You light up my world like the stars above,")
    lines.append(f"Oh, {theme}!")
    lines.append(f"This feeling is more than enough!")
    
    return "\n".join(lines)


def _format_lyrics_for_singing(lyrics: str) -> str:
    """
    Format lyrics for TTS singing: add pauses, musical markers.
    Remove section labels and add proper musical pacing.
    """
    lines = lyrics.split('\n')
    singing_lines = []
    
    for line in lines:
        line = line.strip()
        # Skip empty lines and section labels
        if not line:
            continue
        if line.endswith(':') and any(label in line.lower() for label in ['verse', 'chorus', 'bridge', 'intro', 'final']):
            singing_lines.append("...")  # Musical pause between sections
            continue
        
        # Add the line with musical styling
        singing_lines.append(f"♪ {line} ♪")
    
    return " ... ".join(singing_lines)


async def generate_song(prompt: str, genre: str = "", duration: int = 10):
    """
    Generate a song with lyrics:
    1. Generate lyrics based on prompt and genre
    2. Use edge-tts to sing the lyrics with musical voice styling
    """
    # Step 1: Generate lyrics
    lyrics = _generate_lyrics(prompt, genre)
    
    # Step 2: Format for singing
    singing_text = _format_lyrics_for_singing(lyrics)
    
    # Step 3: Pick a voice based on genre
    if genre in ("bollywood", "indian_classical"):
        voice_options = ["hindi_female", "hindi_male"]
    elif genre in ("rock", "hiphop"):
        voice_options = ["male_deep", "male_pop"]
    elif genre in ("rnb", "jazz", "lofi"):
        voice_options = ["female_soft", "female_pop"]
    else:
        voice_options = list(SINGING_VOICES.keys())
    
    voice_key = random.choice(voice_options)
    voice_config = SINGING_VOICES[voice_key]
    
    # Step 4: Generate the audio
    filename = f"song_{uuid.uuid4().hex[:8]}.mp3"
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    try:
        communicate = edge_tts.Communicate(
            singing_text,
            voice_config["voice"],
            rate=voice_config["rate"],
            pitch=voice_config["pitch"],
        )
        await communicate.save(filepath)
        
        return {
            "filename": filename,
            "url": f"/static/audio/{filename}",
            "prompt": prompt,
            "genre": genre,
            "lyrics": lyrics,
            "voice": voice_key,
            "status": "success"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": f"Song generation failed: {str(e)}"
        }


async def generate_song_with_custom_lyrics(lyrics: str, genre: str = "", voice_type: str = ""):
    """
    Generate a song from user-provided lyrics.
    """
    singing_text = _format_lyrics_for_singing(lyrics)
    
    # Pick voice
    if voice_type and voice_type in SINGING_VOICES:
        voice_config = SINGING_VOICES[voice_type]
    elif genre in ("bollywood", "indian_classical"):
        voice_config = SINGING_VOICES[random.choice(["hindi_female", "hindi_male"])]
    else:
        voice_config = SINGING_VOICES[random.choice(list(SINGING_VOICES.keys()))]
    
    filename = f"song_{uuid.uuid4().hex[:8]}.mp3"
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    try:
        communicate = edge_tts.Communicate(
            singing_text,
            voice_config["voice"],
            rate=voice_config["rate"],
            pitch=voice_config["pitch"],
        )
        await communicate.save(filepath)
        
        return {
            "filename": filename,
            "url": f"/static/audio/{filename}",
            "lyrics": lyrics,
            "genre": genre,
            "status": "success"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": f"Song generation failed: {str(e)}"
        }


def get_genres():
    """Return available music genres."""
    return [
        {"id": "pop", "name": "Pop", "emoji": "🎤"},
        {"id": "rock", "name": "Rock", "emoji": "🎸"},
        {"id": "jazz", "name": "Jazz", "emoji": "🎷"},
        {"id": "classical", "name": "Classical", "emoji": "🎻"},
        {"id": "electronic", "name": "Electronic", "emoji": "🎹"},
        {"id": "hiphop", "name": "Hip Hop", "emoji": "🎧"},
        {"id": "rnb", "name": "R&B", "emoji": "🎵"},
        {"id": "country", "name": "Country", "emoji": "🤠"},
        {"id": "lofi", "name": "Lo-Fi", "emoji": "☕"},
        {"id": "ambient", "name": "Ambient", "emoji": "🌊"},
        {"id": "bollywood", "name": "Bollywood", "emoji": "🎬"},
        {"id": "indian_classical", "name": "Indian Classical", "emoji": "🪷"},
    ]


def get_singing_voices():
    """Return available singing voice types."""
    return [
        {"id": "female_pop", "name": "Female Pop", "emoji": "👩‍🎤"},
        {"id": "male_pop", "name": "Male Pop", "emoji": "👨‍🎤"},
        {"id": "female_soft", "name": "Female Soft", "emoji": "🎶"},
        {"id": "male_deep", "name": "Male Deep", "emoji": "🎵"},
        {"id": "female_british", "name": "Female British", "emoji": "🇬🇧"},
        {"id": "male_british", "name": "Male British", "emoji": "🇬🇧"},
        {"id": "hindi_female", "name": "Hindi Female", "emoji": "🇮🇳"},
        {"id": "hindi_male", "name": "Hindi Male", "emoji": "🇮🇳"},
    ]
