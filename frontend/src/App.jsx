import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Download, Volume2, Mic, History, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';
import * as api from './api';

function App() {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);

  useEffect(() => {
    fetchVoices();
    initWaveSurfer();
    return () => wavesurfer.current?.destroy();
  }, []);

  const initWaveSurfer = () => {
    if (waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#4f46e5',
        progressColor: '#8b5cf6',
        cursorColor: '#8b5cf6',
        barWidth: 2,
        barRadius: 3,
        responsive: true,
        height: 60,
      });

      wavesurfer.current.on('play', () => setIsPlaying(true));
      wavesurfer.current.on('pause', () => setIsPlaying(false));
      wavesurfer.current.on('finish', () => setIsPlaying(false));
    }
  };

  const fetchVoices = async () => {
    try {
      const data = await api.get_voices();
      const enUSVoices = data.filter(v => v.Locale.startsWith('en-US'));
      setVoices(enUSVoices);
      if (enUSVoices.length > 0) setSelectedVoice(enUSVoices[0].ShortName);
    } catch (error) {
      console.error('Failed to fetch voices', error);
    }
  };

  const handleGenerate = async () => {
    if (!text || !selectedVoice) return;

    setIsGenerating(true);
    try {
      const result = await api.synthesize(text, selectedVoice);
      const audioUrl = `http://localhost:8001${result.url}`;

      setCurrentAudio(result);
      setHistory([result, ...history]);

      wavesurfer.current.load(audioUrl);
    } catch (error) {
      console.error('Generation failed', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const playPause = () => {
    wavesurfer.current.playPause();
  };

  const downloadAudio = (url, name) => {
    const link = document.createElement('a');
    link.href = `http://localhost:8001${url}`;
    link.download = name || 'speech.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadFromHistory = (item) => {
    setCurrentAudio(item);
    wavesurfer.current.load(`http://localhost:8001${item.url}`);
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">ELEVEN.AI</div>
        <div className="nav-links">
          <History size={20} className="icon-btn" />
        </div>
      </nav>

      <main className="main-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
        >
          <div className="form-group">
            <label>TEXT TO SPEECH</label>
            <textarea
              placeholder="What do you want the voice to say? Experience high fidelity speech synthesis..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
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

          <button
            className="btn"
            onClick={handleGenerate}
            disabled={isGenerating || !text}
          >
            {isGenerating ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Sparkles size={20} />
            )}
            {isGenerating ? 'Synthesizing...' : 'Generate Speech'}
          </button>
        </motion.div>

        <AnimatePresence>
          {currentAudio && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="audio-player glass-card"
            >
              <div className="player-header">
                <Volume2 size={24} color="#8b5cf6" />
                <div className="player-info">
                  <h3>Generated Synthesis</h3>
                  <p>{currentAudio.voice}</p>
                </div>
              </div>

              <div ref={waveformRef} className="waveform" />

              <div className="player-controls">
                <button className="btn-circle" onClick={playPause}>
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <button className="btn-secondary" onClick={() => downloadAudio(currentAudio.url)}>
                  <Download size={20} /> Export
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {history.length > 0 && (
          <div className="history-section">
            <h2 className="section-title">History</h2>
            <div className="glass-card">
              {history.map((item, idx) => (
                <div key={idx} className="history-item">
                  <div className="history-info">
                    <p className="history-text">{item.text.substring(0, 60)}...</p>
                    <span className="history-voice">{item.voice}</span>
                  </div>
                  <div className="history-actions">
                    <button className="btn-icon" onClick={() => loadFromHistory(item)}>
                      <Play size={16} />
                    </button>
                    <button className="btn-icon" onClick={() => downloadAudio(item.url)}>
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .player-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
        .player-info h3 { font-size: 1.1rem; margin: 0; }
        .player-info p { font-size: 0.8rem; color: var(--text-dim); margin: 0; }
        .player-controls { display: flex; align-items: center; justify-content: center; gap: 2rem; margin-top: 1.5rem; }
        .btn-circle { width: 60px; height: 60px; border-radius: 50%; background: var(--primary); border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .btn-circle:hover { background: var(--primary-hover); transform: scale(1.05); }
        .btn-secondary { background: rgba(255, 255, 255, 0.1); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
        .btn-secondary:hover { background: rgba(255, 255, 255, 0.15); }
        .section-title { margin: 2rem 0 1rem; font-size: 1.25rem; font-weight: 700; color: var(--text-dim); }
        .history-text { font-size: 0.9rem; margin: 0; }
        .history-voice { font-size: 0.75rem; color: var(--text-dim); }
        .btn-icon { background: transparent; border: 1px solid var(--card-border); color: var(--text-dim); padding: 0.5rem; border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; }
        .btn-icon:hover { border-color: var(--primary); color: var(--primary); }
        .history-actions { display: flex; gap: 0.5rem; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default App;
