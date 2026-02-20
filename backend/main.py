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
        print(f"Signup error: {e}")
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

@app.get("/voice-presets")
async def get_voice_presets():
    return clone_service.get_voice_presets()


@app.post("/clone-voice")
async def clone_voice(request: CloneRequest):
    try:
        result = await clone_service.clone_voice(
            preset_id=request.preset_id,
            text=request.text,
            mode=request.mode
        )
        return result
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
