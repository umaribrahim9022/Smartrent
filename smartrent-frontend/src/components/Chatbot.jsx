import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Building, MapPin, ExternalLink, Mic, MicOff, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Chatbot = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your SmartRent AI Assistant. You can speak or type in Urdu or English to find properties by city, budget, bedrooms, or type.',
      properties: []
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [lang, setLang] = useState('ur-PK'); // Default to Urdu / Bilingual
  const [speechError, setSpeechError] = useState(null);

  const messagesEndRef = useRef(null);
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  // Cleanup microphone, AudioContext, and timers on unmount
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

  // ── Smart Voice: Live Speech-to-Text with Auto-Stop on Silence ──
  const startVoice = async () => {
    setSpeechError(null);
    hasSpokenRef.current = false;
    silenceStartRef.current = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true, 
          autoGainControl: true 
        } 
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
          await fetchWhisperTranscription(audioBlob, actualType);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(150);
      setIsListening(true);

      // AudioContext Silence Detector (Auto-Stops when user stops speaking)
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
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avgVolume = sum / dataArray.length;

            if (avgVolume > 10) {
              // User is actively speaking
              hasSpokenRef.current = true;
              silenceStartRef.current = null;
            } else if (hasSpokenRef.current) {
              // User was speaking and is now silent
              if (!silenceStartRef.current) {
                silenceStartRef.current = Date.now();
              } else if (Date.now() - silenceStartRef.current > 1100) {
                // 1.1s silence after speech -> Auto Stop & Transcribe!
                stopVoice();
              }
            }
          }, 100);
        }
      } catch (vadErr) {
        console.warn('VAD AudioContext error:', vadErr);
      }

    } catch (err) {
      console.error('Microphone access error:', err);
      setIsListening(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setSpeechError('Microphone permission blocked. Please allow mic in browser settings.');
      } else {
        setSpeechError('Microphone start nahi ho saka.');
      }
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

  const toggleListening = () => {
    if (isListening) {
      stopVoice();
    } else {
      startVoice();
    }
  };

  // Send audio to backend Whisper + Urdu enhancer
  const fetchWhisperTranscription = async (audioBlob, mimeType) => {
    setIsTranscribing(true);
    setSpeechError(null);

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
        const recognized = data.data.text.trim();
        if (recognized) {
          // Types automatically into the chat input box!
          setInput(recognized);
        }
      }
    } catch (err) {
      console.error('Transcription error:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Text to Speech (TTS) Helper
  const speakResponse = (text, targetLang = 'en-US') => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    // Clean markdown/special characters for speech
    const cleanText = text
      .replace(/[*_~`#]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[🏠🏢💰❓🔑😊•]/gu, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Detect if text contains Urdu characters
    const hasUrduChars = /[\u0600-\u06FF]/.test(cleanText);
    utterance.lang = hasUrduChars ? 'ur-PK' : (targetLang || 'en-US');

    window.speechSynthesis.speak(utterance);
  };

  const queryChatbotBackend = async (msgText) => {
    setLoading(true);
    setInput('');
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msgText })
      });
      const data = await res.json();

      if (data.success) {
        const botReply = data.data?.reply || data.reply || "I couldn't find matching details.";
        const matchedProperties = data.data?.properties || data.properties || [];

        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: botReply,
            properties: matchedProperties
          }
        ]);

        speakResponse(botReply, lang === 'ur-PK' ? 'ur-PK' : 'en-US');
      } else {
        const errMsg = 'Sorry, I encountered an issue processing your request.';
        setMessages((prev) => [...prev, { sender: 'bot', text: errMsg }]);
        speakResponse(errMsg, 'en-US');
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      const connErr = 'Server connection error. Please try again later.';
      setMessages((prev) => [...prev, { sender: 'bot', text: connErr }]);
      speakResponse(connErr, 'en-US');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');

    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    await queryChatbotBackend(userMsg);
  };

  const isUrduText = /[\u0600-\u06FF]/.test(input);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-4 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xl"
          style={{ background: 'var(--brand)', color: 'var(--brand-ink)', boxShadow: '0 12px 32px rgba(0,0,0,0.25)' }}
          title="SmartRent AI Chat Assistant"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div
          className="w-[360px] sm:w-[400px] h-[520px] rounded-2xl flex flex-col overflow-hidden border shadow-2xl"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 20px 48px rgba(0,0,0,0.3)' }}
        >
          {/* Header */}
          <div className="p-4 flex items-center justify-between" style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg" style={{ background: 'var(--brand)' }}>
                <Bot className="w-5 h-5" style={{ color: 'var(--brand-ink)' }} />
              </div>
              <div>
                <h3 className="font-bold text-sm">SmartRent AI Assistant</h3>
                <p className="text-[10px] font-medium" style={{ color: 'var(--accent)' }}>
                  Online · Voice AI ({lang === 'ur-PK' ? 'اردو / English' : 'English'})
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg transition hover:opacity-80" style={{ color: 'var(--ink-faint)' }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Speech Error Notice */}
          {speechError && (
            <div className="px-3 py-1.5 text-[11px] bg-rose-500/10 border-b border-rose-500/20 text-rose-400">
              {speechError}
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4" style={{ background: 'var(--bg)' }}>
            {messages.map((msg, index) => {
              const isBot = msg.sender === 'bot';
              const isUrduMsg = /[\u0600-\u06FF]/.test(msg.text);
              return (
                <div key={index} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
                  <div className="flex items-start gap-2 max-w-[85%]">
                    {isBot && (
                      <div className="p-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: 'var(--brand-soft)', color: 'var(--brand-strong)' }}>
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${isUrduMsg ? 'text-right font-medium' : 'text-left'}`}
                      dir={isUrduMsg ? 'rtl' : 'ltr'}
                      style={isBot
                        ? { background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border)', borderTopLeftRadius: 2 }
                        : { background: 'var(--brand)', color: 'var(--brand-ink)', borderTopRightRadius: 2 }}
                    >
                      {msg.text}
                    </div>
                  </div>

                  {isBot && msg.properties && msg.properties.length > 0 && (
                    <div className="mt-3 ml-7 w-[90%] space-y-2">
                      <p className="text-[10px] font-bold" style={{ color: 'var(--ink-faint)' }}>Matching properties:</p>
                      {msg.properties.map((prop) => (
                        <div
                          key={prop._id}
                          className="p-2.5 rounded-xl border flex items-center gap-3 transition"
                          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                        >
                          <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden" style={{ background: 'var(--surface-tint)' }}>
                            {prop.images && prop.images[0] ? (
                              <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--ink-faint)' }}>
                                <Building className="w-5 h-5" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 overflow-hidden">
                            <h4 className="text-xs font-bold truncate" style={{ color: 'var(--ink)' }}>{prop.title}</h4>
                            <p className="text-[10px] flex items-center gap-0.5 truncate mt-0.5" style={{ color: 'var(--ink-faint)' }}>
                              <MapPin className="w-2.5 h-2.5" /> {prop.location}
                            </p>
                            <span className="text-xs font-extrabold" style={{ color: 'var(--brand)' }}>{prop.price.toLocaleString()} PKR/mo</span>
                          </div>

                          <Link
                            to={`/properties/${prop._id}`}
                            onClick={() => setIsOpen(false)}
                            className="p-2 rounded-lg transition text-xs font-bold flex items-center gap-1 flex-shrink-0"
                            style={{ background: 'var(--brand-soft)', color: 'var(--brand-strong)' }}
                            title="View Property"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs font-medium ml-2" style={{ color: 'var(--ink-faint)' }}>
                <Bot className="w-4 h-4 animate-bounce" style={{ color: 'var(--brand)' }} />
                <span>Searching properties in database...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Voice Controls Bar */}
          <form onSubmit={handleSend} className="p-3 border-t flex items-center gap-2" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            
            {/* Mic Toggle Button */}
            <button
              type="button"
              disabled={isTranscribing}
              onClick={toggleListening}
              className={`p-2 rounded-xl transition flex items-center justify-center shrink-0 ${
                isListening ? 'animate-pulse' : ''
              }`}
              style={
                isListening
                  ? { background: 'var(--danger-soft, #fee2e2)', color: 'var(--danger, #ef4444)' }
                  : isTranscribing
                  ? { background: 'var(--surface-tint)', color: 'var(--brand)' }
                  : { background: 'var(--surface-tint)', color: 'var(--ink-soft)' }
              }
              title={isListening ? "Bolna band karein (Click to stop)" : (isTranscribing ? "Voice convert ho rahi hai..." : "Bol kar type karein (Click to speak)")}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 text-rose-500" />
              ) : isTranscribing ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            {/* Text Input */}
            <input
              type="text"
              dir={isUrduText ? 'rtl' : 'ltr'}
              placeholder={
                isListening
                  ? (lang === 'ur-PK' ? "🎙️ بولیں... چپ ہونے پر خود اردو میں ٹائپ ہو جائے گا" : "🎙️ Speak... Auto-types when you pause")
                  : isTranscribing
                  ? (lang === 'ur-PK' ? "✨ اردو میں ٹائپ ہو رہا ہے..." : "✨ Transcribing...")
                  : (lang === 'ur-PK' ? "اردو میں پوچھیں: لاہور میں 50k سے کم میں گھر..." : "Ask: 2 bed house in Lahore under 50k...")
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={`input flex-1 text-xs ${isUrduText ? 'text-right font-medium' : 'text-left'}`}
            />

            {/* Language Toggle Button */}
            <button
              type="button"
              onClick={() => setLang(lang === 'ur-PK' ? 'en-US' : 'ur-PK')}
              className="text-[9px] font-extrabold px-2 py-1.5 rounded-lg border transition whitespace-nowrap"
              style={{ background: 'var(--surface-tint)', borderColor: 'var(--border)', color: 'var(--ink-soft)' }}
              title="Toggle Language (Urdu / English)"
            >
              {lang === 'ur-PK' ? 'UR' : 'EN'}
            </button>

            {/* Send Message Button */}
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 rounded-xl transition flex items-center justify-center disabled:opacity-50"
              style={{ background: 'var(--brand)', color: 'var(--brand-ink)' }}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
