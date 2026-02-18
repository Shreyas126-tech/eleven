import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001';

const api = axios.create({
    baseURL: API_BASE_URL,
});

export const get_voices = async () => {
    const response = await api.get('/voices');
    return response.data;
};

export const synthesize = async (text, voice) => {
    const response = await api.post('/synthesize', { text, voice });
    return response.data;
};

export default api;
