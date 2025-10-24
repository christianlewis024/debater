import React from 'react';

/**
 * Warning component for when audio autoplay is blocked by browser
 * @param {Function} onEnableAudio - Callback to enable audio playback
 */
const AudioBlockedWarning = ({ onEnableAudio }) => {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)',
        border: '1px solid rgba(251, 191, 36, 0.3)',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '16px',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 4px 15px rgba(251, 191, 36, 0.1)'
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'rgba(251, 191, 36, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <span style={{ color: '#fbbf24', fontSize: '18px' }}>
          🔇
        </span>
      </div>

      <div style={{ flex: 1 }}>
        <p
          style={{
            color: '#fbbf24',
            fontSize: '14px',
            fontWeight: '600',
            margin: '0 0 4px 0',
            lineHeight: '1.4'
          }}
        >
          Audio is muted by your browser
        </p>
        <p
          style={{
            color: '#fcd34d',
            fontSize: '12px',
            fontWeight: '500',
            margin: 0,
            lineHeight: '1.4',
            opacity: 0.9
          }}
        >
          Click the button to enable audio playback
        </p>
      </div>

      <button
        onClick={onEnableAudio}
        style={{
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          color: '#1f2937',
          padding: '10px 20px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '14px',
          fontWeight: '700',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)',
          transition: 'all 0.2s ease',
          flexShrink: 0
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 20px rgba(251, 191, 36, 0.4)';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 15px rgba(251, 191, 36, 0.3)';
        }}
      >
        Enable Audio
      </button>
    </div>
  );
};

export default AudioBlockedWarning;
