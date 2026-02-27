import os
import uuid
import asyncio
import edge_tts
import random
from deep_translator import GoogleTranslator

OUTPUT_DIR = "static/audio"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Enhanced Story Data with Adjectives, Scene Bridges, and Richer Segments
STORY_DATA = {
    "kid_comic": {
        "title": "The Wacky Chronicles",
        "adjectives": ["bouncy", "giggling", "fluorescent", "wobbling", "marshmallowy", "electric", "squeaky"],
        "characters": ["Marshmallow Rabbit", "Giggling Robot", "Bouncy Tiger", "Flying Pancake", "Dancing Cactus", "Sir Laughs-a-Lot"],
        "settings": ["Candy Kingdom", "Bubble Galaxy", "Neon Playground", "Floating Jelly Islands", "Magic Toaster Forest"],
        "objects": ["Squeaky Spoon", "Rainbow Hat", "Invisible Cloak of Giggles", "Glow-in-the-dark Cupcake", "Magic Hover-Board"],
        "bridges": [
            "Then, with a sudden wiggle, the scene shifted dramatically.",
            "Without warning, a shower of sparkles filled the air as they moved forward.",
            "The journey continued through a field of talking sunflowers.",
            "It was then that they discovered a hidden path made of chocolate."
        ],
        "acts": [
            "The {character} found a {object} that smelled like {setting}.",
            "A friendly {character} joined the quest, carrying a basket of {object}s.",
            "They had to solve the riddle of the {setting} to open the secret door.",
            "Suddenly, they were surrounded by a swarm of friendly fireflies."
        ],
        "conflict": [
            "A grumpy cloud appeared and tried to rain on the {setting}!",
            "The tickle monster arrived, demanding a tribute of {object}s!",
            "They reached a giant wall of purple jelly that wouldn't let them pass."
        ],
        "resolution": [
            "With a loud laugh and a silly dance, the wall melted into juice!",
            "The cloud turned into a rainbow, and everyone received a {object}.",
            "The mystery was solved with the power of kindness and a spare {object}."
        ]
    },
    "mystery": {
        "title": "The Enigma Files",
        "adjectives": ["shadowy", "ancient", "encrypted", "clandestine", "enigmatic", "shrouded", "silent"],
        "characters": ["Private Investigator", "Curious Librarian", "Shadowy Figure", "Antique Dealer", "Master Decoder"],
        "settings": ["Foggy Harbor", "Abandoned Clock Tower", "Old Library Basement", "Secret Underground Bunker", "Misty Moors"],
        "objects": ["Silver Key", "Ancient Map", "Coded Message", "Pocket Watch", "Locked Diary", "Broken Lens"],
        "bridges": [
            "The trail grew colder, but a faint whisper led them further.",
            "Every shadow seemed to hold a secret as they navigated the {setting}.",
            "A sudden click echoed through the hall, signaling a new discovery.",
            "The clues finally began to align like stars in the night sky."
        ],
        "acts": [
            "A mysterious letter arrived, written in invisible ink.",
            "They discovered a hidden compartment inside the {object}.",
            "The {character} noticed that the footprints led directly to the {setting}.",
            "In the corner of the room, a dusty {object} began to vibrate."
        ],
        "conflict": [
            "A masked phantom stepped out of the darkness, blocking the exit.",
            "The rival collector appeared, claiming the {object} was theirs!",
            "The floor beneath them began to shift, revealing a hidden trap."
        ],
        "resolution": [
            "The final piece of the puzzle clicked into place, revealing the truth.",
            "The {character} secured the {object} just as the phantom vanished.",
            "Justice was served, and the secrets of the {setting} were safely locked away."
        ]
    }
    # (Other genres would be expanded similarly in a real system, prioritizing depth for these core ones)
}

# Fallback for requested genres not explicitly expanded here
GENRE_MAP = {
    "thriller": "mystery",
    "horror": "mystery",
    "moral": "kid_comic"
}

