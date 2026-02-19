import edge_tts
import os
import uuid
import asyncio

OUTPUT_DIR = "static/audio"
os.makedirs(OUTPUT_DIR, exist_ok=True)

async def get_voices():
    # Get standard system voices
    voices = await edge_tts.VoicesManager.create()
    system_voices = voices.find()
    
    # Convert system voices to list of dicts
    voice_list = [v for v in system_voices]
        
    return voice_list

async def synthesize_speech(text: str, voice: str):
    # Use standard edge-tts
    filename = f"{uuid.uuid4()}.mp3"
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(filepath)
    
    return {
        "filename": filename,
        "url": f"/static/audio/{filename}",
        "text": text,
        "voice": voice,
        "type": "tts"
    }
