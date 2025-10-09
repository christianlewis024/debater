import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeToDebate, joinDebate } from '../services/debateService';
import { subscribeToParticipants, joinAsViewer, subscribeToViewerCount } from '../services/chatService';
import ChatPanel from '../components/debate/ChatPanel';
import VotingPanel from '../components/debate/VotingPanel';
import VideoDebateRoom from '../components/debate/VideoDebateRoom';

const DebatePage = () => {
  const { debateId } = useParams();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [debate, setDebate] = useState(null);
  const [participants, setParticipants] = useState({});
  const [viewerCount, setViewerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinSide, setJoinSide] = useState('debater_a');
  const [sideDescription, setSideDescription] = useState('');

  const debaterA = participants.debater_a;
  const debaterB = participants.debater_b;

  // Set default join side based on available slots
  useEffect(() => {
    if (!debaterA) {
      setJoinSide('debater_a');
    } else if (!debaterB) {
      setJoinSide('debater_b');
    } else {
      setJoinSide('moderator');
    }
  }, [debaterA, debaterB]);

  useEffect(() => {
    if (!debateId) return;

    const unsubDebate = subscribeToDebate(debateId, (debateData) => {
      setDebate(debateData);
      setLoading(false);
    });

    const unsubParticipants = subscribeToParticipants(debateId, (participantsData) => {
      setParticipants(participantsData);
    });

    const unsubViewers = subscribeToViewerCount(debateId, (count) => {
      setViewerCount(count);
    });

    let leaveViewer;
    if (currentUser) {
      leaveViewer = joinAsViewer(debateId, currentUser.uid);
    }

    return () => {
      unsubDebate();
      unsubParticipants();
      unsubViewers();
      if (leaveViewer) leaveViewer();
    };
  }, [debateId, currentUser]);

  const handleJoinDebate = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      await joinDebate(
        debateId,
        currentUser.uid,
        userProfile,
        joinSide,
        sideDescription
      );
      setShowJoinModal(false);
      setSideDescription('');
    } catch (error) {
      console.error('Error joining debate:', error);
      setError('Failed to join debate');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            display: 'inline-block', 
            width: '60px', 
            height: '60px', 
            border: '4px solid rgba(59, 130, 246, 0.2)',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '20px'
          }}></div>
          <p style={{ color: '#9ca3af', fontSize: '16px', fontWeight: '500' }}>Loading debate...</p>
        </div>
      </div>
    );
  }

  if (!debate) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px', color: '#fff' }}>Debate not found</h2>
          <button
            onClick={() => navigate('/browse')}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#fff',
              padding: '12px 32px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '16px',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
              transition: 'all 0.3s ease'
            }}
          >
            Browse Debates
          </button>
        </div>
      </div>
    );
  }

  const debaterA = participants.debater_a;
  const debaterB = participants.debater_b;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)' }}>
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

      {/* Header */}
      <div style={{ 
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)', 
        backdropFilter: 'blur(10px)',
        background: 'rgba(17, 24, 39, 0.5)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h1 style={{ 
              fontSize: '36px', 
              fontWeight: '800', 
              color: '#fff',
              background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}>
              {debate.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '8px 16px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <span style={{ fontSize: '20px' }}>👁️</span>
                <span style={{ color: '#60a5fa', fontWeight: '600', fontSize: '16px' }}>{viewerCount}</span>
              </div>
              {debate.status === 'active' && (
                <div style={{
                  padding: '8px 20px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#fff',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                  letterSpacing: '0.05em'
                }}>
                  <span style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
                  LIVE
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '15px', color: '#94a3b8' }}>
            <span style={{ fontWeight: '500' }}>by <span style={{ color: '#e2e8f0' }}>{debate.hostUsername}</span></span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span style={{ 
              padding: '4px 12px', 
              background: 'rgba(59, 130, 246, 0.15)',
              borderRadius: '8px',
              color: '#60a5fa',
              fontWeight: '600',
              fontSize: '13px'
            }}>
              {debate.category}
            </span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span>{debate.settings?.turnTime}s per turn</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
          {/* Main Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Video */}
            <VideoDebateRoom
              debateId={debateId}
              participants={participants}
              currentUser={currentUser}
              userProfile={userProfile}
              debate={debate}
            />

            {/* Waiting State */}
            {debate.status === 'waiting' && (!debaterA || !debaterB) && (
              <div style={{ 
                background: 'rgba(17, 24, 39, 0.6)', 
                backdropFilter: 'blur(20px)',
                borderRadius: '20px', 
                border: '1px solid rgba(255, 255, 255, 0.08)', 
                padding: '48px', 
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ fontSize: '80px', marginBottom: '24px' }}>⏳</div>
                <h2 style={{ 
                  fontSize: '28px', 
                  fontWeight: '800', 
                  color: '#fff', 
                  marginBottom: '12px',
                  letterSpacing: '-0.02em'
                }}>
                  Waiting for Debaters
                </h2>
                <p style={{ color: '#94a3b8', marginBottom: '32px', fontSize: '16px', fontWeight: '500' }}>
                  {!debaterA && !debaterB ? 'Need 2 debaters to start' : 'Need 1 more debater to start'}
                </p>
                {currentUser ? (
                  <button
                    onClick={() => setShowJoinModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: '#fff',
                      padding: '16px 48px',
                      borderRadius: '14px',
                      fontWeight: '700',
                      fontSize: '17px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 8px 30px rgba(59, 130, 246, 0.4)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Join as Debater
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: '#fff',
                      padding: '16px 48px',
                      borderRadius: '14px',
                      fontWeight: '700',
                      fontSize: '17px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 8px 30px rgba(59, 130, 246, 0.4)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Login to Join
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Voting */}
            <VotingPanel
              debateId={debateId}
              participants={participants}
              currentUser={currentUser}
            />

            {/* Chat */}
            <ChatPanel
              debateId={debateId}
              currentUser={currentUser}
              userProfile={userProfile}
            />

            {/* Actions */}
            <div style={{ 
              background: 'rgba(17, 24, 39, 0.6)', 
              backdropFilter: 'blur(20px)',
              borderRadius: '20px', 
              border: '1px solid rgba(255, 255, 255, 0.08)', 
              padding: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <button
                onClick={() => navigate('/browse')}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#60a5fa',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '15px',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                ← Back to Browse
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 100
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            maxWidth: '500px',
            width: '100%',
            padding: '32px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{ 
              fontSize: '28px', 
              fontWeight: '800', 
              marginBottom: '28px', 
              color: '#fff',
              letterSpacing: '-0.02em'
            }}>
              Join Debate
            </h2>
            
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                padding: '14px 18px',
                borderRadius: '12px',
                marginBottom: '20px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#e2e8f0', 
                marginBottom: '10px',
                letterSpacing: '0.02em'
              }}>
                Choose Your Side
              </label>
              <select
                value={joinSide}
                onChange={(e) => setJoinSide(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: 'rgba(31, 41, 55, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {!debaterA && <option value="debater_a">Debater A (Pro)</option>}
                {!debaterB && <option value="debater_b">Debater B (Con)</option>}
                <option value="moderator">Moderator</option>
              </select>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#e2e8f0', 
                marginBottom: '10px',
                letterSpacing: '0.02em'
              }}>
                Your Position
              </label>
              <input
                type="text"
                value={sideDescription}
                onChange={(e) => setSideDescription(e.target.value)}
                placeholder="e.g., I believe cats are superior"
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: 'rgba(31, 41, 55, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: '500'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setError('');
                }}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#e2e8f0',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '15px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleJoinDebate}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#fff',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '15px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                  transition: 'all 0.2s ease'
                }}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default DebatePage;
