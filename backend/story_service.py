import os
import uuid
import asyncio
import edge_tts
import random
from deep_translator import GoogleTranslator

OUTPUT_DIR = "static/audio"
os.makedirs(OUTPUT_DIR, exist_ok=True)

STORY_GENRES = {
    "kid_comic": {
        "title": "Funny Adventures",
        "style": "playful and silly",
        "intro": ["Once upon a time in a land made of {setting}, a brave {character} decided to find the legendary {object}.", "In a world where everything was {setting}, a {character} woke up with a {object} stuck to their head!"],
        "conflict": ["Suddenly, a giant {villain} appeared and tried to steal all the {resource}!", "But they realized that the {object} was actually a hidden {twist}!"],
        "resolution": ["With a loud laugh and a silly dance, they saved the day and everyone celebrated with {reward}.", "They learned that {setting} is best shared with friends, especially when you have a {object}."],
        "characters": ["marshmallow rabbit", "giggling robot", "bouncy tiger", "flying pancake", "dancing cactus"],
        "settings": ["candy", "bubbles", "neon lights", "floating islands", "jelly"],
        "objects": ["chocolate river", "squeaky toy", "rainbow hat", "magic spoon", "invisible cloak"],
        "villains": ["grumpy cloud", "tickle monster", "sour grape"],
        "resources": ["giggles", "sparkles", "colors"],
        "twists": ["map to a pizza party", "portal to another dimension"],
        "reward": ["ice cream rain", "infinite bounce-time"]
    },
    "mystery": {
        "title": "The Secret Case",
        "style": "suspenseful and intriguing",
        "intro": ["Shadows lengthened in the {setting}. The {character} noticed a missing {object}. Only the sound of a ticking clock broke the silence.", "A mysterious letter arrived at midnight at the {setting} for the {character}. It spoke of a hidden {object}."],
        "conflict": ["They followed a trail of {clue} that led them straight to the {villain}'s lair.", "Suddenly, the {object} began to glow, revealing a {twist} that changed everything."],
        "resolution": ["The truth was finally revealed, and the {character} returned the {object} to its rightful place.", "The mystery was solved, but the {character} knew that some secrets of the {setting} were better left untouched."],
        "characters": ["private investigator", "curious librarian", "shadowy figure", "antique dealer", "clockmaker"],
        "settings": ["old library", "abandoned manor", "foggy harbor", "ancient clock tower"],
        "objects": ["silver key", "ancient map", "coded message", "pocket watch", "locked diary"],
        "clue": ["blue ink", "mechanical gears", "faded footprints"],
        "villains": ["masked phantom", "greedy collector", "silent rival"],
        "twists": ["key to a different door", "fake artifact"]
    },
    "thriller": {
        "title": "The Edge of Time",
        "style": "fast-paced and tense",
        "intro": ["The {character} knew they were being followed through the {setting}. They had the {object} in their hand.", "The clock was counting down to zero as the {character} arrived at the {setting}. Everything depended on the {object}."],
        "conflict": ["The {villain} blocked their path, demanding the {object}. A high-stakes chase through the {setting} began.", "Just as they reached safety, the {twist} was revealed—they had been betrayed from within!"],
        "resolution": ["With seconds to spare, the {character} activated the {object} and escaped the {villain}.", "The mission was a success, but the {character} would never forget the cost of protecting the {object}."],
        "characters": ["special agent", "determined runaway", "last witness", "tech genius", "expert pilot"],
        "settings": ["rainy rooftop", "underground bunker", "fast-moving train", "high-tech lab"],
        "objects": ["stolen data", "mysterious serum", "forbidden device", "encrypted chip"],
        "villains": ["rogue commander", "shadowy syndicate", "merciless hunter"],
        "twists": ["decoy", "tracking device"]
    },
    "horror": {
        "title": "Whispers in the Dark",
        "style": "chilling and eerie",
        "intro": ["The door to the {setting} creaked open by itself. The {character} felt a cold hand on their shoulder.", "In the basement of the {setting}, the {character} found a {object} that began to glow with a sickly green light."],
        "conflict": ["Suddenly, the lights flickered and the {villain} emerged from the shadows.", "A terrifying {twist} emerged as the {character} realized they weren't alone in the {setting}."],
        "resolution": ["They dropped the {object} and ran, never looking back at the horrors of the {setting}.", "The sun finally rose, but the {character} knew the {villain} was still out there, waiting in the {setting}."],
        "characters": ["lost traveler", "brave teenager", "skeptical ghost hunter", "caretaker", "paranormal expert"],
        "settings": ["asylum", "old woods", "forgotten cemetery", "derelict ship"],
        "objects": ["cracked mirror", "old doll", "bleeding portrait", "cursed amulet"],
        "villains": ["wailing lady", "tall man", "unseen presence"],
        "twists": ["trapped exit", "endless hallway"]
    },
    "moral": {
        "title": "The Wise Lesson",
        "style": "educational and reflective",
        "intro": ["A young {character} lived in the peaceful {setting}, always dreaming of finding a {object}.", "In the heart of the {setting}, a wise {character} guarded the ancient {object}."],
        "conflict": ["One day, the {character} met a {villain} who tried to trick them into giving away the {object}.", "As they faced the challenge, they realized that the {object} was not as important as their {resolution_theme}."],
        "resolution": ["The {character} learned that {resolution_theme} is more valuable than any {object}.", "By choosing {resolution_theme}, the {character} found true happiness in the {setting}."],
        "characters": ["wise turtle", "small sparrow", "helpful villager", "young apprentice", "kind gardener"],
        "settings": ["green valley", "whispering forest", "mountain village", "sunny meadow"],
        "objects": ["golden apple", "shared basket", "simple gift", "old seed"],
        "villains": ["selfish fox", "greedy crow"],
        "resolution_theme": ["honesty", "kindness", "sharing", "patience", "hard work"]
    }
}

