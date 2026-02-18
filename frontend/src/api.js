import axios from 'axios';

// In production (Render), use same origin. In dev, use localhost:8001
const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:8001';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 120000, // 2 min timeout for AI generation
});

// ============= Text-to-Speech =============
export const get_voices = async () => {
    const response = await api.get('/voices');
    return response.data;
};

export const synthesize = async (text, voice) => {
    const response = await api.post('/synthesize', { text, voice });
    return response.data;
};

// ============= Song Generation =============
export const get_genres = async () => {
    const response = await api.get('/genres');
    return response.data;
};

export const generate_song = async (prompt, genre = '', duration = 10, language = 'en') => {
    const response = await api.post('/generate-song', { prompt, genre, duration, language });
    return response.data;
};

export const get_singing_voices = async () => {
    const response = await api.get('/singing-voices');
    return response.data;
};

// ============= Voice Translation =============
export const get_languages = async () => {
    const response = await api.get('/languages');
    return response.data;
};

export const translate_audio = async (audioFile, targetLang, sourceLang = 'auto') => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('target_lang', targetLang);
    formData.append('source_lang', sourceLang);
    const response = await api.post('/translate-audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const translate_text = async (text, targetLang, sourceLang = 'auto') => {
    const response = await api.post('/translate-text', { text, target_lang: targetLang, source_lang: sourceLang });
    return response.data;
};

// ============= Voice Cloning =============
export const get_celebrities = async () => {
    const response = await api.get('/celebrities');
    return response.data;
};

export const clone_voice = async (celebrityId, text, mode = 'speak') => {
    const response = await api.post('/clone-voice', {
        celebrity_id: celebrityId,
        text,
        mode,
    });
    return response.data;
};

export default api;
