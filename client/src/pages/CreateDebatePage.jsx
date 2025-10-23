import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createDebate } from '../services/debateService';

const CreateDebatePage = () => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [structure, setStructure] = useState('moderated'); // New: debate structure type
  const [turnTime, setTurnTime] = useState(60);
  const [maxTurns, setMaxTurns] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const categories = [
    'general',
    'sports',
    'politics',
    'religion',
    'finance',
    'music',
    'technology',
    'science',
    'entertainment',
    'other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to create a debate');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const debateData = {
        title,
        category,
        structure, // Add structure type to debate data
        settings: {
          turnTime: parseInt(turnTime),
          maxTurns: parseInt(maxTurns)
        }
      };

      const debateId = await createDebate(
        debateData,
        currentUser.uid,
        userProfile.username
      );

      navigate(`/debate/${debateId}`);
    } catch (error) {
      console.error('Error creating debate:', error);
      setError('Failed to create debate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#fff', marginBottom: '24px' }}>
            Please log in to create a debate
          </h2>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#fff',
              padding: '16px 40px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(59, 130, 246, 0.4)'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      fontFamily: "'Inter', sans-serif",
      padding: '60px 20px'
    }}>
      {/* Animated Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.05) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'rgba(17, 24, 39, 0.6)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '48px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <h1 style={{
            fontSize: '42px',
            fontWeight: '900',
            marginBottom: '12px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            Create a New Debate
          </h1>
          <p style={{ 
            textAlign: 'center', 
            color: '#94a3b8', 
            fontSize: '16px', 
            marginBottom: '40px',
            fontWeight: '500'
          }}>
            Set up your debate topic and rules
          </p>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '14px 18px',
              borderRadius: '12px',
              marginBottom: '24px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#e2e8f0',
                marginBottom: '10px',
                letterSpacing: '0.02em'
              }}>
                Debate Topic *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Are cats better than dogs?"
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: 'rgba(31, 41, 55, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: '500',
                  fontFamily: "'Inter', sans-serif"
                }}
              />
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>
                Make it clear and engaging
              </p>
            </div>

            {/* Category */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#e2e8f0',
                marginBottom: '10px',
                letterSpacing: '0.02em'
              }}>
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: 'rgba(31, 41, 55, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: '500',
                  fontFamily: "'Inter', sans-serif",
                  cursor: 'pointer'
                }}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} style={{ background: '#1f2937' }}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Debate Structure */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#e2e8f0',
                marginBottom: '10px',
                letterSpacing: '0.02em'
              }}>
                Debate Structure *
              </label>

              {/* Structure Options */}
              <div style={{ display: 'grid', gap: '12px' }}>
                {/* Moderated Option */}
                <div
                  onClick={() => setStructure('moderated')}
                  style={{
                    padding: '16px 20px',
                    background: structure === 'moderated' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(31, 41, 55, 0.6)',
                    border: `2px solid ${structure === 'moderated' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '20px', marginRight: '10px' }}>👤</span>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Moderated</span>
                    {structure === 'moderated' && <span style={{ marginLeft: 'auto', color: '#3b82f6', fontSize: '18px' }}>✓</span>}
                  </div>
                  <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', marginLeft: '30px' }}>
                    A third user acts as moderator with full control (pause, resume, add time, skip turns)
                  </p>
                </div>

                {/* Auto-Moderated Option */}
                <div
                  onClick={() => setStructure('auto-moderated')}
                  style={{
                    padding: '16px 20px',
                    background: structure === 'auto-moderated' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(31, 41, 55, 0.6)',
                    border: `2px solid ${structure === 'auto-moderated' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '20px', marginRight: '10px' }}>⚙️</span>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Auto-Moderated</span>
                    {structure === 'auto-moderated' && <span style={{ marginLeft: 'auto', color: '#3b82f6', fontSize: '18px' }}>✓</span>}
                  </div>
                  <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', marginLeft: '30px' }}>
                    Automated turn-based system with set time intervals and auto-muting
                  </p>
                </div>

                {/* Self-Moderated Option */}
                <div
                  onClick={() => setStructure('self-moderated')}
                  style={{
                    padding: '16px 20px',
                    background: structure === 'self-moderated' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(31, 41, 55, 0.6)',
                    border: `2px solid ${structure === 'self-moderated' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '20px', marginRight: '10px' }}>🎙️</span>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Self-Moderated</span>
                    {structure === 'self-moderated' && <span style={{ marginLeft: 'auto', color: '#3b82f6', fontSize: '18px' }}>✓</span>}
                  </div>
                  <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', marginLeft: '30px' }}>
                    Host debates multiple users one-on-one (like a campus debate setup)
                  </p>
                </div>
              </div>
            </div>

            {/* Settings Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              {/* Turn Time */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#e2e8f0',
                  marginBottom: '10px',
                  letterSpacing: '0.02em'
                }}>
                  Turn Time (sec) *
                </label>
                <input
                  type="number"
                  min="30"
                  max="300"
                  value={turnTime}
                  onChange={(e) => setTurnTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    background: 'rgba(31, 41, 55, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: '500',
                    fontFamily: "'Inter', sans-serif"
                  }}
                />
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', fontWeight: '500' }}>
                  30-300 seconds
                </p>
              </div>

              {/* Max Turns */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#e2e8f0',
                  marginBottom: '10px',
                  letterSpacing: '0.02em'
                }}>
                  Maximum Turns *
                </label>
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={maxTurns}
                  onChange={(e) => setMaxTurns(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    background: 'rgba(31, 41, 55, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: '500',
                    fontFamily: "'Inter', sans-serif"
                  }}
                />
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', fontWeight: '500' }}>
                  2-20 turns total
                </p>
              </div>
            </div>

            {/* Submit Buttons */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                type="button"
                onClick={() => navigate('/')}
                style={{
                  flex: 1,
                  padding: '16px 32px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#e2e8f0',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Inter', sans-serif"
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '16px 32px',
                  background: loading ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#fff',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '16px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                  fontFamily: "'Inter', sans-serif",
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
                }}
              >
                {loading ? '🔄 Creating...' : '🚀 Create Debate'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateDebatePage;
