from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import tts_service
import os

app = FastAPI(title="ElevenLabs Clone API")

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

class TTSRequest(BaseModel):
    text: str
    voice: str

@app.get("/voices")
async def get_voices():
    try:
        voices = await tts_service.get_voices()
        # Return simplified voice list for the frontend
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

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
