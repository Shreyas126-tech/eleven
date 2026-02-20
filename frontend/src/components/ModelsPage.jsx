import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Download, Volume2, Music, Globe, Users, Sparkles, Loader2, Type, AudioLines, Square, Wand2, Upload, FileAudio, Languages } from 'lucide-react';
import * as api from '../api';

const TABS = [
    { id: 'tts', label: 'Text to Speech', icon: Volume2, gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
    { id: 'lyrics', label: 'Lyrics Generator', icon: Music, gradient: 'linear-gradient(135deg, #ec4899, #be185d)' },
    { id: 'translate', label: 'Translator', icon: Globe, gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
    { id: 'clone', label: 'Voice Cloning', icon: Users, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
];

const API_BASE = import.meta.env.PROD ? '' : 'http://127.0.0.1:8003';

const FALLBACK_LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' }
];

const FALLBACK_GENRES = [
    { id: 'pop', name: 'Pop', emoji: '🎤' },
    { id: 'rock', name: 'Rock', emoji: '🎸' },
    { id: 'lofi', name: 'Lo-Fi', emoji: '☕' },
    { id: 'bollywood', name: 'Bollywood', emoji: '🎬' }
];

const FALLBACK_VOICES = [
    { ShortName: 'en-US-JennyNeural', FriendlyName: 'Jenny (English)', Gender: 'Female', Locale: 'en-US' },
    { ShortName: 'en-US-GuyNeural', FriendlyName: 'Guy (English)', Gender: 'Male', Locale: 'en-US' },
    { ShortName: 'hi-IN-SwaraNeural', FriendlyName: 'Swara (Hindi)', Gender: 'Female', Locale: 'hi-IN' }
];

const FALLBACK_PRESETS = [
    { id: 'child_girl', name: 'Child Girl', avatar: '👧', description: 'Bright and cheerful', category: 'Age Group' },
    { id: 'robotic', name: 'Robotic', avatar: '🤖', description: 'Flat mechanical voice', category: 'Tune Style' }
];

const ModelsPage = () => {
    const [activeTab, setActiveTab] = useState('tts');

    // TTS State
    const [text, setText] = useState('');
    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [voiceLocaleFilter, setVoiceLocaleFilter] = useState('all');

    // Lyrics State
    const [lyricsPrompt, setLyricsPrompt] = useState('');
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('');
    const [lyricsLanguage, setLyricsLanguage] = useState('en');
    const [targetLyricsLang, setTargetLyricsLang] = useState('');
    const [isLyricsGenerating, setIsLyricsGenerating] = useState(false);

    // Translator State
    const [translateInputText, setTranslateInputText] = useState('');
    const [languages, setLanguages] = useState([]);
    const [targetLang, setTargetLang] = useState('es');
    const [sourceLang, setSourceLang] = useState('auto');
    const [isTranslating, setIsTranslating] = useState(false);
    const [translationResult, setTranslationResult] = useState(null);

    // Clone State
    const [voicePresets, setVoicePresets] = useState([]);
    const [selectedPreset, setSelectedPreset] = useState('');
    const [cloneText, setCloneText] = useState('');
    const [cloneMode, setCloneMode] = useState('speak');
    const [isCloning, setIsCloning] = useState(false);
    const [presetCategory, setPresetCategory] = useState('all');

    // Audio Player State
    const [currentAudio, setCurrentAudio] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [audioProgress, setAudioProgress] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);

    const audioRef = useRef(null);

    useEffect(() => {
        fetchVoices();
        fetchGenres();
        fetchLanguages();
        fetchVoicePresets();
    }, []);

    useEffect(() => {
        setCurrentAudio(null);
        setStatusMessage(null);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
    }, [activeTab]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onEnded = () => { setIsPlaying(false); setAudioProgress(0); };
        const onTimeUpdate = () => {
            if (audio.duration) {
                setAudioProgress((audio.currentTime / audio.duration) * 100);
            }
        };
        const onLoadedMetadata = () => setAudioDuration(audio.duration);

        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);

        return () => {
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        };
    }, []);

    const loadAndPlayAudio = (url) => {
        const fullUrl = `${API_BASE}${url}`;
        const audio = audioRef.current;
        if (audio) {
            audio.src = fullUrl;
            audio.load();
            audio.play().catch(e => console.log('Autoplay blocked:', e));
        }
    };

    const playPause = () => {
        const audio = audioRef.current;
        if (!audio || !audio.src) return;
        if (audio.paused) {
            audio.play().catch(e => console.log('Play error:', e));
        } else {
            audio.pause();
        }
    };

    const seekAudio = (e) => {
        const audio = audioRef.current;
        if (!audio || !audio.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audio.currentTime = percent * audio.duration;
    };

    const formatTime = (sec) => {
        if (!sec || isNaN(sec)) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const downloadAudio = () => {
        if (!currentAudio?.url) return;
        const link = document.createElement('a');
        link.href = `${API_BASE}${currentAudio.url}`;
        link.download = currentAudio.filename || 'audio.mp3';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const fetchVoices = async () => {
        try {
            const data = await api.get_voices();
            const voiceData = data && data.length > 0 ? data : FALLBACK_VOICES;
            setVoices(voiceData);
            const defaultVoice = voiceData.find(v => v.Locale.startsWith('en')) || voiceData[0];
            if (defaultVoice) setSelectedVoice(defaultVoice.ShortName);
        } catch (e) {
            setVoices(FALLBACK_VOICES);
            setSelectedVoice(FALLBACK_VOICES[0].ShortName);
        }
    };

    const fetchGenres = async () => {
        try {
            const data = await api.get_genres();
            setGenres(data && data.length > 0 ? data : FALLBACK_GENRES);
        } catch (e) {
            setGenres(FALLBACK_GENRES);
        }
    };

    const fetchLanguages = async () => {
        try {
            const data = await api.get_languages();
            setLanguages(data && data.length > 0 ? data : FALLBACK_LANGUAGES);
        } catch (e) {
            setLanguages(FALLBACK_LANGUAGES);
        }
    };

    const fetchVoicePresets = async () => {
        try {
            const data = await api.get_voice_presets();
            const presetData = data && data.length > 0 ? data : FALLBACK_PRESETS;
            setVoicePresets(presetData);
            if (presetData.length > 0) setSelectedPreset(presetData[0].id);
        } catch (e) {
            setVoicePresets(FALLBACK_PRESETS);
            setSelectedPreset(FALLBACK_PRESETS[0].id);
        }
    };

    const handleTTS = async () => {
        if (!text || !selectedVoice) return;
        setIsGenerating(true);
        setStatusMessage({ type: 'info', text: 'Synthesizing speech...' });
        try {
            const result = await api.synthesize(text, selectedVoice);
            setCurrentAudio({ ...result, type: 'tts' });
            loadAndPlayAudio(result.url);
            setStatusMessage({ type: 'success', text: 'Speech generated! Playing now.' });
        } catch (e) {
            setStatusMessage({ type: 'error', text: 'Failed to generate speech.' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleLyricsGenerate = async () => {
        if (!lyricsPrompt) return;
        setIsLyricsGenerating(true);
        setStatusMessage({ type: 'info', text: '🎭 Generating lyrics & audio with emotional synthesis...' });
        try {
            const result = await api.generate_lyrics(lyricsPrompt, selectedGenre, 10, lyricsLanguage, targetLyricsLang);
            if (result.status === 'error') {
                setStatusMessage({ type: 'error', text: result.error || 'Generation failed.' });
                return;
            }
            setCurrentAudio({ ...result, type: 'lyrics' });
            loadAndPlayAudio(result.url);
            setStatusMessage({ type: 'success', text: result.note || 'Lyrics and audio generated!' });
        } catch (e) {
            setStatusMessage({ type: 'error', text: 'Generation failed.' });
        } finally {
            setIsLyricsGenerating(false);
        }
    };

    const handleTranslateText = async () => {
        if (!translateInputText || !targetLang) return;
        setIsTranslating(true);
        setStatusMessage({ type: 'info', text: 'Translating...' });
        try {
            const result = await api.translate_text(translateInputText, targetLang, sourceLang);
            setTranslationResult(result);
            setCurrentAudio({ ...result, type: 'translate' });
            loadAndPlayAudio(result.url);
            setStatusMessage({ type: 'success', text: 'Translation complete!' });
        } catch (e) {
            setStatusMessage({ type: 'error', text: 'Translation failed.' });
        } finally {
            setIsTranslating(false);
        }
    };

    const handleClone = async () => {
        if (!selectedPreset || !cloneText) return;
        setIsCloning(true);
        setStatusMessage({ type: 'info', text: 'Cloning voice...' });
        try {
            const result = await api.clone_voice(selectedPreset, cloneText, cloneMode);
            setCurrentAudio({ ...result, type: 'clone' });
            loadAndPlayAudio(result.url);
            setStatusMessage({ type: 'success', text: 'Voice cloned successfully!' });
        } catch (e) {
            setStatusMessage({ type: 'error', text: 'Cloning failed.' });
        } finally {
            setIsCloning(false);
        }
    };

    const filteredVoices = voiceLocaleFilter === 'all'
        ? voices
        : voices.filter(v => v.Locale.startsWith(voiceLocaleFilter));

    const filteredPresets = presetCategory === 'all'
        ? voicePresets
        : voicePresets.filter(p => p.category === presetCategory);

    const activeTabData = TABS.find(t => t.id === activeTab);

    return (
        <div className="w-full">
            <audio ref={audioRef} preload="auto" />

            {/* Sidebar / Tab Bar */}
            <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-64 flex flex-col space-y-2">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`p-4 rounded-2xl flex items-center space-x-3 transition-all duration-300 ${activeTab === tab.id ? 'bg-vpurple shadow-lg shadow-vpurple/20 text-white' : 'bg-slate-900/50 text-slate-400 hover:bg-slate-900 hover:text-white border border-transparent hover:border-slate-800'}`}
                            >
                                <Icon size={20} />
                                <span className="font-bold">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        {/* Status Message */}
                        {statusMessage && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`p-4 rounded-2xl mb-6 flex items-center space-x-3 ${statusMessage.type === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-500' : 'bg-vpurple/10 border border-vpurple/20 text-vpurple-light'}`}
                            >
                                {statusMessage.type === 'info' && <Loader2 size={18} className="animate-spin" />}
                                <span className="text-sm font-semibold">{statusMessage.text}</span>
                            </motion.div>
                        )}

                        {/* Content Cards */}
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-3xl"
                        >
                            <div className="flex items-center space-x-4 mb-8">
                                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                                    {activeTabData.icon && <activeTabData.icon size={28} className="text-vpurple-light" />}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-white tracking-tight">{activeTabData.label}</h2>
                                    <p className="text-slate-500">Professional AI Voice & Audio Engine</p>
                                </div>
                            </div>

                            {/* TTS TAB */}
                            {activeTab === 'tts' && (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Input Text</label>
                                        <textarea
                                            placeholder="Enter the text you want to synthesize..."
                                            className="w-full bg-slate-950 border border-slate-800 text-white p-5 rounded-2xl focus:outline-none focus:border-vpurple h-32 transition-all resize-none"
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Language Filter</label>
                                            <select
                                                className="w-full bg-slate-950 border border-slate-800 text-white p-4 rounded-xl focus:outline-none focus:border-vpurple"
                                                value={voiceLocaleFilter}
                                                onChange={(e) => setVoiceLocaleFilter(e.target.value)}
                                            >
                                                <option value="all">🌐 All Languages</option>
                                                {FALLBACK_LANGUAGES.map(l => (
                                                    <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Select Voice</label>
                                            <select
                                                className="w-full bg-slate-950 border border-slate-800 text-white p-4 rounded-xl focus:outline-none focus:border-vpurple"
                                                value={selectedVoice}
                                                onChange={(e) => setSelectedVoice(e.target.value)}
                                            >
                                                {filteredVoices.map(v => (
                                                    <option key={v.ShortName} value={v.ShortName}>{v.FriendlyName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleTTS}
                                        disabled={isGenerating || !text}
                                        className="w-full bg-vpurple hover:bg-vpurple-dark text-white font-bold py-5 rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-vpurple/20"
                                    >
                                        {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={20} />}
                                        <span>{isGenerating ? 'Synthesizing...' : 'Generate Voice'}</span>
                                    </button>
                                </div>
                            )}

                            {/* LYRICS TAB */}
                            {activeTab === 'lyrics' && (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Describe Song Topic / Prompt</label>
                                        <textarea
                                            placeholder="e.g. A futuristic city at night, rain falling on neon signs..."
                                            className="w-full bg-slate-950 border border-slate-800 text-white p-5 rounded-2xl focus:outline-none focus:border-vpurple h-24 transition-all resize-none"
                                            value={lyricsPrompt}
                                            onChange={(e) => setLyricsPrompt(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Genre</label>
                                            <select
                                                className="w-full bg-slate-950 border border-slate-800 text-white p-4 rounded-xl focus:outline-none focus:border-vpurple"
                                                value={selectedGenre}
                                                onChange={(e) => setSelectedGenre(e.target.value)}
                                            >
                                                {genres.map(g => (
                                                    <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Main Language</label>
                                            <select
                                                className="w-full bg-slate-950 border border-slate-800 text-white p-4 rounded-xl focus:outline-none focus:border-vpurple"
                                                value={lyricsLanguage}
                                                onChange={(e) => setLyricsLanguage(e.target.value)}
                                            >
                                                {languages.map(l => (
                                                    <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1 flex items-center space-x-1">
                                                <Languages size={12} />
                                                <span>Simultaneous Transl.</span>
                                            </label>
                                            <select
                                                className="w-full bg-slate-950 border border-slate-800 text-white p-4 rounded-xl focus:outline-none focus:border-vpurple"
                                                value={targetLyricsLang}
                                                onChange={(e) => setTargetLyricsLang(e.target.value)}
                                            >
                                                <option value="">None (Disable)</option>
                                                {languages.map(l => (
                                                    <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLyricsGenerate}
                                        disabled={isLyricsGenerating || !lyricsPrompt}
                                        className="w-full bg-vpink hover:bg-vpink-dark text-white font-bold py-5 rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-vpink/20"
                                    >
                                        {isLyricsGenerating ? <Loader2 className="animate-spin" size={24} /> : <Music size={20} />}
                                        <span>{isLyricsGenerating ? 'Orchestrating AI Lyrics...' : 'Generate Lyrics & Audio'}</span>
                                    </button>
                                </div>
                            )}

                            {/* TRANSLATOR TAB */}
                            {activeTab === 'translate' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Source Text</label>
                                            <textarea
                                                className="w-full bg-slate-950 border border-slate-800 text-white p-5 rounded-2xl focus:outline-none focus:border-vpurple h-40 transition-all resize-none"
                                                value={translateInputText}
                                                onChange={(e) => setTranslateInputText(e.target.value)}
                                                placeholder="Type here..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Translation Result</label>
                                            <div className="w-full bg-slate-950/50 border border-slate-800 text-vpurple-light p-5 rounded-2xl h-40 overflow-y-auto italic">
                                                {translationResult ? translationResult.translated_text : 'Translated text will appear here...'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-4">
                                        <select
                                            className="bg-slate-950 border border-slate-800 text-white p-4 rounded-xl focus:outline-none"
                                            value={targetLang}
                                            onChange={(e) => setTargetLang(e.target.value)}
                                        >
                                            {languages.map(l => (
                                                <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleTranslateText}
                                            disabled={isTranslating || !translateInputText}
                                            className="flex-1 bg-vblue hover:bg-vblue-dark text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all"
                                        >
                                            {isTranslating ? <Loader2 className="animate-spin" size={20} /> : <Globe size={20} />}
                                            <span>Translate & Speak</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* CLONE TAB */}
                            {activeTab === 'clone' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Clone Script</label>
                                            <textarea
                                                className="w-full bg-slate-950 border border-slate-800 text-white p-5 rounded-2xl focus:outline-none focus:border-vpurple h-32 transition-all resize-none"
                                                value={cloneText}
                                                onChange={(e) => setCloneText(e.target.value)}
                                                placeholder="Say something for the cloned voice..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Voice Preset</label>
                                            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-2">
                                                {voicePresets.map(p => (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => setSelectedPreset(p.id)}
                                                        className={`p-3 rounded-xl border flex items-center space-x-2 cursor-pointer transition-all ${selectedPreset === p.id ? 'bg-amber-500 text-white border-amber-400' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'}`}
                                                    >
                                                        <span className="text-xl">{p.avatar}</span>
                                                        <span className="text-xs font-bold truncate">{p.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-4">
                                        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                                            <button onClick={() => setCloneMode('speak')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${cloneMode === 'speak' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Speak</button>
                                            <button onClick={() => setCloneMode('sing')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${cloneMode === 'sing' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Sing</button>
                                        </div>
                                        <button
                                            onClick={handleClone}
                                            disabled={isCloning || !cloneText || !selectedPreset}
                                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-amber-500/20"
                                        >
                                            {isCloning ? <Loader2 className="animate-spin" size={20} /> : <Users size={20} />}
                                            <span>{isCloning ? 'Synthesizing Clone...' : 'Generate Clone'}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Audio Player */}
                    {currentAudio && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-2xl overflow-hidden relative"
                        >
                            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-vpurple to-vpink flex items-center justify-center text-white shrink-0">
                                    <AudioLines size={32} />
                                </div>
                                <div className="flex-1 w-full">
                                    <h3 className="text-white font-bold mb-1 truncate">{currentAudio.filename || 'Audio Track'}</h3>
                                    <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium">
                                        <span className="capitalize">{currentAudio.type}</span>
                                        <span>•</span>
                                        <span>{formatTime(audioProgress ? (audioProgress / 100) * audioDuration : 0)} / {formatTime(audioDuration)}</span>
                                    </div>
                                    <div className="w-full bg-slate-950 h-2 rounded-full mt-3 relative cursor-pointer group" onClick={seekAudio}>
                                        <div className="absolute top-0 left-0 bg-vpurple h-full rounded-full transition-all duration-100" style={{ width: `${audioProgress}%` }}></div>
                                        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-vpurple opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `${audioProgress}%` }}></div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button onClick={playPause} className="w-14 h-14 rounded-full bg-white text-slate-950 flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                                        {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                                    </button>
                                    <button onClick={downloadAudio} className="w-12 h-12 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center hover:bg-slate-700 transition-all">
                                        <Download size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Enhanced Lyrics View */}
                            {(currentAudio.lyrics || currentAudio.translated_lyrics) && (
                                <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {currentAudio.lyrics && (
                                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 block">Original Lyrics</span>
                                            <pre className="text-sm text-slate-400 whitespace-pre-wrap font-sans leading-relaxed">{currentAudio.lyrics}</pre>
                                        </div>
                                    )}
                                    {currentAudio.translated_lyrics && (
                                        <div className="bg-vpurple/5 p-4 rounded-xl border border-vpurple/20">
                                            <span className="text-[10px] font-black text-vpurple-light uppercase tracking-[0.2em] mb-2 block">Translated Version</span>
                                            <pre className="text-sm text-vpurple-light/90 whitespace-pre-wrap font-sans leading-relaxed">{currentAudio.translated_lyrics}</pre>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModelsPage;