async def generate_story(genre: str, topic: str = "", age_group: str = "child", language: str = "en", duration: int = 3):
    """
    Generate a creative, non-repetitive story with accurate duration scaling.
    duration: target length in minutes.
    """
    mapped_genre = GENRE_MAP.get(genre, genre)
    genre_data = STORY_DATA.get(mapped_genre, STORY_DATA["kid_comic"])
    
    # Target word count (Avg speed: 130-150 words per minute)
    target_words = duration * 140
    current_words = 0
    story_segments = []
    used_segments = set()

    def get_unique(key):
        options = genre_data.get(key, ["something"])
        # Filter out used segments to avoid repetition
        available = [o for o in options if o not in used_segments]
        if not available:
            available = options # Reset if we run out
        choice = random.choice(available)
        used_segments.add(choice)
        return choice

    # Context for formatting
    context = {
        "character": random.choice(genre_data["characters"]),
        "setting": random.choice(genre_data["settings"]),
        "object": random.choice(genre_data["objects"]),
        "adj": random.choice(genre_data["adjectives"])
    }

    # 1. Intro
    intro_style = f"In the {context['adj']} {context['setting']}, a {context['character']} was searching for the {context['object']}."
    if topic:
        story_segments.append(f"Once, there was a legend about {topic}. {intro_style}")
    else:
        story_segments.append(intro_style)
    
    current_words += len(story_segments[-1].split())

    # 2. Acts (Body) - Scaling Loop
    # We add acts and bridges until we hit ~70% of target words
    while current_words < target_words * 0.7:
        bridge = get_unique("bridges")
        act = get_unique("acts").format(**context)
        # Add a random adjective to keep it fresh
        adj = random.choice(genre_data["adjectives"])
        segment = f"{bridge} The {adj} atmosphere grew as {act}"
        
        story_segments.append(segment)
        current_words += len(segment.split())
        
        # Safety break for very short genres
        if len(used_segments) > 20: break 

    # 3. Conflict (Climax)
    conflict = random.choice(genre_data["conflict"]).format(**context)
    story_segments.append(f"Suddenly, the situation reached a boiling point. {conflict}")
    current_words += len(story_segments[-1].split())

    # 4. Resolution
    resolution = random.choice(genre_data["resolution"]).format(**context)
    story_segments.append(f"After a moment of tension, everything changed. {resolution}")
    
    # 5. Epilogue (Ensure duration)
    if current_words < target_words:
        epilogue = f"The {context['character']} looked out over the {context['setting']}, knowing that the {context['object']} would remain a symbol of their {context['adj']} journey forever."
        story_segments.append(epilogue)

    story_text = " ".join(story_segments)
    
    # Final Translation
    final_text = story_text
    if language != "en":
        try:
            translator = GoogleTranslator(source='en', target=language)
            final_text = translator.translate(story_text)
        except Exception as e:
            print(f"Story translation failed: {e}")
            
    # Voice Selection
    from translate_service import LANGUAGE_VOICES
    voice = LANGUAGE_VOICES.get(language, LANGUAGE_VOICES["en"])["voice"]
    
    # Synthesis
    filename = f"story_{uuid.uuid4().hex[:8]}.mp3"
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    try:
        communicate = edge_tts.Communicate(final_text, voice)
        await communicate.save(filepath)
        
        return {
            "status": "success",
            "title": f"{genre_data['title']} ({language})",
            "story": final_text,
            "filename": filename,
            "url": f"/static/audio/{filename}",
            "genre": genre,
            "language": language,
            "topic": topic,
            "word_count": len(final_text.split()),
            "estimated_duration": duration
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

def get_story_genres():
    # Return available genres based on STORY_DATA + GENRE_MAP
    all_genres = list(STORY_DATA.keys()) + list(GENRE_MAP.keys())
    return [{"id": k, "label": k.replace('_', ' ').capitalize()} for k in sorted(set(all_genres))]
