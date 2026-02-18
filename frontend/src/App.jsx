import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Download, Volume2, Mic, MicOff, Music, Globe, Users, Sparkles, Loader2, Type, AudioLines, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from './api';

const TABS = [
  { id: 'tts', label: 'Text to Speech', icon: Volume2, gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
  { id: 'song', label: 'Song Generator', icon: Music, gradient: 'linear-gradient(135deg, #ec4899, #be185d)' },
  { id: 'translate', label: 'Translator', icon: Globe, gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
  { id: 'clone', label: 'Voice Cloning', icon: Users, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
];

const API_BASE = 'http://localhost:8001';

function App() {
  const [activeTab, setActiveTab] = useState('tts');

  // TTS State
  const [text, setText] = useState('');
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Song State
  const [songPrompt, setSongPrompt] = useState('');
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [isSongGenerating, setIsSongGenerating] = useState(false);

  // Translator State
  const [translateInputText, setTranslateInputText] = useState('');
  const [languages, setLanguages] = useState([]);
  const [targetLang, setTargetLang] = useState('es');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [inputMode, setInputMode] = useState('text');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  // Clone State
  const [celebrities, setCelebrities] = useState([]);
  const [selectedCelebrity, setSelectedCelebrity] = useState('');
  const [cloneText, setCloneText] = useState('');
  const [cloneMode, setCloneMode] = useState('speak');
  const [isCloning, setIsCloning] = useState(false);

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
    fetchCelebrities();
  }, []);

  // ============= Audio Element Event Handlers =============
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

  // ============= Data Fetching =============
  const fetchVoices = async () => {
    try {
      const data = await api.get_voices();
      const enVoices = data.filter(v => v.Locale.startsWith('en'));
      setVoices(enVoices);
      if (enVoices.length > 0) setSelectedVoice(enVoices[0].ShortName);
    } catch (e) { console.error('Failed to fetch voices', e); }
  };

  const fetchGenres = async () => {
    try {
      const data = await api.get_genres();
      setGenres(data);
    } catch (e) { console.error('Failed to fetch genres', e); }
  };

  const fetchLanguages = async () => {
    try {
      const data = await api.get_languages();
      setLanguages(data);
    } catch (e) { console.error('Failed to fetch languages', e); }
  };

  const fetchCelebrities = async () => {
    try {
      const data = await api.get_celebrities();
      setCelebrities(data);
      if (data.length > 0) setSelectedCelebrity(data[0].id);
    } catch (e) { console.error('Failed to fetch celebrities', e); }
  };

  // ============= TTS Handler =============
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
      console.error(e);
      setStatusMessage({ type: 'error', text: 'Failed to generate speech. Please try again.' });
    } finally {
      setIsGenerating(false);
    }
  };

  // ============= Song Generation Handler =============
  const handleSongGenerate = async () => {
    if (!songPrompt) return;
    setIsSongGenerating(true);
    setStatusMessage({ type: 'info', text: 'Generating your song... This may take up to 2 minutes.' });
    try {
      const result = await api.generate_song(songPrompt, selectedGenre);
      if (result.status === 'error') {
        setStatusMessage({ type: 'error', text: result.error || 'Song generation failed.' });
        return;
      }
      setCurrentAudio({ ...result, type: 'song' });
      loadAndPlayAudio(result.url);
      const msg = result.note ? result.note : 'Song generated! Playing now.';
      setStatusMessage({ type: 'success', text: msg });
    } catch (e) {
      console.error(e);
      setStatusMessage({ type: 'error', text: 'Song generation failed. Please try again.' });
    } finally {
      setIsSongGenerating(false);
    }
  };

  // ============= Translation Handler =============
  const handleTranslateText = async () => {
    if (!translateInputText || !targetLang) return;
    setIsTranslating(true);
    setStatusMessage({ type: 'info', text: 'Translating and generating speech...' });
    try {
      const result = await api.translate_text(translateInputText, targetLang);
      if (result.status === 'error') {
        setStatusMessage({ type: 'error', text: result.error });
        setIsTranslating(false);
        return;
      }
      setTranslationResult(result);
      setCurrentAudio({ ...result, type: 'translate' });
      loadAndPlayAudio(result.url);
      setStatusMessage({ type: 'success', text: `Translated to ${result.target_language}! Playing now.` });
    } catch (e) {
      console.error(e);
      setStatusMessage({ type: 'error', text: 'Translation failed. Please try again.' });
    } finally {
      setIsTranslating(false);
    }
  };

  // ============= Voice Recording =============
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Use webm format (browser default) — the server will convert it
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all media tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        if (audioChunksRef.current.length === 0) {
          setStatusMessage({ type: 'error', text: 'No audio recorded. Please try again.' });
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

        setIsTranslating(true);
        setStatusMessage({ type: 'info', text: 'Processing your recording and translating...' });
        try {
          const result = await api.translate_audio(audioFile, targetLang);
          if (result.status === 'error') {
            setStatusMessage({ type: 'error', text: result.error });
            setIsTranslating(false);
            return;
          }
          setTranslationResult(result);
          setCurrentAudio({ ...result, type: 'translate' });
          loadAndPlayAudio(result.url);
          setStatusMessage({ type: 'success', text: `Translated to ${result.target_language}! Playing now.` });
        } catch (e) {
          console.error(e);
          setStatusMessage({ type: 'error', text: 'Translation of recording failed. Make sure FFmpeg is installed.' });
        } finally {
          setIsTranslating(false);
        }
      };

      mediaRecorder.start(250); // Collect data every 250ms
      setIsRecording(true);
      setStatusMessage({ type: 'info', text: '🔴 Recording... Click stop when done speaking.' });
    } catch (e) {
      console.error('Mic error:', e);
      setStatusMessage({ type: 'error', text: 'Microphone access denied. Please allow it in browser settings.' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // ============= Voice Cloning Handler =============
  const handleClone = async () => {
    if (!selectedCelebrity || !cloneText) return;
    setIsCloning(true);
    setStatusMessage({ type: 'info', text: `Generating ${cloneMode === 'sing' ? 'singing' : 'speech'} in celebrity voice...` });
    try {
      const result = await api.clone_voice(selectedCelebrity, cloneText, cloneMode);
      if (result.status === 'error') {
        setStatusMessage({ type: 'error', text: result.error });
        setIsCloning(false);
        return;
      }
      setCurrentAudio({ ...result, type: 'clone' });
      loadAndPlayAudio(result.url);
      setStatusMessage({ type: 'success', text: `Voice cloned as ${result.celebrity}! Playing now.` });
    } catch (e) {
      console.error(e);
      setStatusMessage({ type: 'error', text: 'Voice cloning failed. Please try again.' });
    } finally {
      setIsCloning(false);
    }
  };

  // ============= Render =============
  const activeTabData = TABS.find(t => t.id === activeTab);

  return (
    <div className="app-container">
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto" />

      {/* Background effects */}
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <AudioLines size={28} />
          <span>ELEVEN.AI</span>
        </div>
        <div className="nav-badge">AI Audio Platform</div>
      </nav>

      {/* Tab Navigation */}
      <div className="tab-bar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                setStatusMessage(null);
              }}
              style={activeTab === tab.id ? { background: tab.gradient } : {}}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <main className="main-content">
        {/* Status Message */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`status-bar status-${statusMessage.type}`}
            >
              {statusMessage.type === 'info' && <Loader2 size={16} className="spin" />}
              {statusMessage.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ====== TTS Tab ====== */}
        <AnimatePresence mode="wait">
          {activeTab === 'tts' && (
            <motion.div key="tts" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
              <div className="glass-card">
                <div className="card-header">
                  <Volume2 size={24} color="#8b5cf6" />
                  <div>
                    <h2>Text to Speech</h2>
                    <p className="card-subtitle">Convert text to natural-sounding speech</p>
                  </div>
                </div>
                <div className="form-group">
                  <label>ENTER TEXT</label>
                  <textarea
                    placeholder="What do you want the voice to say?..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="form-group">
                  <label>SELECT VOICE</label>
                  <div className="voice-list">
                    {voices.slice(0, 8).map((voice) => (
                      <div
                        key={voice.ShortName}
                        className={`voice-chip ${selectedVoice === voice.ShortName ? 'active' : ''}`}
                        onClick={() => setSelectedVoice(voice.ShortName)}
                      >
                        <span className="voice-name">{voice.FriendlyName.split('(')[0]}</span>
                        <span className="voice-meta">{voice.Gender} • {voice.Locale}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleTTS} disabled={isGenerating || !text}>
                  {isGenerating ? <Loader2 size={20} className="spin" /> : <Sparkles size={20} />}
                  {isGenerating ? 'Synthesizing...' : 'Generate Speech'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ====== Song Generator ====== */}
          {activeTab === 'song' && (
            <motion.div key="song" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
              <div className="glass-card">
                <div className="card-header">
                  <Music size={24} color="#ec4899" />
                  <div>
                    <h2>AI Song Generator</h2>
                    <p className="card-subtitle">Create unique music from text descriptions</p>
                  </div>
                </div>
                <div className="form-group">
                  <label>DESCRIBE YOUR SONG</label>
                  <textarea
                    placeholder="E.g., A happy upbeat summer song about friendship with acoustic guitar..."
                    value={songPrompt}
                    onChange={(e) => setSongPrompt(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="form-group">
                  <label>GENRE</label>
                  <div className="genre-grid">
                    {genres.map((genre) => (
                      <div
                        key={genre.id}
                        className={`genre-chip ${selectedGenre === genre.id ? 'active' : ''}`}
                        onClick={() => setSelectedGenre(selectedGenre === genre.id ? '' : genre.id)}
                      >
                        <span className="genre-emoji">{genre.emoji}</span>
                        <span>{genre.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button className="btn btn-pink" onClick={handleSongGenerate} disabled={isSongGenerating || !songPrompt}>
                  {isSongGenerating ? <Loader2 size={20} className="spin" /> : <Music size={20} />}
                  {isSongGenerating ? 'Creating Song...' : 'Generate Song'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ====== Translator ====== */}
          {activeTab === 'translate' && (
            <motion.div key="translate" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
              <div className="glass-card">
                <div className="card-header">
                  <Globe size={24} color="#3b82f6" />
                  <div>
                    <h2>Voice Translator</h2>
                    <p className="card-subtitle">Translate text or voice to any language</p>
                  </div>
                </div>

                <div className="mode-toggle">
                  <button className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`} onClick={() => setInputMode('text')}>
                    <Type size={16} /> Text Input
                  </button>
                  <button className={`mode-btn ${inputMode === 'mic' ? 'active' : ''}`} onClick={() => setInputMode('mic')}>
                    <Mic size={16} /> Voice Input
                  </button>
                </div>

                {inputMode === 'text' ? (
                  <div className="form-group">
                    <label>ENTER TEXT TO TRANSLATE</label>
                    <textarea
                      placeholder="Type something... e.g., Hello, how are you today?"
                      value={translateInputText}
                      onChange={(e) => setTranslateInputText(e.target.value)}
                      rows={4}
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label>RECORD YOUR VOICE</label>
                    <div className="mic-area">
                      {isRecording ? (
                        <button className="mic-btn recording" onClick={stopRecording}>
                          <Square size={28} />
                          <div className="pulse-ring"></div>
                        </button>
                      ) : (
                        <button className="mic-btn" onClick={startRecording} disabled={isTranslating}>
                          <Mic size={32} />
                        </button>
                      )}
                      <p className="mic-label">
                        {isRecording
                          ? '🔴 Recording... Click to stop'
                          : isTranslating
                            ? 'Processing recording...'
                            : 'Click to start recording'
                        }
                      </p>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>TARGET LANGUAGE</label>
                  <div className="lang-grid">
                    {languages.map((lang) => (
                      <div
                        key={lang.code}
                        className={`lang-chip ${targetLang === lang.code ? 'active' : ''}`}
                        onClick={() => setTargetLang(lang.code)}
                      >
                        <span className="lang-flag">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {inputMode === 'text' && (
                  <button className="btn btn-blue" onClick={handleTranslateText} disabled={isTranslating || !translateInputText}>
                    {isTranslating ? <Loader2 size={20} className="spin" /> : <Globe size={20} />}
                    {isTranslating ? 'Translating...' : 'Translate & Speak'}
                  </button>
                )}

                {translationResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="translation-result">
                    <div className="result-row">
                      <span className="result-label">Original:</span>
                      <span>{translationResult.original_text}</span>
                    </div>
                    <div className="result-row">
                      <span className="result-label">Translated:</span>
                      <span className="translated-text">{translationResult.translated_text}</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ====== Voice Cloning ====== */}
          {activeTab === 'clone' && (
            <motion.div key="clone" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
              <div className="glass-card">
                <div className="card-header">
                  <Users size={24} color="#f59e0b" />
                  <div>
                    <h2>Voice Cloning</h2>
                    <p className="card-subtitle">Speak or sing in the style of famous celebrities</p>
                  </div>
                </div>

                <div className="form-group">
                  <label>SELECT CELEBRITY VOICE</label>
                  <div className="celeb-grid">
                    {celebrities.map((celeb) => (
                      <div
                        key={celeb.id}
                        className={`celeb-chip ${selectedCelebrity === celeb.id ? 'active' : ''}`}
                        onClick={() => setSelectedCelebrity(celeb.id)}
                      >
                        <span className="celeb-avatar">{celeb.avatar}</span>
                        <div className="celeb-info">
                          <span className="celeb-name">{celeb.name}</span>
                          <span className="celeb-desc">{celeb.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>OUTPUT MODE</label>
                  <div className="mode-toggle">
                    <button className={`mode-btn ${cloneMode === 'speak' ? 'active' : ''}`} onClick={() => setCloneMode('speak')}>
                      <Volume2 size={16} /> Speak
                    </button>
                    <button className={`mode-btn ${cloneMode === 'sing' ? 'active' : ''}`} onClick={() => setCloneMode('sing')}>
                      <Music size={16} /> Sing
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>{cloneMode === 'sing' ? 'ENTER LYRICS' : 'ENTER TEXT'}</label>
                  <textarea
                    placeholder={cloneMode === 'sing'
                      ? "Enter song lyrics...\nTwinkle twinkle little star\nHow I wonder what you are"
                      : "Enter text for the celebrity to speak..."
                    }
                    value={cloneText}
                    onChange={(e) => setCloneText(e.target.value)}
                    rows={5}
                  />
                </div>

                <button className="btn btn-amber" onClick={handleClone} disabled={isCloning || !cloneText || !selectedCelebrity}>
                  {isCloning ? <Loader2 size={20} className="spin" /> : <Users size={20} />}
                  {isCloning ? 'Generating...' : `Clone & ${cloneMode === 'sing' ? 'Sing' : 'Speak'}`}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ====== Audio Player ====== */}
        <AnimatePresence>
          {currentAudio && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="audio-player glass-card"
            >
              <div className="player-header">
                <div className="player-icon" style={{ background: activeTabData?.gradient }}>
                  <AudioLines size={20} />
                </div>
                <div className="player-info">
                  <h3>
                    {currentAudio.type === 'tts' && 'Speech Synthesis'}
                    {currentAudio.type === 'song' && 'Generated Song'}
                    {currentAudio.type === 'translate' && 'Translation'}
                    {currentAudio.type === 'clone' && `${currentAudio.celebrity || 'Celebrity'} Voice`}
                  </h3>
                  <p>{currentAudio.filename}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="progress-container" onClick={seekAudio}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${audioProgress}%` }}></div>
                  <div className="progress-knob" style={{ left: `${audioProgress}%` }}></div>
                </div>
                <div className="time-display">
                  <span>{formatTime(audioRef.current?.currentTime)}</span>
                  <span>{formatTime(audioDuration)}</span>
                </div>
              </div>

              <div className="player-controls">
                <button className="btn-circle" onClick={playPause}>
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <button className="btn-secondary" onClick={downloadAudio}>
                  <Download size={18} /> Download
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="footer">
        <p>ELEVEN.AI — Powered by AI • Free & Open Source</p>
      </footer>
    </div>
  );
}

export default App;
