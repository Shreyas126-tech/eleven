import os
import uuid
import asyncio
import edge_tts
import random
from deep_translator import GoogleTranslator
from pydub import AudioSegment
from pydub.generators import Sine, Square, Sawtooth, Triangle, WhiteNoise
import imageio_ffmpeg

# Configure pydub to use bundled FFmpeg
ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
AudioSegment.converter = ffmpeg_exe
# Also set ffprobe path explicitly for better Windows compatibility
os.environ["PATH"] += os.pathsep + os.path.dirname(ffmpeg_exe)

# Import language mapping from translate_service to reuse voice definitions
from translate_service import LANGUAGE_VOICES

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

# ============= Lyrics Templates by Genre =============
SONG_STRUCTURES = {
    "pop": {
        "intro": "Yeah, yeah, yeah...",
        "verse_style": "upbeat and catchy",
        "chorus_repeat": 2,
        "tempo": 120,
        "key_notes": [261.63, 329.63, 392.00, 329.63],  # C E G E
    },
    "rock": {
        "intro": "Woah oh oh...",
        "verse_style": "powerful and energetic",
        "chorus_repeat": 2,
        "tempo": 140,
        "key_notes": [164.81, 196.00, 246.94, 293.66],  # E G B D
    },
    "jazz": {
        "intro": "Ba da ba da...",
        "verse_style": "smooth and soulful",
        "chorus_repeat": 1,
        "tempo": 90,
        "key_notes": [261.63, 311.13, 392.00, 466.16],  # C Eb G Bb
    },
    "classical": {
        "intro": "",
        "verse_style": "elegant and poetic",
        "chorus_repeat": 1,
        "tempo": 72,
        "key_notes": [261.63, 329.63, 392.00, 523.25],  # C E G C5
    },
    "electronic": {
        "intro": "Da da da da...",
        "verse_style": "rhythmic and futuristic",
        "chorus_repeat": 2,
        "tempo": 128,
        "key_notes": [220.00, 277.18, 329.63, 440.00],  # A C# E A5
    },
    "hiphop": {
        "intro": "Yo, yo, yo...",
        "verse_style": "rhythmic and bold",
        "chorus_repeat": 2,
        "tempo": 95,
        "key_notes": [146.83, 174.61, 220.00, 261.63],  # D F A C
    },
    "rnb": {
        "intro": "Ooh baby...",
        "verse_style": "smooth and emotional",
        "chorus_repeat": 2,
        "tempo": 85,
        "key_notes": [196.00, 246.94, 293.66, 392.00],  # G B D G5
    },
    "country": {
        "intro": "Well now...",
        "verse_style": "storytelling and heartfelt",
        "chorus_repeat": 2,
        "tempo": 110,
        "key_notes": [293.66, 369.99, 440.00, 293.66],  # D F# A D
    },
    "lofi": {
        "intro": "Mmm...",
        "verse_style": "chill and relaxed",
        "chorus_repeat": 1,
        "tempo": 75,
        "key_notes": [220.00, 261.63, 329.63, 392.00],  # A C E G
    },
    "ambient": {
        "intro": "Aah...",
        "verse_style": "ethereal and dreamy",
        "chorus_repeat": 1,
        "tempo": 60,
        "key_notes": [196.00, 261.63, 329.63, 493.88],  # G C E B
    },
    "bollywood": {
        "intro": "La la la la...",
        "verse_style": "dramatic and melodic",
        "chorus_repeat": 2,
        "tempo": 130,
        "key_notes": [261.63, 293.66, 349.23, 392.00],  # C D F G
    },
    "indian_classical": {
        "intro": "Sa re ga ma...",
        "verse_style": "traditional and spiritual",
        "chorus_repeat": 1,
        "tempo": 70,
        "key_notes": [261.63, 293.66, 329.63, 392.00],  # Sa Re Ga Pa
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
    "kannada_female": {"voice": "kn-IN-SapnaNeural", "rate": "-15%", "pitch": "+3Hz"},
    "kannada_male": {"voice": "kn-IN-GaganNeural", "rate": "-15%", "pitch": "+0Hz"},
}

# Emotional prosody offsets for dynamic singing
EMOTIONAL_PRESETS = {
    "intro": {"rate": "-20%", "pitch": "-2Hz", "volume": -2},
    "verse": {"rate": "-10%", "pitch": "+0Hz", "volume": 0},
    "chorus": {"rate": "-5%", "pitch": "+15Hz", "volume": +2},
    "bridge": {"rate": "-15%", "pitch": "+5Hz", "volume": +1},
    "final": {"rate": "-5%", "pitch": "+20Hz", "volume": +3},
    "outro": {"rate": "-25%", "pitch": "-5Hz", "volume": -3},
    "default": {"rate": "-10%", "pitch": "+0Hz", "volume": 0}
}


def _parse_lyrics_into_sections(lyrics: str) -> list:
    """Split lyrics into logical sections (Verse, Chorus, etc.) for sectional synthesis."""
    lines = lyrics.split('\n')
    sections = []
    current_section = {"type": "default", "lines": []}
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        lower_line = line.lower()
        new_section_type = None
        
        if "intro" in lower_line: new_section_type = "intro"
        elif "verse" in lower_line: new_section_type = "verse"
        elif "chorus" in lower_line: 
            if "final" in lower_line: new_section_type = "final"
            else: new_section_type = "chorus"
        elif "bridge" in lower_line: new_section_type = "bridge"
        elif "outro" in lower_line: new_section_type = "outro"
        
        if new_section_type and (line.endswith(':') or len(line.split()) <= 2):
            if current_section["lines"]:
                sections.append(current_section)
            current_section = {"type": new_section_type, "lines": []}
        else:
            current_section["lines"].append(line)
            
    if current_section["lines"]:
        sections.append(current_section)
        
    return sections


def _generate_lyrics(prompt: str, genre: str = "", language: str = "en") -> str:
    """Generate song lyrics based on the user's prompt and genre."""
    genre_info = SONG_STRUCTURES.get(genre, SONG_STRUCTURES.get("pop"))
    theme = prompt.strip()
    
    # Templates in Kannada for Bollywood/Indian Classical if requested
    if language == "kn":
        if genre == "bollywood":
            lines = [
                "Intro: ಸರಿಗಮಪದನಿಸ...",
                "",
                f"Verse 1:",
                f"ಈ {theme} ಪ್ರೀತಿ ತಂದಿದೆ,",
                f"ಹೃದಯದ ಮಾತು ಕೇಳು ನೀನು,",
                f"ಪ್ರತಿ ಕ್ಷಣವೂ ನಿನ್ನ ನೆನಪೇ,",
                f"ನಿನಗಾಗಿ ಹಾಡು ಹಾಡುವೆ ನಾನು.",
                "",
                f"Chorus:",
                f"ಓ ಓ {theme}!",
                f"ನನ್ನ ಜೀವನದ ಬೆಳಕು ನೀನು,",
                f"ಓ ಓ {theme}!",
                f"ಈ ಪ್ರೀತಿ ಎಂದಿಗೂ ಮಾಸದು.",
                "",
                f"Verse 2:",
                f"ಕನಸಿನ ಲೋಕದ ಪಯಣ ಇದು,",
                f"ನಮ್ಮಿಬ್ಬರ ಪ್ರೇಮ ಕಾವ್ಯ ಇದು,",
                f"ಚಂದಿರನ ಬೆಳಕಿನ ಕೆಳಗೆ ನೃತ್ಯ,",
                f"ಸದಾ ಕಾಲವೂ ಹಸಿರಾಗಿರಲಿ ಸತ್ಯ.",
                "",
                f"Chorus:",
                f"ಓ ಓ {theme}!",
                f"ನನ್ನ ಜೀವನದ ಬೆಳಕು ನೀನು,",
                f"ಓ ಓ {theme}!",
                f"ಈ ಪ್ರೀತಿ ಎಂದಿಗೂ ಮಾಸದು."
            ]
            return "\n".join(lines)
        elif genre == "indian_classical":
            lines = [
                "ಸ ರಿ ಗ ಮ ಪ ದ ನಿ ಸ...",
                "",
                f"ಪಲ್ಲವಿ:",
                f"ಆನಂದ {theme} ರಾಗ ಸುಧೆ,",
                f"ಮನದಲಿ ತುಂಬಿದ ಶಾಂತಿ ಮನೆ,",
                f"ಗುರುವಿನ ಸಾನ್ನಿಧ್ಯದ ಪರಮ ಸುಖ,",
                f"ದೈವಿಕ ಆರಾಧನೆಯ ಚೇತನ ಮುಖ.",
                "",
                f"ಅನುಪಲ್ಲವಿ:",
                f"ಸಂಗೀತ ಗಂಗೆಯ ಪಾವನ ತಟದಲಿ,",
                f"ಭಕ್ತಿಯ ಭಾವದ ಈ ಲಹರಿಯಲಿ,",
                f"ಲಯಬದ್ಧ ಹೆಜ್ಜೆಗಳ ನಾದದಲಿ,",
                f"ಲೀನವಾಗೋಣ ನಾವೆಲ್ಲರೂ ಈ ಸನ್ನಿಧಿಯಲಿ.",
                "",
                f"ಚರಣ:",
                f"{theme} ನಾದವ ತುಂಬಿರಲಿ,",
                f"ಬದುಕಿನಲ್ಲಿ ಸುಖ ಶಾಂತಿ ಸದಾ ಇರಲಿ."
            ]
            return "\n".join(lines)

    lines = []
    
    if genre_info["intro"]:
        lines.append(genre_info["intro"])
        lines.append("")
    
    lines.append(f"Verse 1:")
    lines.append(f"I feel the rhythm of {theme},")
    lines.append(f"It's calling out to me tonight,")
    lines.append(f"Every moment, every heartbeat,")
    lines.append(f"Makes everything feel so right.")
    lines.append("")
    
    lines.append(f"Chorus:")
    lines.append(f"Oh, {theme}!")
    lines.append(f"You light up my world like the stars above,")
    lines.append(f"Oh, {theme}!")
    lines.append(f"This feeling is more than enough.")
    lines.append("")
    
    lines.append(f"Verse 2:")
    lines.append(f"Through the highs and all the lows,")
    lines.append(f"With {theme} the music flows,")
    lines.append(f"We dance beneath the moonlit sky,")
    lines.append(f"Let all our worries pass us by.")
    lines.append("")
    
    lines.append(f"Chorus:")
    lines.append(f"Oh, {theme}!")
    lines.append(f"You light up my world like the stars above,")
    lines.append(f"Oh, {theme}!")
    lines.append(f"This feeling is more than enough.")
    lines.append("")
    
    lines.append(f"Bridge:")
    lines.append(f"And when the night is over,")
    lines.append(f"We'll remember {theme} forever,")
    lines.append(f"Together we'll shine so bright.")
    lines.append("")
    
    lines.append(f"Final Chorus:")
    lines.append(f"Oh, {theme}!")
    lines.append(f"You light up my world like the stars above,")
    lines.append(f"Oh, {theme}!")
    lines.append(f"This feeling is more than enough!")
    lines.append("")
    
    lines.append(f"Outro:")
    lines.append(f"{theme}... forever in my heart.")
    lines.append(f"Yeah, {theme}.")
    
    return "\n".join(lines)


def _format_lyrics_for_singing(lyrics: str) -> str:
    """Format lyrics for TTS singing by removing structural labels."""
    lines = lyrics.split('\n')
    singing_lines = []
    
    # Structural keywords to strip
    tags_to_strip = ['verse', 'chorus', 'bridge', 'intro', 'outro', 'final', 'hook']
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check if line is a structural tag
        lower_line = line.lower()
        is_tag = any(tag + ":" in lower_line for tag in tags_to_strip) or \
                 (len(line.split()) <= 2 and any(tag in lower_line for tag in tags_to_strip))
        
        if is_tag:
            continue
            
        # Clean line and add musical cues
        clean_line = line.strip('♪ ')
        singing_lines.append(f"♪ {clean_line} ♪")
    
    return " ... ".join(singing_lines)


def _generate_background_music(genre: str, duration_ms: int) -> AudioSegment:
    """
    Generate sophisticated background music using procedural synthesis.
    Creates unique textures, melodies, and drum patterns based on the genre.
    """
    genre_info = SONG_STRUCTURES.get(genre, SONG_STRUCTURES.get("pop"))
    tempo = genre_info.get("tempo", 120)
    notes = genre_info.get("key_notes", [261.63, 329.63, 392.00, 329.63])
    
    beat_ms = int(60000 / tempo)
    bar_ms = beat_ms * 4
    
    # 1. Procedural Drum Kit Synthesis
    def get_kick():
        # Punchy low sine swoop
        k = Sine(60).to_audio_segment(duration=100, volume=-10).fade_out(80)
        return k + AudioSegment.silent(duration=beat_ms - 100)

    def get_snare():
        # Noise burst for snare
        s = WhiteNoise().to_audio_segment(duration=80, volume=-15).high_pass_filter(1000).fade_out(60)
        return s + AudioSegment.silent(duration=beat_ms - 80)

    def get_hat():
        # High pitched noise tick
        h = WhiteNoise().to_audio_segment(duration=30, volume=-22).high_pass_filter(5000).fade_out(20)
        return h + AudioSegment.silent(duration=beat_ms // 2 - 30)

    # 2. Generator Selection by Genre
    gen_map = {
        "rock": Sawtooth,
        "electronic": Square,
        "pop": Triangle,
        "hiphop": Square,
        "lofi": Square,
        "jazz": Sine,
        "bollywood": Sine,
        "indian_classical": Sine,
    }
    Generator = gen_map.get(genre, Sine)
    
    # Base volume for genre
    vol = -24
    if genre in ["rock", "electronic", "hiphop"]: vol = -20
    if genre == "lofi": vol = -28
    
    # 3. Build a 1-bar pattern
    bar = AudioSegment.silent(duration=bar_ms)
    
    # A. Harmonic/Melodic Layer
    for i, freq in enumerate(notes):
        # Instrument 1: Main Chord/Lead
        inst1 = Generator(freq).to_audio_segment(duration=beat_ms, volume=vol).fade_out(50)
        
        # Instrument 2: Sub-harmonic or Octave
        if genre in ["rock", "electronic"]:
            inst2 = Sawtooth(freq / 2).to_audio_segment(duration=beat_ms, volume=vol-6).fade_out(50)
            inst1 = inst1.overlay(inst2)
        elif genre in ["bollywood", "indian_classical"]:
            inst2 = Sine(freq * 2).to_audio_segment(duration=beat_ms, volume=vol-10).fade_out(50)
            inst1 = inst1.overlay(inst2)
            
        bar = bar.overlay(inst1, position=i * beat_ms)

    # B. Rhythmic Layer (Drums)
    if genre in ["pop", "rock", "hiphop", "electronic", "bollywood"]:
        # Standard 4/4: Kick on 1 & 3, Snare on 2 & 4
        bar = bar.overlay(get_kick(), position=0)
        bar = bar.overlay(get_snare(), position=beat_ms)
        bar = bar.overlay(get_kick(), position=beat_ms * 2)
        bar = bar.overlay(get_snare(), position=beat_ms * 3)
        
        # Hi-hats every half beat
        for h_step in range(8):
            bar = bar.overlay(get_hat(), position=h_step * (beat_ms // 2))

    elif genre == "lofi":
        # Boom-bap: Kick on 1, Snare on 2 & 4, soft kick on 3.5
        bar = bar.overlay(get_kick() - 4, position=0)
        bar = bar.overlay(get_snare() - 6, position=beat_ms)
        bar = bar.overlay(get_kick() - 8, position=int(beat_ms * 2.5))
        bar = bar.overlay(get_snare() - 6, position=beat_ms * 3)

    # 4. Global Effects
    if genre == "lofi":
        bar = bar.low_pass_filter(1500)
    elif genre == "bollywood":
         bar = bar.high_pass_filter(200) # Crisp
         
    # 5. Assemble and Loop
    music = AudioSegment.silent(duration=0)
    while len(music) < duration_ms:
        music += bar
        
    music = music[:duration_ms]
    
    # Final normalization/leveling
    music = music + 2 # Boost slightly
    music = music.fade_in(2000).fade_out(3000)
    
    return music


async def generate_song(prompt: str, genre: str = "", duration: int = 10, language: str = "en"):
    """
    Generate a song with emotional sectional vocals and background music.
    """
    # Step 1: Generate lyrics
    lyrics = _generate_lyrics(prompt, genre, language)
    final_lyrics = lyrics
    
    # Step 2: Translate if needed
    if language != "en":
        try:
            # Map 'zh' to 'zh-CN' for deep-translator compatibility
            trans_lang = "zh-CN" if language == "zh" else language
            translator = GoogleTranslator(source='auto', target=trans_lang)
            final_lyrics = translator.translate(lyrics)
        except Exception as e:
            print(f"Lyrics translation failed: {e}")
            final_lyrics = lyrics
            language = "en"
    
    # Step 3: Parse and Synthesize Sections Emotionally
    sections = _parse_lyrics_into_sections(final_lyrics)
    
    # Pick base voice
    if language != "en" and language in LANGUAGE_VOICES:
        voice_info = LANGUAGE_VOICES[language]
        base_voice = voice_info["voice"]
    else:
        if genre in ("bollywood", "indian_classical"):
            voice_options = ["hindi_female", "hindi_male"]
        elif genre in ("rock", "hiphop"):
            voice_options = ["male_deep", "male_pop"]
        elif genre in ("rnb", "jazz", "lofi"):
            voice_options = ["female_soft", "female_pop"]
        else:
            voice_options = list(SINGING_VOICES.keys())
        voice_key = random.choice(voice_options)
        base_voice = SINGING_VOICES[voice_key]["voice"]

    full_vocals = AudioSegment.silent(duration=1) # Small initial silent segment
    
    # Step 4: Sectional Emotional Synthesis
    print(f"DEBUG: Starting song synthesis for {len(sections)} sections...")
    for i, section in enumerate(sections):
        section_text = " ... ".join([f"♪ {l} ♪" for l in section["lines"]])
        preset = EMOTIONAL_PRESETS.get(section["type"], EMOTIONAL_PRESETS["default"])
        
        # Temporary file for this section
        sec_filename = f"sec_{uuid.uuid4().hex[:8]}.mp3"
        sec_filepath = os.path.join(OUTPUT_DIR, sec_filename)
        
        try:
            # Add slight micro-randomization for more "human" feel
            pitch_val = int(preset['pitch'].replace('Hz',''))
            pitch_variance = random.randint(-2, 2)
            final_pitch = f"{pitch_val + pitch_variance}Hz"
            
            print(f"DEBUG: Synthesizing section {i+1}/{len(sections)} (Type: {section['type']})")
            communicate = edge_tts.Communicate(
                section_text,
                base_voice,
                rate=preset.get("rate", "-10%"),
                pitch=final_pitch
            )
            await communicate.save(sec_filepath)
            
            if not os.path.exists(sec_filepath) or os.path.getsize(sec_filepath) == 0:
                print(f"DEBUG: Section {i+1} synthesis produced empty file.")
                continue

            # Load and process section using workaround
            sec_audio = _load_audio_workaround(sec_filepath)
            if sec_audio is None:
                print(f"DEBUG: Could not load section {i+1} audio.")
                continue
            
            # Apply volume drift for emotion
            sec_audio = sec_audio + preset.get("volume", 0)
            
            # If chorus, add subtle doubling for richness
            if section["type"] in ["chorus", "final"]:
                # Double vocals: shifted slightly in time and lower volume
                doubled = sec_audio.overlay(sec_audio - 10, position=30)
                sec_audio = doubled
            
            # Add to full track with a natural pause
            pause_ms = random.randint(300, 600)
            full_vocals += sec_audio + AudioSegment.silent(duration=pause_ms)
            
            # Clean up temp section file
            try:
                os.remove(sec_filepath)
            except:
                pass
        except Exception as e:
            print(f"Section synthesis failed for section {i}: {e}")
            continue

    if len(full_vocals) < 100: # Less than 100ms means it's basically empty
        print("DEBUG: Sectional synthesis failed completely. Attempting fallback...")
        try:
            # Fallback to simple synthesis
            full_text = _format_lyrics_for_singing(final_lyrics)
            fallback_filename = f"vocal_fb_{uuid.uuid4().hex[:8]}.mp3"
            fallback_path = os.path.join(OUTPUT_DIR, fallback_filename)
            communicate = edge_tts.Communicate(full_text, base_voice)
            await communicate.save(fallback_path)
            return {
                "filename": fallback_filename,
                "url": f"/static/audio/{fallback_filename}",
                "prompt": prompt,
                "genre": genre,
                "lyrics": final_lyrics,
                "language": language,
                "status": "success",
                "note": "Song generated (simplified synthesis fallback)"
            }
        except Exception as fb_e:
            print(f"Fallback synthesis also failed: {fb_e}")
            return {"status": "error", "error": f"Synthesis failed: {str(fb_e)}"}

    # Export final vocals
    vocal_filename = f"vocal_{uuid.uuid4().hex[:8]}.mp3"
    vocal_filepath = os.path.join(OUTPUT_DIR, vocal_filename)
    full_vocals.export(vocal_filepath, format="mp3")
    
    # Step 5: Mix with Background Music
    try:
        bg_music = _generate_background_music(genre, len(full_vocals))
        # Mix vocals over music (music slightly lower)
        combined = bg_music.overlay(full_vocals)
        
        final_filename = f"song_full_{uuid.uuid4().hex[:8]}.mp3"
        final_filepath = os.path.join(OUTPUT_DIR, final_filename)
        combined.export(final_filepath, format="mp3")
    except Exception as mix_e:
        print(f"Mixing failed: {mix_e}")
        final_filename = vocal_filename
    
    return {
        "filename": final_filename,
        "url": f"/static/audio/{final_filename}",
        "prompt": prompt,
        "genre": genre,
        "lyrics": final_lyrics,
        "language": language,
        "status": "success",
        "note": "🎭 AI Song with Beats generated successfully!"
    }


async def generate_lyrics_with_translation(prompt: str, genre: str = "", duration: int = 10, language: str = "en", target_lang: str = None):
    """
    Generate lyrics and potentially translate them at the same time.
    Returns both original and translated lyrics.
    """
    # 1. Generate core response
    result = await generate_song(prompt, genre, duration, language)
    
    if result["status"] == "error":
        return result
    
    # 2. Add translation if requested
    if target_lang and target_lang != language:
        try:
            # Map 'zh' to 'zh-CN' for deep-translator compatibility
            trans_lang = "zh-CN" if target_lang == "zh" else target_lang
            translator = GoogleTranslator(source='auto', target=trans_lang)
            translated_lyrics = translator.translate(result["lyrics"])
            result["translated_lyrics"] = translated_lyrics
            result["target_language"] = target_lang
        except Exception as e:
            print(f"Lyrics simultaneous translation failed: {e}")
            result["translated_lyrics"] = None
    else:
        result["translated_lyrics"] = None
        
    return result


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
