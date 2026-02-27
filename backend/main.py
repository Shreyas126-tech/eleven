from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from sqlalchemy.orm import Session
import tts_service
import lyrics_service
import translate_service
import clone_service
import database, models
from passlib.context import CryptContext

import os
import uuid
import shutil

import logging
import traceback

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure FFmpeg for pydub
try:
    import imageio_ffmpeg as ffmpeg
    from pydub import AudioSegment
    AudioSegment.converter = ffmpeg.get_ffmpeg_exe()
    logger.info(f"FFmpeg path set to: {AudioSegment.converter}")
except ImportWarning:
    logger.warning("imageio-ffmpeg or pydub not found, audio processing might fail.")
except Exception as e:
    logger.error(f"Error configuring FFmpeg: {e}")

# Initialize Database
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="VaniverseAI - AI Audio Platform")

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files for audio
os.makedirs("static/audio", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


# ============================================================
# Request Models
# ============================================================

class SignupRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True

class TTSRequest(BaseModel):
    text: str
    voice: str


class LyricsRequest(BaseModel):
    prompt: str
    genre: str = ""
    duration: int = 10
    language: str = "en"
    target_lang: Optional[str] = None


class TranslateTextRequest(BaseModel):
    text: str
    target_lang: str
    source_lang: str = "auto"


class CloneRequest(BaseModel):
    preset_id: str
    text: str
    mode: str = "speak"  # "speak" or "sing"




# ============================================================
# Authentication
# ============================================================

import re

@app.post("/signup")
def signup(request: SignupRequest, db: Session = Depends(database.get_db)):
    try:
        # Password Validation: 8-16 chars, upper, lower, digit, special symbol
        if not (8 <= len(request.password) <= 16):
            raise HTTPException(status_code=400, detail="Password must be between 8 and 16 characters")
        
        if not re.search(r"[a-z]", request.password) or \
           not re.search(r"[A-Z]", request.password) or \
           not re.search(r"\d", request.password) or \
           not re.search(r"[@$!%*?&.#]", request.password):
            raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&.#)")

        db_user = db.query(models.User).filter(models.User.email == request.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # pbkdf2_sha256 has no 72-byte limit
        hashed_password = pwd_context.hash(request.password)
        
        new_user = models.User(
            username=request.username,
            email=request.email,
            hashed_password=hashed_password
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"status": "success", "username": new_user.username, "email": new_user.email, "id": new_user.id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {e}")
        logger.error(traceback.format_exc())
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.post("/login", response_model=UserResponse)
def login(request: LoginRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user or not pwd_context.verify(request.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    return user


# ============================================================
# Text-to-Speech
# ============================================================

@app.get("/voices")
async def get_voices():
    try:
        voices = await tts_service.get_voices()
        return [
            {
                "ShortName": v["ShortName"],
                "FriendlyName": v["FriendlyName"],
                "Gender": v["Gender"],
                "Locale": v["Locale"],
                "SuggestedCodec": v["SuggestedCodec"]
            }
            for v in voices
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/synthesize")
async def synthesize(request: TTSRequest):
    try:
        result = await tts_service.synthesize_speech(request.text, request.voice)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Lyrics Generation (formerly Song Generation)
# ============================================================

@app.get("/genres")
async def get_genres():
    return lyrics_service.get_genres()


@app.get("/singing-voices")
async def get_singing_voices():
    return lyrics_service.get_singing_voices()


@app.post("/generate-lyrics")
async def generate_lyrics(request: LyricsRequest):
    try:
        result = await lyrics_service.generate_lyrics_with_translation(
            prompt=request.prompt,
            genre=request.genre,
            duration=request.duration,
            language=request.language,
            target_lang=request.target_lang
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Voice Translation
# ============================================================

@app.get("/languages")
async def get_languages():
    return translate_service.get_supported_languages()


@app.post("/translate-audio")
async def translate_audio(
    audio: UploadFile = File(...),
    target_lang: str = Form(...),
    source_lang: str = Form("auto")
):
    temp_dir = "static/temp"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"upload_{uuid.uuid4().hex[:8]}_{audio.filename}")

    try:
        with open(temp_path, "wb") as f:
            content = await audio.read()
            f.write(content)

        result = await translate_service.translate_audio(temp_path, target_lang, source_lang)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass


@app.post("/translate-text")
async def translate_text(request: TranslateTextRequest):
    try:
        result = await translate_service.translate_text_input(
            text=request.text,
            target_lang=request.target_lang,
            source_lang=request.source_lang
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Voice Cloning (Age Group & Tune Presets)
# ============================================================

import story_service
import podcast_service
import music_service
import studio_service
import analysis_service
import clone_service

# ============================================================
# Translation Enhancements
# ============================================================

@app.post("/translate-to-all")
async def translate_to_all(request: TranslateTextRequest):
    try:
        return await translate_service.translate_to_all_languages(request.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# Voice Cloning Endpoints
# ============================================================

@app.get("/voice-presets")
async def get_voice_presets():
    return clone_service.get_voice_presets()

@app.post("/clone-voice")
async def clone_voice(request: CloneRequest):
    try:
        return await clone_service.clone_voice(request.preset_id, request.text, request.mode)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Request Models (Continued)
class StoryRequest(BaseModel):
    genre: str
    topic: str = ""
    language: str = "en"
    age_group: str = "child"
    duration: int = 2

class PodcastRequest(BaseModel):
    topic: str
    duration: int = 1
    voices: Optional[list] = None

class MusicRequest(BaseModel):
    instrument: str
    duration: int = 10

class AnalyzeRequest(BaseModel):
    text: Optional[str] = None

# ============================================================
# Advanced AI Features
# ============================================================

@app.post("/generate-story")
async def generate_story(request: StoryRequest):
    try:
        return await story_service.generate_story(request.genre, request.topic, request.age_group, request.language, request.duration)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/story-genres")
async def get_story_genres():
    return story_service.get_story_genres()

@app.post("/generate-podcast")
async def generate_podcast(request: PodcastRequest):
    try:
        return await podcast_service.generate_podcast(request.topic, request.duration, request.voices)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/podcast-topics")
async def get_podcast_topics():
    return podcast_service.get_podcast_topics()

@app.post("/generate-music")
async def generate_music(request: MusicRequest):
    try:
        return await music_service.generate_music(request.instrument, request.duration)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-ringtone")
async def generate_ringtone():
    try:
        return await music_service.generate_ringtone()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/instruments")
async def get_instruments():
    return music_service.get_instruments()

@app.post("/studio-process")
async def studio_process(
    audio: UploadFile = File(...),
    effect: str = Form(...)
):
    temp_path = f"temp_{uuid.uuid4().hex[:8]}_{audio.filename}"
    try:
        with open(temp_path, "wb") as f:
            f.write(await audio.read())
        return await studio_service.process_audio(temp_path, effect)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/audio-mashup")
async def audio_mashup(
    audio1: UploadFile = File(...),
    audio2: UploadFile = File(...),
    style: str = Form("smooth"),
    balance: float = Form(0.5)
):
    path1 = f"temp1_{uuid.uuid4().hex[:8]}.mp3"
    path2 = f"temp2_{uuid.uuid4().hex[:8]}.mp3"
    try:
        with open(path1, "wb") as f1: f1.write(await audio1.read())
        with open(path2, "wb") as f2: f2.write(await audio2.read())
        return await studio_service.create_mashup(path1, path2, style, balance)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        for p in [path1, path2]:
            if os.path.exists(p): os.remove(p)

@app.post("/analyze-mood")
async def analyze_mood(
    text: Optional[str] = Form(None),
    audio: Optional[UploadFile] = File(None)
):
    try:
        if audio:
            # Generate a proper extension based on original filename if possible
            ext = os.path.splitext(audio.filename)[1] or ".mp3"
            temp_path = f"temp_mood_{uuid.uuid4().hex[:8]}{ext}"
            with open(temp_path, "wb") as f:
                f.write(await audio.read())
            try:
                res = await analysis_service.analyze_audio_mood(temp_path)
                return res
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        elif text:
            # Return full percentage breakdown
            mood_result = analysis_service.analyze_text_mood(text)
            return {"status": "success", "mood": mood_result}
        else:
            raise HTTPException(status_code=400, detail="Either text or audio is required")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# ... (inside routes)



# ============================================================
# Health Check
# ============================================================

@app.get("/health")
async def health():
    return {"status": "healthy", "features": ["tts", "song-generation", "translation", "voice-cloning"]}


# ============================================================
# Serve Frontend (built Vite app)
# ============================================================
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(FRONTEND_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="frontend-assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(FRONTEND_DIR, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8003))
    uvicorn.run(app, host="0.0.0.0", port=port)
