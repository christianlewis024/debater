import React from 'react';

/**
 * Reusable error banner component
 * @param {string} message - Error message to display
 * @param {Function} onClose - Optional close handler
 */
const ErrorBanner = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '12px',
        padding: '14px 18px',
        marginBottom: '16px',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.1)'
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <span style={{ color: '#fca5a5', fontSize: '14px', fontWeight: 'bold' }}>
          ⚠
        </span>
      </div>

      <p
        style={{
          color: '#fca5a5',
          fontSize: '14px',
          fontWeight: '600',
          margin: 0,
          flex: 1,
          lineHeight: '1.5'
        }}
      >
        {message}
      </p>

      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: 'none',
            color: '#fca5a5',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
            flexShrink: 0,
            transition: 'background 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(239, 68, 68, 0.3)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(239, 68, 68, 0.2)';
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default ErrorBanner;
