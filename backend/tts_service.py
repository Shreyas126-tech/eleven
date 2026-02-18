import edge_tts
import os
import uuid
import asyncio
from clone_service import CELEBRITY_PRESETS, clone_voice

OUTPUT_DIR = "static/audio"
os.makedirs(OUTPUT_DIR, exist_ok=True)

async def get_voices():
    # Get standard system voices
    voices = await edge_tts.VoicesManager.create()
    system_voices = voices.find()
    
    # Convert system voices to list of dicts if not already
    voice_list = [v for v in system_voices]
    
    # Append celebrity presets as custom voices
    for celeb in CELEBRITY_PRESETS:
        voice_list.append({
            "Name": f"{celeb['name']} (Celebrity)",
            "ShortName": celeb['id'],  # Use ID as the voice key
            "Gender": "Celebrity",
            "Locale": "en-US", # Default to US for listing, though implementation varies
            "FriendlyName": f"{celeb['name']} ({celeb['description']})",
            "suggested_codec": "mp3", 
            "SuggestedCodec": "mp3"
        })
        
    return voice_list

async def synthesize_speech(text: str, voice: str):
    # Check if selected voice is a celebrity ID
    is_celeb = any(c['id'] == voice for c in CELEBRITY_PRESETS)
    
    if is_celeb:
        # Use clone service
        result = await clone_voice(voice, text, mode="speak")
        if result.get("status") == "error":
            raise Exception(result.get("error"))
        return result
    else:
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
