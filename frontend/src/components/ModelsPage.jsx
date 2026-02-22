import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Download, Volume2, Music, Globe, Users, Sparkles, Loader2, Type, AudioLines, Square, Wand2, Upload, FileAudio, Languages, Brain, Mic2, Speaker, Copy, Zap } from 'lucide-react';
import * as api from '../api';

const TABS = [
    { id: 'tts', label: 'Text to Speech', icon: Volume2, gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
    { id: 'lyrics', label: 'Lyrics Generator', icon: Music, gradient: 'linear-gradient(135deg, #ec4899, #be185d)' },
    { id: 'story', label: 'Story Teller', icon: Wand2, gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)' },
    { id: 'podcast', label: 'AI Podcast', icon: AudioLines, gradient: 'linear-gradient(135deg, #10b981, #059669)' },
    { id: 'music', label: 'Music & Beats', icon: Music, gradient: 'linear-gradient(135deg, #8b5cf6, #d946ef)' },
    { id: 'studio', label: 'Audio Studio', icon: Sparkles, gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
    { id: 'analysis', label: 'Mood Analysis', icon: Brain, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    { id: 'translate', label: 'Translator', icon: Globe, gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
    { id: 'karaoke', label: 'Karaoke Mode', icon: Mic2, gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)' },
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

    // Story State
    const [storyGenres, setStoryGenres] = useState([]);
    const [selectedStoryGenre, setSelectedStoryGenre] = useState('');
    const [storyTopic, setStoryTopic] = useState('');
    const [storyAgeGroup, setStoryAgeGroup] = useState('child');
    const [storyLanguage, setStoryLanguage] = useState('en');
    const [storyDuration, setStoryDuration] = useState(2);
    const [isStoryGenerating, setIsStoryGenerating] = useState(false);

    // Podcast State
    const [podcastTopics, setPodcastTopics] = useState([]);
    const [podcastTopic, setPodcastTopic] = useState('');
    const [selectedPodcastTopic, setSelectedPodcastTopic] = useState('');
    const [podcastDuration, setPodcastDuration] = useState(1);
    const [podcastVoices, setPodcastVoices] = useState(['en-US-GuyNeural', 'en-US-JennyNeural', 'en-US-AriaNeural']);
    const [isPodcastGenerating, setIsPodcastGenerating] = useState(false);

    // Music State
    const [instruments, setInstruments] = useState([]);
    const [selectedInstrument, setSelectedInstrument] = useState('');
    const [musicDuration, setMusicDuration] = useState(10);
    const [isMusicGenerating, setIsMusicGenerating] = useState(false);
    const [isRingtoneGenerating, setIsRingtoneGenerating] = useState(false);

    // Studio State
    const [studioFile, setStudioFile] = useState(null);
    const [studioEffect, setStudioEffect] = useState('speed_up');
    const [isStudioProcessing, setIsStudioProcessing] = useState(false);
    const [mashupFile1, setMashupFile1] = useState(null);
    const [mashupFile2, setMashupFile2] = useState(null);
    const [mashupStyle, setMashupStyle] = useState('smooth');
    const [mashupBalance, setMashupBalance] = useState(0.5);
    const [isMashupGenerating, setIsMashupGenerating] = useState(false);

    // Mood Analysis State
    const [analysisText, setAnalysisText] = useState('');
    const [analysisFile, setAnalysisFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    // Karaoke State
    const [karaokeLyrics, setKaraokeLyrics] = useState('');
    const [karaokeGenre, setKaraokeGenre] = useState('pop');
    const [isKaraokeGenerating, setIsKaraokeGenerating] = useState(false);

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
        fetchStoryGenres();
        fetchPodcastTopics();
        fetchInstruments();
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
        console.log("Fetching voice presets...");
        try {
            const data = await api.get_voice_presets();
            console.log("Voice presets data received:", data);
            const presetData = data && data.length > 0 ? data : FALLBACK_PRESETS;
            setVoicePresets(presetData);
            if (presetData.length > 0) setSelectedPreset(presetData[0].id);
        } catch (e) {
            console.error("Failed to fetch voice presets:", e);
            setVoicePresets(FALLBACK_PRESETS);
            setSelectedPreset(FALLBACK_PRESETS[0].id);
        }
    };

    const fetchStoryGenres = async () => {
        try {
            const data = await api.get_story_genres();
            setStoryGenres(data || []);
            if (data?.length > 0) setSelectedStoryGenre(data[0].id);
        } catch (e) { console.error(e); }
    };

    const fetchPodcastTopics = async () => {
        try {
            const data = await api.get_podcast_topics();
            setPodcastTopics(data || []);
            if (data?.length > 0) setSelectedPodcastTopic(data[0].id);
        } catch (e) { console.error(e); }
    };

    const fetchInstruments = async () => {
        try {
            const data = await api.get_instruments();
            setInstruments(data || []);
            if (data?.length > 0) setSelectedInstrument(data[0].id);
        } catch (e) { console.error(e); }
    };

    const handleStoryGenerate = async () => {
        if (!selectedStoryGenre && !storyTopic) return;
        setIsStoryGenerating(true);
        setStatusMessage({ type: 'info', text: '📖 Weaving your story...' });
        try {
            const result = await api.generate_story(selectedStoryGenre, storyTopic, storyAgeGroup, storyLanguage, storyDuration);
            if (result.status === 'error') {
                setStatusMessage({ type: 'error', text: result.error || 'Story generation failed.' });
                return;
            }
            setCurrentAudio({ ...result, type: 'story' });
            if (result.url) loadAndPlayAudio(result.url);
            setStatusMessage({ type: 'success', text: 'Story ready!' });
        } catch (e) {
            console.error('Story generation error:', e);
            const msg = e?.response?.data?.detail || e?.message || 'Story generation failed.';
            setStatusMessage({ type: 'error', text: msg });
        }
        finally { setIsStoryGenerating(false); }
    };

    const handlePodcastGenerate = async () => {
        const topic = podcastTopic || (selectedPodcastTopic ? podcastTopics.find(t => t.id === selectedPodcastTopic)?.label : '');
        if (!topic) return;
        setIsPodcastGenerating(true);
        setStatusMessage({ type: 'info', text: '🎙️ Mixing your podcast...' });
        try {
            const result = await api.generate_podcast(topic, podcastDuration, podcastVoices);
            if (result.status === 'error') {
                setStatusMessage({ type: 'error', text: result.error || 'Podcast failed.' });
                return;
            }
            setCurrentAudio({ ...result, type: 'podcast' });
            loadAndPlayAudio(result.url);
            setStatusMessage({ type: 'success', text: 'Podcast ready!' });
        } catch (e) { setStatusMessage({ type: 'error', text: 'Podcast failed.' }); }
        finally { setIsPodcastGenerating(false); }
    };

    const handleMusicGenerate = async () => {
        if (!selectedInstrument) return;
        setIsMusicGenerating(true);
        setStatusMessage({ type: 'info', text: '🎹 Tuning instruments, composing melody...' });
        try {
            const result = await api.generate_music(selectedInstrument, musicDuration);
            if (result.status === 'error') {
                setStatusMessage({ type: 'error', text: result.error || 'Music generation failed.' });
                return;
            }
            setCurrentAudio({ ...result, type: 'music' });
            loadAndPlayAudio(result.url);
            setStatusMessage({ type: 'success', text: 'Music composed successfully!' });
        } catch (e) { setStatusMessage({ type: 'error', text: e?.response?.data?.detail || 'Music composition failed.' }); }
        finally { setIsMusicGenerating(false); }
    };

    const handleRingtoneGenerate = async () => {
        setIsRingtoneGenerating(true);
        setStatusMessage({ type: 'info', text: '🔔 Creating short beat loop...' });
        try {
            const result = await api.generate_ringtone();
            setCurrentAudio({ ...result, type: 'ringtone' });
            loadAndPlayAudio(result.url);
            setStatusMessage({ type: 'success', text: 'Ringtone created!' });
        } catch (e) { setStatusMessage({ type: 'error', text: 'Ringtone creation failed.' }); }
        finally { setIsRingtoneGenerating(false); }
    };

    const handleStudioProcess = async () => {
        if (!studioFile) return;
        setIsStudioProcessing(true);
        setStatusMessage({ type: 'info', text: '🏚️ Applying professional studio effects...' });
        try {
            const result = await api.studio_process(studioFile, studioEffect);
            if (result.status === 'error') {
                setStatusMessage({ type: 'error', text: result.error || 'Processing failed.' });
                return;
            }
            setCurrentAudio({ ...result, type: 'studio' });
            loadAndPlayAudio(result.url);
            setStatusMessage({ type: 'success', text: 'Audio processing complete!' });
        } catch (e) {
            console.error('Studio processing error:', e);
            const msg = e?.response?.data?.detail || e?.message || 'Audio processing failed.';
            setStatusMessage({ type: 'error', text: msg });
        }
        finally { setIsStudioProcessing(false); }
    };

    const handleMashup = async () => {
        if (!mashupFile1 || !mashupFile2) return;
        setIsMashupGenerating(true);
        setStatusMessage({ type: 'info', text: '🎵 Creating mashup...' });
        try {
            const result = await api.audio_mashup(mashupFile1, mashupFile2, mashupStyle, mashupBalance);
            if (result.status === 'error') {
                setStatusMessage({ type: 'error', text: result.error || 'Mashup failed.' });
                return;
            }
            setCurrentAudio({ ...result, type: 'mashup' });
            loadAndPlayAudio(result.url);
            setStatusMessage({ type: 'success', text: 'Mashup generated!' });
        } catch (e) {
            console.error('Mashup error:', e);
            const msg = e?.response?.data?.detail || e?.message || 'Mashup failed.';
            setStatusMessage({ type: 'error', text: msg });
        }
        finally { setIsMashupGenerating(false); }
    };

    const handleMoodAnalyze = async () => {
        if (!analysisText && !analysisFile) return;
        setIsAnalyzing(true);
        setStatusMessage({ type: 'info', text: '🧠 Analyzing patterns, detecting mood...' });
        try {
            const result = await api.analyze_mood(analysisText, analysisFile);
            setAnalysisResult(result.mood);
            setStatusMessage({ type: 'success', text: 'Mood analysis complete!' });
        } catch (e) { setStatusMessage({ type: 'error', text: 'Analysis failed.' }); }
        finally { setIsAnalyzing(false); }
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
        setStatusMessage({ type: 'info', text: targetLang === 'all' ? 'Processing universal translation...' : 'Translating...' });
        try {
            let result;
            if (targetLang === 'all') {
                result = await api.translate_to_all(translateInputText);
            } else {
                result = await api.translate_text(translateInputText, targetLang, sourceLang);
            }
            setTranslationResult(result);
            if (result.url) {
                setCurrentAudio({ ...result, type: 'translate' });
                loadAndPlayAudio(result.url);
            } else {
                setCurrentAudio({ ...result, type: 'translate_all' });
            }
            setStatusMessage({ type: 'success', text: 'Translation complete!' });
        } catch (e) {
            setStatusMessage({ type: 'error', text: 'Translation failed.' });
        } finally {
            setIsTranslating(false);
        }
    };

    const handleKaraokeGenerate = async () => {
        if (!karaokeLyrics) return;
        setIsKaraokeGenerating(true);
        setStatusMessage({ type: 'info', text: '🎤 Preparing your stage, generating vocals and beats...' });
        try {
            const result = await api.generate_lyrics(karaokeLyrics, karaokeGenre, 10, 'en');
            if (result.status === 'error') {
                setStatusMessage({ type: 'error', text: result.error || 'Karaoke generation failed.' });
                return;
            }
            setCurrentAudio({ ...result, type: 'karaoke' });
            if (result.url) loadAndPlayAudio(result.url);
            setStatusMessage({ type: 'success', text: 'Karaoke track ready! Sing along!' });
        } catch (e) {
            console.error('Karaoke generation error:', e);
            const msg = e?.response?.data?.detail || e?.message || 'Karaoke generation failed.';
            setStatusMessage({ type: 'error', text: msg });
        }
        finally { setIsKaraokeGenerating(false); }
    };

    const handleClone = async () => {
        if (!selectedPreset || !cloneText) return;
        setIsCloning(true);
        setStatusMessage({ type: 'info', text: '🎭 Cloning voice...' });
        try {
            const result = await api.clone_voice(selectedPreset, cloneText, cloneMode);
            if (result.status === 'error') {
                setStatusMessage({ type: 'error', text: result.error || 'Cloning failed.' });
                return;
            }
            setCurrentAudio({ ...result, type: 'clone' });
            if (result.url) loadAndPlayAudio(result.url);
            setStatusMessage({ type: 'success', text: 'Voice cloned successfully!' });
        } catch (e) {
            console.error('Clone error:', e);
            const msg = e?.response?.data?.detail || e?.message || 'Cloning failed.';
            setStatusMessage({ type: 'error', text: msg });
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

                            {/* STORY TAB */}
                            {activeTab === 'story' && (
                                <div className="space-y-6">
                                    {/* ... Story UI ... */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Story Topic / Prompt</label>
                                            <textarea
                                                className="w-full bg-slate-950 border border-slate-800 text-white p-4 rounded-xl focus:outline-none focus:border-vpurple h-24 resize-none"
                                                placeholder="What should the story be about?"
                                                value={storyTopic}
                                                onChange={(e) => setStoryTopic(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Story Genre</label>
                                                <select
                                                    className="w-full bg-slate-950 border border-slate-800 text-white p-4 rounded-xl focus:outline-none"
                                                    value={selectedStoryGenre}
                                                    onChange={(e) => setSelectedStoryGenre(e.target.value)}
                                                >
                                                    {storyGenres.map(g => (
                                                        <option key={g.id} value={g.id}>{g.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Audience Age Group</label>
                                                        <select
                                                            className="w-full bg-slate-950 border border-slate-800 text-white p-4 rounded-xl focus:outline-none"
                                                            value={storyAgeGroup}
                                                            onChange={(e) => setStoryAgeGroup(e.target.value)}
                                                        >
                                                            <option value="child">👧 Kid (Comic/Moral)</option>
                                                            <option value="teen">🧑‍🎤 Teen (Mystery/Thriller)</option>
                                                            <option value="adult">👨 Adult (Suspense/Horror)</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Story Duration</label>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {[2, 5, 10, 15].map(d => (
                                                                <button
                                                                    key={d}
                                                                    onClick={() => setStoryDuration(d)}
                                                                    className={`p-3 rounded-lg border font-bold text-xs transition-all ${storyDuration === d ? 'bg-vpurple text-white border-vpurple shadow-lg shadow-vpurple/20' : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-700'}`}
                                                                >
                                                                    {d} min
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Language</label>
                                                        <select
                                                            className="w-full bg-slate-950 border border-slate-800 text-white p-4 rounded-xl focus:outline-none"
                                                            value={storyLanguage}
                                                            onChange={(e) => setStoryLanguage(e.target.value)}
                                                        >
                                                            {languages.map(l => (
                                                                <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="p-4 bg-slate-950/30 border border-slate-800 rounded-2xl">
                                                        <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                                            Longer durations will generate deeper plot twists and multi-segment narratives for a complete experience.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleStoryGenerate}
                                        disabled={isStoryGenerating || (!selectedStoryGenre && !storyTopic)}
                                        className="w-full bg-vpurple hover:bg-vpurple-dark text-white font-bold py-5 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-vpurple/20 transition-all"
                                    >
                                        {isStoryGenerating ? <Loader2 className="animate-spin" size={24} /> : <Wand2 size={20} />}
                                        <span>{isStoryGenerating ? 'Generating Tale...' : 'Tell Me a Story'}</span>
                                    </button>
                                </div>
                            )}

                            {/* PODCAST TAB */}
                            {activeTab === 'podcast' && (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Podcast Topic</label>
                                            <textarea
                                                className="w-full bg-slate-950 border border-emerald-800/30 text-white p-4 rounded-xl focus:outline-none focus:border-emerald-500 h-24 resize-none"
                                                placeholder="What should the hosts discuss? (e.g. The future of autonomous vehicles)"
                                                value={podcastTopic}
                                                onChange={(e) => setPodcastTopic(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Episode Length</label>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {[1, 3, 5, 10].map(d => (
                                                        <button
                                                            key={d}
                                                            onClick={() => setPodcastDuration(d)}
                                                            className={`p-3 rounded-lg border font-bold text-xs transition-all ${podcastDuration === d ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-700'}`}
                                                        >
                                                            {d} min
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="pt-2">
                                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Speaker Voices</label>
                                                    <div className="space-y-2 mt-2">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className="flex items-center space-x-2">
                                                                <span className="text-[10px] font-black text-slate-600 uppercase w-16">Voice {i}</span>
                                                                <select
                                                                    className="flex-1 bg-slate-950 border border-slate-800 text-white p-2 rounded-lg text-xs focus:outline-none"
                                                                    value={podcastVoices[i - 1]}
                                                                    onChange={(e) => {
                                                                        const newVoices = [...podcastVoices];
                                                                        newVoices[i - 1] = e.target.value;
                                                                        setPodcastVoices(newVoices);
                                                                    }}
                                                                >
                                                                    {voices.map(v => (
                                                                        <option key={v.ShortName} value={v.ShortName}>{v.FriendlyName || v.Name}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <div className="p-6 bg-emerald-600/5 border border-emerald-500/20 rounded-[2rem] space-y-3">
                                                    <div className="flex items-center space-x-2 text-emerald-500">
                                                        <Users size={18} />
                                                        <span className="text-sm font-black uppercase tracking-widest">Multi-Host Engine</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 leading-relaxed italic">
                                                        The AI will automatically generate a dynamic script and assign it to your chosen voices.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handlePodcastGenerate}
                                        disabled={isPodcastGenerating || !podcastTopic}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-5 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all"
                                    >
                                        {isPodcastGenerating ? <Loader2 className="animate-spin" size={24} /> : <AudioLines size={20} />}
                                        <span>{isPodcastGenerating ? 'Recording AI Hosts...' : 'Generate Podcast Episode'}</span>
                                    </button>
                                </div>
                            )}

                            {/* MUSIC TAB */}
                            {activeTab === 'music' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Primary Instrument</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {instruments.map(inst => (
                                                    <button
                                                        key={inst.id}
                                                        onClick={() => setSelectedInstrument(inst.id)}
                                                        className={`p-4 rounded-xl border font-bold text-sm transition-all ${selectedInstrument === inst.id ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'}`}
                                                    >
                                                        {inst.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Music Length</label>
                                            <input
                                                type="range" min="10" max="60" step="10"
                                                value={musicDuration}
                                                onChange={(e) => setMusicDuration(e.target.value)}
                                                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                            />
                                            <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                                                <span>10s</span>
                                                <span>30s</span>
                                                <span>60s</span>
                                            </div>
                                            <div className="pt-4 flex gap-2">
                                                <button
                                                    onClick={handleRingtoneGenerate}
                                                    disabled={isRingtoneGenerating}
                                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 transition-all border border-white/5"
                                                >
                                                    {isRingtoneGenerating ? <Loader2 className="animate-spin" size={16} /> : <Speaker size={16} />}
                                                    <span className="text-xs">Create Ringtone</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleMusicGenerate}
                                        disabled={isMusicGenerating || !selectedInstrument}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 rounded-2xl flex items-center justify-center space-x-2 shadow-lg transition-all"
                                    >
                                        {isMusicGenerating ? <Loader2 className="animate-spin" size={24} /> : <Music size={20} />}
                                        <span>{isMusicGenerating ? 'Synthesizing Melodies...' : 'Generate Instrumental Beat'}</span>
                                    </button>
                                </div>
                            )}

                            {/* STUDIO TAB */}
                            {activeTab === 'studio' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest">Effects Studio</h4>
                                            <div className="p-8 border-2 border-dashed border-slate-800 rounded-[2rem] flex flex-col items-center justify-center space-y-4 hover:border-vpurple/50 transition-colors bg-slate-950/30 group">
                                                <input type="file" id="studio-upload" className="hidden" onChange={(e) => setStudioFile(e.target.files[0])} />
                                                <label htmlFor="studio-upload" className="cursor-pointer flex flex-col items-center">
                                                    <div className="p-4 bg-slate-900 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                                                        <Upload className="text-vpurple" size={32} />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-400">{studioFile ? studioFile.name : 'Upload Audio to Process'}</span>
                                                </label>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['speed_up', 'slowed', 'reverb', 'enhance', 'trigger'].map(ef => (
                                                    <button
                                                        key={ef}
                                                        onClick={() => setStudioEffect(ef)}
                                                        className={`p-3 rounded-xl border text-[10px] font-black tracking-widest transition-all ${studioEffect === ef ? 'bg-vpurple text-white border-vpurple' : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700'}`}
                                                    >
                                                        {ef.replace('_', ' ').toUpperCase()}
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                onClick={handleStudioProcess}
                                                disabled={isStudioProcessing || !studioFile}
                                                className="w-full bg-vpurple hover:bg-vpurple-dark text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-vpurple/20"
                                            >
                                                {isStudioProcessing ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                                                <span>{isStudioProcessing ? 'Applying Effect...' : 'Process Audio'}</span>
                                            </button>
                                        </div>

                                        <div className="space-y-4 pt-0">
                                            <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest">Audio Mashup</h4>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="flex items-center space-x-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                                                        <input type="file" id="mash1" className="hidden" onChange={(e) => setMashupFile1(e.target.files[0])} />
                                                        <label htmlFor="mash1" className="cursor-pointer flex items-center space-x-3 flex-1">
                                                            <FileAudio size={20} className="text-vpink" />
                                                            <span className="text-xs font-bold text-slate-400 truncate">{mashupFile1 ? mashupFile1.name : 'Track 1'}</span>
                                                        </label>
                                                    </div>
                                                    <div className="flex items-center space-x-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                                                        <input type="file" id="mash2" className="hidden" onChange={(e) => setMashupFile2(e.target.files[0])} />
                                                        <label htmlFor="mash2" className="cursor-pointer flex items-center space-x-3 flex-1">
                                                            <FileAudio size={20} className="text-vblue" />
                                                            <span className="text-xs font-bold text-slate-400 truncate">{mashupFile2 ? mashupFile2.name : 'Track 2'}</span>
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="space-y-3 p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                                                            <span>Crossfade Style</span>
                                                            <span className="text-vpink capitalize">{mashupStyle}</span>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-1">
                                                            {['instant', 'smooth', 'overlap'].map(m => (
                                                                <button
                                                                    key={m}
                                                                    onClick={() => setMashupStyle(m)}
                                                                    className={`py-1 rounded bg-slate-900 text-[8px] font-black uppercase transition-all ${mashupStyle === m ? 'text-vpink border border-vpink/30' : 'text-slate-600 border border-transparent'}`}
                                                                >
                                                                    {m}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                                                            <span>Mood Alignment</span>
                                                            <span className="text-vblue">{Math.round(mashupBalance * 100)}% Shift</span>
                                                        </div>
                                                        <input
                                                            type="range" min="0" max="1" step="0.1"
                                                            value={mashupBalance}
                                                            onChange={(e) => setMashupBalance(parseFloat(e.target.value))}
                                                            className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-vblue"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleMashup}
                                                disabled={isMashupGenerating || !mashupFile1 || !mashupFile2}
                                                className="w-full bg-vpink hover:bg-vpink-dark text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-vpink/20"
                                            >
                                                {isMashupGenerating ? <Loader2 className="animate-spin" size={20} /> : <AudioLines size={20} />}
                                                <span>{isMashupGenerating ? 'Creating Mashup...' : 'Generate Audio Mashup'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ANALYSIS TAB */}
                            {activeTab === 'analysis' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Analyze Text Mood</label>
                                                <textarea
                                                    className="w-full bg-slate-950 border border-slate-800 text-white p-5 rounded-2xl focus:outline-none focus:border-vpurple h-24 transition-all resize-none"
                                                    placeholder="Type something emotional..."
                                                    value={analysisText}
                                                    onChange={(e) => setAnalysisText(e.target.value)}
                                                />
                                            </div>
                                            <div className="relative">
                                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                                                <div className="relative flex justify-center text-xs uppercase font-black text-slate-600 bg-slate-900 px-2 leading-none">OR</div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Analyze Audio File</label>
                                                <input type="file" onChange={(e) => setAnalysisFile(e.target.files[0])} className="w-full bg-slate-950 border border-slate-800 text-slate-400 p-3 rounded-xl text-xs" />
                                            </div>
                                            <button
                                                onClick={handleMoodAnalyze}
                                                disabled={isAnalyzing || (!analysisText && !analysisFile)}
                                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg"
                                            >
                                                {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Brain size={20} />}
                                                <span>{isAnalyzing ? 'Analyzing Mood...' : 'Analyze Mood'}</span>
                                            </button>
                                        </div>

                                        <div className="bg-slate-950/50 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center">
                                            {analysisResult ? (
                                                <div className="w-full space-y-4">
                                                    <h4 className="text-center font-black text-amber-500 uppercase tracking-widest mb-6">Mood Analysis Results</h4>
                                                    {Object.entries(analysisResult).map(([mood, perc]) => (
                                                        <div key={mood} className="space-y-1">
                                                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                                                                <span>{mood}</span>
                                                                <span>{perc}%</span>
                                                            </div>
                                                            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                                                                <motion.div initial={{ width: 0 }} animate={{ width: `${perc}%` }} className="bg-amber-500 h-full" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center space-y-3">
                                                    <Brain size={48} className="text-slate-800 mx-auto" />
                                                    <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">Awaiting Input</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* KARAOKE TAB */}
                            {activeTab === 'karaoke' && (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Paste Your Lyrics</label>
                                            <textarea
                                                className="w-full bg-slate-950 border border-slate-800 text-white p-6 rounded-2xl focus:outline-none focus:border-vpink h-48 transition-all resize-none font-sans leading-relaxed"
                                                placeholder="Paste the lyrics you want the AI to sing..."
                                                value={karaokeLyrics}
                                                onChange={(e) => setKaraokeLyrics(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Musical Style</label>
                                                <select
                                                    className="w-full bg-slate-950 border border-slate-800 text-white p-4 rounded-xl focus:outline-none"
                                                    value={karaokeGenre}
                                                    onChange={(e) => setKaraokeGenre(e.target.value)}
                                                >
                                                    {genres.map(g => (
                                                        <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex items-end">
                                                <button
                                                    onClick={handleKaraokeGenerate}
                                                    disabled={isKaraokeGenerating || !karaokeLyrics}
                                                    className="w-full bg-gradient-to-r from-vpink to-vpurple hover:opacity-90 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all"
                                                >
                                                    {isKaraokeGenerating ? <Loader2 className="animate-spin" size={20} /> : <Mic2 size={20} />}
                                                    <span>{isKaraokeGenerating ? 'Synthesizing...' : 'Generate AI Karaoke'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-slate-950/30 border border-slate-800 rounded-2xl">
                                        <p className="text-xs text-slate-500 leading-relaxed italic">
                                            <Sparkles size={12} className="inline mr-1 text-vpink" />
                                            AI will generate vocals matching your lyrics and mix them with a procedural beat. Use this to prepare for your own performance or just enjoy the AI version!
                                        </p>
                                    </div>
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
                                            <option value="all">🌍 All Languages simultaneously</option>
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
                                                {voicePresets && voicePresets.length > 0 ? (
                                                    filteredPresets && filteredPresets.length > 0 ? filteredPresets.map(p => (
                                                        <div
                                                            key={p.id}
                                                            onClick={() => setSelectedPreset(p.id)}
                                                            className={`p-3 rounded-xl border flex items-center space-x-2 cursor-pointer transition-all ${selectedPreset === p.id ? 'bg-amber-500 text-white border-amber-400' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'}`}
                                                        >
                                                            <span className="text-xl">{p.avatar}</span>
                                                            <span className="text-xs font-bold truncate">{p.name}</span>
                                                        </div>
                                                    )) : (
                                                        <div className="col-span-2 text-center text-slate-500 text-xs py-4">
                                                            No presets found in this category.
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="col-span-2 text-center text-slate-500 text-xs py-4 flex items-center justify-center space-x-2">
                                                        <Loader2 className="animate-spin" size={12} />
                                                        <span>Connecting to voice dimension...</span>
                                                        <button onClick={fetchVoicePresets} className="ml-2 text-amber-500 hover:underline">Retry</button>
                                                    </div>
                                                )}
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
                                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 relative group">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Original Lyrics</span>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(currentAudio.lyrics);
                                                        setStatusMessage({ type: 'success', text: 'Lyrics copied!' });
                                                    }}
                                                    className="flex items-center space-x-1 px-2 py-1 bg-slate-800 hover:bg-vpurple rounded-lg transition-all text-slate-400 hover:text-white text-[10px] font-bold"
                                                >
                                                    <Copy size={12} />
                                                    <span>Copy</span>
                                                </button>
                                            </div>
                                            <pre className="text-sm text-slate-400 whitespace-pre-wrap font-sans leading-relaxed">{currentAudio.lyrics}</pre>
                                        </div>
                                    )}
                                    {currentAudio.translated_lyrics && (
                                        <div className="bg-vpurple/5 p-4 rounded-xl border border-vpurple/20 relative group">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-black text-vpurple-light uppercase tracking-[0.2em]">Translated Version</span>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(currentAudio.translated_lyrics);
                                                        setStatusMessage({ type: 'success', text: 'Translated lyrics copied!' });
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-vpurple/20 rounded transition-all text-vpurple-light"
                                                >
                                                    <Copy size={14} />
                                                </button>
                                            </div>
                                            <pre className="text-sm text-vpurple-light/90 whitespace-pre-wrap font-sans leading-relaxed">{currentAudio.translated_lyrics}</pre>
                                        </div>
                                    )}
                                    {currentAudio.story && (
                                        <div className="col-span-full bg-vpink/5 p-6 rounded-2xl border border-vpink/20 relative group">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[10px] font-black text-vpink-light uppercase tracking-[0.2em]">Narrated story</span>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(currentAudio.story);
                                                        setStatusMessage({ type: 'success', text: 'Story copied!' });
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-vpink/20 rounded transition-all text-vpink-light"
                                                >
                                                    <Copy size={14} />
                                                </button>
                                            </div>
                                            <p className="text-sm text-vpink-light/90 font-sans leading-relaxed italic">{currentAudio.story}</p>
                                        </div>
                                    )}
                                    {currentAudio.results && currentAudio.type === 'translate_all' && (
                                        <div className="col-span-full space-y-4 pt-4 border-t border-slate-800">
                                            <span className="text-[10px] font-black text-vblue-light uppercase tracking-[0.2em]">Universal Translations</span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                {Object.entries(currentAudio.results).map(([lang, text]) => (
                                                    <div key={lang} className="p-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl space-y-2 group/item">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-black text-slate-500 uppercase">{lang}</span>
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(text);
                                                                    setStatusMessage({ type: 'success', text: `${lang} copied!` });
                                                                }}
                                                                className="opacity-0 group-hover/item:opacity-100 text-slate-600 hover:text-vpurple transition-all"
                                                            >
                                                                <Copy size={12} />
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-slate-300 line-clamp-3 italic leading-relaxed">{text}</p>
                                                    </div>
                                                ))}
                                            </div>
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
