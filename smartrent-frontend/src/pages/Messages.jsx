import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, User, MessageSquare } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const socket = io(SOCKET_URL, { autoConnect: false });

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    socket.connect();

    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/messaging/conversations`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const convs = data.data?.conversations || data.conversations || [];
          setConversations(convs);
        }
      })
      .catch((err) => console.error('Failed to fetch conversations:', err));

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!activeConv) return;
    const token = localStorage.getItem('token');

    socket.emit('joinConversation', activeConv._id);

    fetch(`${API_BASE}/messaging/messages/${activeConv._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const msgs = data.data?.messages || data.messages || [];
          setMessages(msgs);
        }
      })
      .catch((err) => console.error('Failed to fetch messages:', err));
  }, [activeConv]);

  useEffect(() => {
    const handleReceive = (msg) => {
      const msgConvId = msg.conversation?._id || msg.conversation || msg.conversationId;
      if (activeConv && msgConvId === activeConv._id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('receiveMessage', handleReceive);
    return () => socket.off('receiveMessage', handleReceive);
  }, [activeConv]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConv) return;

    const token = localStorage.getItem('token');
    const tempText = text;
    setText('');

    try {
      const res = await fetch(`${API_BASE}/messaging/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId: activeConv._id,
          messageText: tempText
        })
      });
      const data = await res.json();

      if (!data.success) {
        setText(tempText);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setText(tempText);
    }
  };

  return (
    <div className="max-w-5xl mx-auto surface flex h-[600px] overflow-hidden">

      {/* Sidebar: Conversations List */}
      <div className="w-1/3 border-r flex flex-col" style={{ borderColor: 'var(--border)', background: 'var(--surface-tint)' }}>
        <div className="p-4 font-bold text-base flex items-center gap-2 border-b" style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}>
          <MessageSquare className="w-5 h-5" style={{ color: 'var(--brand)' }} />
          <span>Direct messages</span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: 'var(--border-soft)' }}>
          {conversations.length === 0 ? (
            <p className="p-6 text-xs text-center" style={{ color: 'var(--ink-faint)' }}>No active chats found</p>
          ) : (
            conversations.map((c) => {
              const otherUser = c.tenant?._id === currentUser._id ? c.landlord : c.tenant;
              const isSelected = activeConv?._id === c._id;

              return (
                <div
                  key={c._id}
                  onClick={() => setActiveConv(c)}
                  className="p-4 cursor-pointer transition flex items-center gap-3"
                  style={isSelected
                    ? { background: 'var(--brand-soft)', borderLeft: '3px solid var(--brand)' }
                    : {}}
                >
                  <div className="p-2 rounded-full" style={{ background: 'var(--surface)', color: 'var(--brand)' }}>
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--ink)' }}>{otherUser?.name || 'User'}</p>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--ink-faint)' }}>{c.lastMessage || 'Click to open chat...'}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Body */}
      <div className="flex-1 flex flex-col justify-between" style={{ background: 'var(--bg)' }}>
        {activeConv ? (
          <>
            <div className="p-4 border-b font-bold flex items-center gap-2" style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--ink)' }}>
              <span className="text-xs font-normal" style={{ color: 'var(--ink-faint)' }}>Chatting with:</span>
              <span style={{ color: 'var(--brand)' }}>
                {activeConv.tenant?._id === currentUser._id ? activeConv.landlord?.name : activeConv.tenant?.name}
              </span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((m, idx) => {
                const senderId = m.sender?._id || m.sender;
                const isMe = senderId === currentUser._id;

                return (
                  <div key={m._id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-[70%] rounded-2xl px-4 py-2 text-sm"
                      style={isMe
                        ? { background: 'var(--brand)', color: 'var(--brand-ink)', borderBottomRightRadius: 2 }
                        : { background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border)', borderBottomLeftRadius: 2 }}
                    >
                      <p className="leading-relaxed">{m.messageText}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 border-t flex space-x-2" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <input
                type="text"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="input flex-1"
              />
              <button type="submit" className="btn btn-primary">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-sm p-6 text-center" style={{ color: 'var(--ink-faint)' }}>
            <MessageSquare className="w-12 h-12 mb-2 stroke-1" style={{ color: 'var(--border)' }} />
            <p>Select a conversation from the left sidebar to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
