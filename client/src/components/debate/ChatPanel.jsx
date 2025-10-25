import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage, subscribeToChatMessages } from '../../services/chatService';

const ChatPanel = ({ debateId, currentUser, userProfile }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!debateId) return;

    const unsubscribe = subscribeToChatMessages(debateId, (msgs) => {
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [debateId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!newMessage.trim() || !currentUser) return;

    // Store reference to input before async operations
    const inputElement = inputRef.current;

    try {
      setSending(true);

      // Send message without awaiting to avoid focus loss
      sendChatMessage(
        debateId,
        currentUser.uid,
        userProfile?.username || 'Anonymous',
        newMessage.trim()
      ).catch(error => {
        console.error('Error sending message:', error);
      });

      // Clear immediately and refocus
      setNewMessage('');

    } finally {
      setSending(false);
    }

    // Refocus immediately using the stored reference
    if (inputElement) {
      inputElement.focus();
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate();
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div style={{
      background: 'rgba(17, 24, 39, 0.6)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      display: 'flex',
      flexDirection: 'column',
      height: '500px',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '700', 
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px'
        }}>
          💬 Live Chat
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
        </p>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#64748b',
            padding: '40px 20px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}>💬</div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '700',
              flexShrink: 0,
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
            }}>
              {message.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'baseline', 
                gap: '8px',
                marginBottom: '4px'
              }}>
                <span style={{ 
                  fontWeight: '600', 
                  fontSize: '14px',
                  color: '#e2e8f0'
                }}>
                  {message.username}
                </span>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#64748b',
                  fontWeight: '500'
                }}>
                  {formatTimestamp(message.createdAt)}
                </span>
              </div>
              <p style={{ 
                fontSize: '14px', 
                color: '#cbd5e1',
                wordBreak: 'break-word',
                lineHeight: '1.5'
              }}>
                {message.content}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {currentUser ? (
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px' }}>
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'rgba(31, 41, 55, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: "'Inter', sans-serif",
                outline: 'none'
              }}
              disabled={sending}
              maxLength={500}
              onFocus={(e) => e.target.style.border = '1px solid rgba(59, 130, 246, 0.5)'}
              onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              style={{
                padding: '12px 24px',
                background: sending || !newMessage.trim() 
                  ? 'rgba(59, 130, 246, 0.3)' 
                  : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                borderRadius: '12px',
                border: 'none',
                fontWeight: '700',
                fontSize: '14px',
                cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer',
                boxShadow: sending || !newMessage.trim() ? 'none' : '0 4px 15px rgba(59, 130, 246, 0.4)',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!sending && newMessage.trim()) {
                  e.target.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
            >
              Send
            </button>
          </form>
        ) : (
          <div style={{
            textAlign: 'center',
            color: '#64748b',
            fontSize: '14px',
            padding: '12px',
            fontWeight: '500'
          }}>
            Login to chat
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
