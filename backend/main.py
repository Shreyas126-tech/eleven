from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import tts_service
import song_service
import translate_service
import clone_service
import os
import uuid
import shutil

app = FastAPI(title="ELEVEN.AI - AI Audio Platform")

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

class TTSRequest(BaseModel):
    text: str
    voice: str


class SongRequest(BaseModel):
    prompt: str
    genre: str = ""
    duration: int = 10
    language: str = "en"  # Added language support


class TranslateTextRequest(BaseModel):
    text: str
    target_lang: str
    source_lang: str = "auto"  # Added source language


class CloneRequest(BaseModel):
    celebrity_id: str
    text: str
    mode: str = "speak"  # "speak" or "sing"


# ============================================================
# Text-to-Speech (existing)
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
# Song Generation
# ============================================================

@app.get("/genres")
async def get_genres():
    return song_service.get_genres()


@app.get("/singing-voices")
async def get_singing_voices():
    return song_service.get_singing_voices()


@app.post("/generate-song")
async def generate_song(request: SongRequest):
    try:
        result = await song_service.generate_song(
            prompt=request.prompt,
            genre=request.genre,
            duration=request.duration,
            language=request.language
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
    source_lang: str = Form("auto")  # Added source language field
):
    # Save uploaded audio to temp file
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
        # Cleanup temp file
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
# Voice Cloning
# ============================================================

@app.get("/celebrities")
async def get_celebrities():
    return clone_service.get_celebrities()


@app.post("/clone-voice")
async def clone_voice(request: CloneRequest):
    try:
        # Simplified call to single clone_voice function
        result = await clone_service.clone_voice(
            celebrity_id=request.celebrity_id,
            text=request.text,
            mode=request.mode
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
        # Serve index.html for all non-API routes (SPA catch-all)
        file_path = os.path.join(FRONTEND_DIR, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
