import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('Aap kya talash kar rahe hai? (Click mic to speak)');
  const [lang, setLang] = useState('ur-PK'); // Default Bilingual Urdu / English
  const navigate = useNavigate();

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const vadIntervalRef = useRef(null);
  const hasSpokenRef = useRef(false);
  const silenceStartRef = useRef(null);
  const langRef = useRef(lang);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    return () => {
      if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try { audioContextRef.current.close(); } catch (e) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const speakResponse = (text, targetLang = 'en-US') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/[*_~`#]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[🏠🏢💰❓🔑😊•]/gu, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const hasUrduChars = /[\u0600-\u06FF]/.test(cleanText);
    utterance.lang = hasUrduChars ? 'ur-PK' : (targetLang || 'en-US');
    window.speechSynthesis.speak(utterance);
  };

  const startVoice = async () => {
    hasSpokenRef.current = false;
    silenceStartRef.current = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      streamRef.current = stream;

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
        else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }

        if (vadIntervalRef.current) {
          clearInterval(vadIntervalRef.current);
          vadIntervalRef.current = null;
        }

        const actualType = mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: actualType });

        if (audioBlob.size > 250) {
          await processAudio(audioBlob, actualType);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(150);
      setIsListening(true);

      // VAD silence detection
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          vadIntervalRef.current = setInterval(() => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avgVolume = sum / dataArray.length;

            if (avgVolume > 10) {
              hasSpokenRef.current = true;
              silenceStartRef.current = null;
            } else if (hasSpokenRef.current) {
              if (!silenceStartRef.current) {
                silenceStartRef.current = Date.now();
              } else if (Date.now() - silenceStartRef.current > 1100) {
                stopVoice();
              }
            }
          }, 100);
        }
      } catch (e) {
        console.warn('VAD AudioContext error:', e);
      }

    } catch (err) {
      console.error('Microphone error:', err);
      setIsListening(false);
      setReply('Microphone permission blocked or unavailable.');
    }
  };

  const stopVoice = () => {
    setIsListening(false);
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
  };

  const processAudio = async (audioBlob, mimeType) => {
    setIsTranscribing(true);
    try {
      const currentLang = langRef.current || 'ur-PK';
      const formData = new FormData();
      const ext = mimeType.includes('mp4') ? 'm4a' : 'webm';
      formData.append('audio', audioBlob, `speech.${ext}`);
      formData.append('lang', currentLang);

      const res = await fetch(`${API_BASE}/chat/voice?lang=${encodeURIComponent(currentLang)}`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success && data.data?.text) {
        const spokenText = data.data.text.trim();
        setTranscript(spokenText);

        // Query AI backend with transcribed text
        const chatRes = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: spokenText })
        });
        const chatData = await chatRes.json();

        if (chatData.success && chatData.data?.reply) {
          const aiReply = chatData.data.reply;
          setReply(aiReply);
          speakResponse(aiReply, currentLang);
        }
      }
    } catch (err) {
      console.error('Voice Assistant processing error:', err);
      setReply('Server connection error. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div
      className="fixed bottom-6 left-6 z-50 flex items-center rounded-full p-2.5 space-x-3 transition-all border shadow-xl"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }}
    >
      <button
        onClick={isListening ? stopVoice : startVoice}
        disabled={isTranscribing}
        className="p-3.5 rounded-full transition-all flex items-center justify-center disabled:opacity-50"
        style={isListening
          ? { background: 'var(--danger, #ef4444)', color: '#fff', transform: 'scale(1.1)' }
          : { background: 'var(--brand)', color: 'var(--brand-ink)' }}
        title="Voice Command Assistant"
      >
        {isListening ? (
          <MicOff className="w-5 h-5" />
        ) : isTranscribing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      <div className="pr-3 text-xs max-w-xs">
        <div className="flex items-center space-x-1 font-bold" style={{ color: 'var(--ink)' }}>
          <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--brand)' }} />
          <span>SmartVoice AI ({lang === 'ur-PK' ? 'اردو / Eng' : 'English'})</span>
        </div>
        <p className="truncate mt-0.5 font-medium" style={{ color: 'var(--ink-soft)' }}>
          {isListening
            ? 'Listening... (chup hone par auto-search)'
            : isTranscribing
            ? 'Processing voice with AI...'
            : (transcript ? `You: "${transcript}"` : reply)}
        </p>
      </div>

      <button
        onClick={() => setLang(lang === 'ur-PK' ? 'en-US' : 'ur-PK')}
        className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition whitespace-nowrap"
        style={{ background: 'var(--surface-tint)', borderColor: 'var(--border)', color: 'var(--ink-soft)' }}
        title="Switch Language Model"
      >
        {lang === 'ur-PK' ? 'UR ⇄ EN' : 'EN ⇄ UR'}
      </button>
    </div>
  );
};

export default VoiceAssistant;
