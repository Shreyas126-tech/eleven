import axios from 'axios';

// In production (Render), use same origin. In dev, use localhost:8001
const API_BASE_URL = import.meta.env.PROD ? '' : 'http://127.0.0.1:8003';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 180000,
});

// ============= Authentication =============
export const login = async (email, password) => {
    const response = await api.post('/login', { email, password });
    return response.data;
};

export const signup = async (username, email, password) => {
    const response = await api.post('/signup', { username, email, password });
    return response.data;
};

// ============= Text-to-Speech =============
export const get_voices = async () => {
    const response = await api.get('/voices');
    return response.data;
};

export const synthesize = async (text, voice) => {
    const response = await api.post('/synthesize', { text, voice });
    return response.data;
};

// ============= Lyrics Generation =============
export const get_genres = async () => {
    const response = await api.get('/genres');
    return response.data;
};

export const generate_lyrics = async (prompt, genre = '', duration = 10, language = 'en', target_lang = null) => {
    const response = await api.post('/generate-lyrics', { prompt, genre, duration, language, target_lang });
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

// ============= Voice Cloning (Presets) =============
export const get_voice_presets = async () => {
    const response = await api.get('/voice-presets');
    return response.data;
};

export const clone_voice = async (presetId, text, mode = 'speak') => {
    const response = await api.post('/clone-voice', {
        preset_id: presetId,
        text,
        mode,
    });
    return response.data;
};

// ============= Story Teller =============
export const get_story_genres = async () => {
    const response = await api.get('/story-genres');
    return response.data;
};

export const generate_story = async (genre, topic = '', ageGroup = 'child', language = 'en', duration = 2) => {
    const response = await api.post('/generate-story', { genre, topic, age_group: ageGroup, language, duration });
    return response.data;
};

// ============= AI Podcast =============
export const get_podcast_topics = async () => {
    const response = await api.get('/podcast-topics');
    return response.data;
};

export const generate_podcast = async (topic, duration, voices = null) => {
    const response = await api.post('/generate-podcast', { topic, duration, voices });
    return response.data;
};

// ============= Music & Beats =============
export const get_instruments = async () => {
    const response = await api.get('/instruments');
    return response.data;
};

export const generate_music = async (instrument, duration) => {
    const response = await api.post('/generate-music', { instrument, duration });
    return response.data;
};

export const generate_ringtone = async () => {
    const response = await api.post('/generate-ringtone');
    return response.data;
};

// ============= Audio Studio & Mashup =============
export const studio_process = async (audioFile, effect) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('effect', effect);
    const response = await api.post('/studio-process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const audio_mashup = async (audio1, audio2, style = 'smooth', balance = 0.5) => {
    const formData = new FormData();
    formData.append('audio1', audio1);
    formData.append('audio2', audio2);
    formData.append('style', style);
    formData.append('balance', balance);
    const response = await api.post('/audio-mashup', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

// ============= Mood Analysis =============
export const analyze_mood = async (text, audioFile) => {
    const formData = new FormData();
    if (text) formData.append('text', text);
    if (audioFile) formData.append('audio', audioFile);
    const response = await api.post('/analyze-mood', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};


// ============= Translate to All Languages =============
export const translate_to_all = async (text) => {
    const response = await api.post('/translate-to-all', { text, target_lang: 'all' });
    return response.data;
};

export default api;
