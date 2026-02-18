import os
import uuid
import asyncio
import speech_recognition as sr
from deep_translator import GoogleTranslator
import edge_tts
import imageio_ffmpeg
from pydub import AudioSegment

# Configure pydub to use the bundled FFmpeg binary
AudioSegment.converter = imageio_ffmpeg.get_ffmpeg_exe()

OUTPUT_DIR = "static/audio"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Mapping of language codes to edge-tts voice names
LANGUAGE_VOICES = {
    "es": {"voice": "es-ES-ElviraNeural", "name": "Spanish", "flag": "🇪🇸"},
    "fr": {"voice": "fr-FR-DeniseNeural", "name": "French", "flag": "🇫🇷"},
    "de": {"voice": "de-DE-KatjaNeural", "name": "German", "flag": "🇩🇪"},
    "it": {"voice": "it-IT-ElsaNeural", "name": "Italian", "flag": "🇮🇹"},
    "pt": {"voice": "pt-BR-FranciscaNeural", "name": "Portuguese", "flag": "🇧🇷"},
    "ja": {"voice": "ja-JP-NanamiNeural", "name": "Japanese", "flag": "🇯🇵"},
    "ko": {"voice": "ko-KR-SunHiNeural", "name": "Korean", "flag": "🇰🇷"},
    "zh": {"voice": "zh-CN-XiaoxiaoNeural", "name": "Chinese", "flag": "🇨🇳"},
    "hi": {"voice": "hi-IN-SwaraNeural", "name": "Hindi", "flag": "🇮🇳"},
    "ar": {"voice": "ar-SA-ZariyahNeural", "name": "Arabic", "flag": "🇸🇦"},
    "ru": {"voice": "ru-RU-SvetlanaNeural", "name": "Russian", "flag": "🇷🇺"},
    "nl": {"voice": "nl-NL-ColetteNeural", "name": "Dutch", "flag": "🇳🇱"},
    "sv": {"voice": "sv-SE-SofieNeural", "name": "Swedish", "flag": "🇸🇪"},
    "pl": {"voice": "pl-PL-AgnieszkaNeural", "name": "Polish", "flag": "🇵🇱"},
    "tr": {"voice": "tr-TR-EmelNeural", "name": "Turkish", "flag": "🇹🇷"},
    "th": {"voice": "th-TH-PremwadeeNeural", "name": "Thai", "flag": "🇹🇭"},
    "vi": {"voice": "vi-VN-HoaiMyNeural", "name": "Vietnamese", "flag": "🇻🇳"},
    "ta": {"voice": "ta-IN-PallaviNeural", "name": "Tamil", "flag": "🇮🇳"},
    "te": {"voice": "te-IN-ShrutiNeural", "name": "Telugu", "flag": "🇮🇳"},
    "kn": {"voice": "kn-IN-SapnaNeural", "name": "Kannada", "flag": "🇮🇳"},
    "bn": {"voice": "bn-IN-TanishaaNeural", "name": "Bengali", "flag": "🇮🇳"},
    "en": {"voice": "en-US-JennyNeural", "name": "English", "flag": "🇺🇸"},
}


def get_supported_languages():
    """Return list of supported languages."""
    return [
        {"code": code, "name": info["name"], "flag": info["flag"]}
        for code, info in LANGUAGE_VOICES.items()
    ]


def _convert_to_wav(input_path: str) -> str:
    """Convert any audio format to WAV using pydub with bundled FFmpeg."""
    try:
        wav_path = input_path.rsplit('.', 1)[0] + '_converted.wav'

        # Try to detect format from extension, default to auto-detect
        try:
            audio = AudioSegment.from_file(input_path)
        except Exception:
            # Fallback for webm or other formats if basic detection fails
            audio = AudioSegment.from_file(input_path, format="webm")

        # Export as WAV (PCM format that speech_recognition can read)
        audio.export(wav_path, format="wav")
        return wav_path
    except Exception as e:
        print(f"Audio conversion failed: {e}")
        return input_path


async def translate_audio(audio_file_path: str, target_lang: str, source_lang: str = "auto"):
    """
    Full translation pipeline:
    1. Convert audio to WAV using bundled FFmpeg
    2. Speech-to-Text (recognize audio)
    3. Translate text
    4. Synthesize translated text in target language voice
    """
    # Step 0: Convert to WAV for compatibility
    wav_path = _convert_to_wav(audio_file_path)

    # Step 1: Speech Recognition
    recognizer = sr.Recognizer()
    recognizer.energy_threshold = 300

    try:
        with sr.AudioFile(wav_path) as source:
            audio_data = recognizer.record(source)
            # Use specific language code for recognition if provided and not 'auto'
            language_code = source_lang if source_lang != "auto" else None
            original_text = recognizer.recognize_google(audio_data, language=language_code)
    except sr.UnknownValueError:
        return {
            "status": "error",
            "error": "Could not understand the audio. Please speak clearly and try again."
        }
    except sr.RequestError as e:
        return {
            "status": "error",
            "error": f"Speech recognition service error: {str(e)}"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": f"Audio processing error: {str(e)}"
        }
    finally:
        # Cleanup converted file
        if wav_path != audio_file_path and os.path.exists(wav_path):
            try:
                os.remove(wav_path)
            except:
                pass

    # Step 2: Translate
    try:
        if target_lang == "en" and source_lang == "en":
            translated_text = original_text
        else:
            translator = GoogleTranslator(source=source_lang, target=target_lang)
            translated_text = translator.translate(original_text)
    except Exception as e:
        return {
            "status": "error",
            "error": f"Translation error: {str(e)}"
        }

    # Step 3: Text-to-Speech in target language
    lang_info = LANGUAGE_VOICES.get(target_lang, LANGUAGE_VOICES["en"])
    voice = lang_info["voice"]

    filename = f"translated_{uuid.uuid4().hex[:8]}.mp3"
    filepath = os.path.join(OUTPUT_DIR, filename)

    try:
        communicate = edge_tts.Communicate(translated_text, voice)
        await communicate.save(filepath)
    except Exception as e:
        return {
            "status": "error",
            "error": f"Voice synthesis error: {str(e)}"
        }

    return {
        "status": "success",
        "original_text": original_text,
        "translated_text": translated_text,
        "target_language": lang_info["name"],
        "filename": filename,
        "url": f"/static/audio/{filename}"
    }


async def translate_text_input(text: str, target_lang: str, source_lang: str = "auto"):
    """
    Translate text directly (without audio input).
    1. Translate text
    2. Synthesize in target language voice
    """
    # Step 1: Translate
    try:
        translator = GoogleTranslator(source=source_lang, target=target_lang)
        translated_text = translator.translate(text)
    except Exception as e:
        return {
            "status": "error",
            "error": f"Translation error: {str(e)}"
        }

    # Step 2: TTS in target language
    lang_info = LANGUAGE_VOICES.get(target_lang, LANGUAGE_VOICES["en"])
    voice = lang_info["voice"]

    filename = f"translated_{uuid.uuid4().hex[:8]}.mp3"
    filepath = os.path.join(OUTPUT_DIR, filename)

    try:
        communicate = edge_tts.Communicate(translated_text, voice)
        await communicate.save(filepath)
    except Exception as e:
        return {
            "status": "error",
            "error": f"Voice synthesis error: {str(e)}"
        }

    return {
        "status": "success",
        "original_text": text,
        "translated_text": translated_text,
        "target_language": lang_info["name"],
        "filename": filename,
        "url": f"/static/audio/{filename}"
    }