async def generate_story(genre: str, topic: str = "", age_group: str = "child", language: str = "en", duration: int = 2):
    """
    Generate a story based on genre, custom topic, and narrate it.
    duration: approximate length in minutes (not strict but influences content)
    """
    genre_data = STORY_GENRES.get(genre, STORY_GENRES["moral"])
    
    def get_rand(key):
        return random.choice(genre_data.get(key, ["something"]))

    # Build unique story segments
    context = {
        "character": get_rand("characters"),
        "setting": get_rand("settings"),
        "object": get_rand("objects"),
        "villain": get_rand("villains") if "villains" in genre_data else "rival",
        "resource": get_rand("resources") if "resources" in genre_data else "treasure",
        "twist": get_rand("twists") if "twists" in genre_data else "secret",
        "reward": get_rand("reward") if "reward" in genre_data else "peace",
        "clue": get_rand("clue") if "clue" in genre_data else "sign",
        "resolution_theme": get_rand("resolution_theme") if "resolution_theme" in genre_data else "wisdom"
    }

    intro = random.choice(genre_data["intro"]).format(**context)
    conflict = random.choice(genre_data["conflict"]).format(**context)
    resolution = random.choice(genre_data["resolution"]).format(**context)

    # Scale story based on duration
    # For longer stories, add "And then..." expansions
    expansions = [
        f"As the {context['character']} moved forward, they encountered a series of unexpected challenges.",
        f"They pondered the meaning of the {context['object']} while resting in the {context['setting']}.",
        f"The {context['villain']} was watching from afar, plotting their next move."
    ]
    
    if topic:
        story_segments = [f"This is a story about {topic}.", intro]
    else:
        story_segments = [intro]

    # Add middle segments to stretch duration
    loops = max(1, duration // 1) # roughly 1 loop per minute of text
    for i in range(loops):
        story_segments.append(random.choice(expansions))
        if i == loops // 2:
            story_segments.append(conflict)
    
    story_segments.append(resolution)
    
    if topic:
        story_segments.append(f"And that is how {topic} led to an unforgettable adventure.")

    story_text = " ".join(story_segments)
    
    # Translate if needed
    final_text = story_text
    if language != "en":
        try:
            translator = GoogleTranslator(source='en', target=language)
            final_text = translator.translate(story_text)
        except Exception as e:
            print(f"Story translation failed: {e}")
            
    # Narrative based on language
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
            "duration_req": duration
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

def get_story_genres():
    return [{"id": k, "label": k.replace('_', ' ').capitalize()} for k in STORY_GENRES.keys()]
