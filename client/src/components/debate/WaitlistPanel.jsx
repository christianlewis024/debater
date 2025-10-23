import React, { useState, useEffect } from 'react';
import {
  subscribeToWaitlist,
  joinWaitlist,
  leaveWaitlist,
  acceptFromWaitlist,
  removeDebater
} from '../../services/waitlistService';

const WaitlistPanel = ({ debateId, currentUser, userProfile, isHost, debaterB, debateStructure }) => {
  const [waitlist, setWaitlist] = useState([]);
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [stance, setStance] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only subscribe for self-moderated debates
    if (debateStructure !== 'self-moderated') {
      return;
    }

    const unsubscribe = subscribeToWaitlist(debateId, (entries) => {
      setWaitlist(entries);
      // Check if current user is on waitlist
      const userInWaitlist = entries.find(entry => entry.userId === currentUser?.uid);
      setIsOnWaitlist(!!userInWaitlist);
    });

    return () => unsubscribe();
  }, [debateId, currentUser, debateStructure]);

  // Only show waitlist for self-moderated debates
  if (debateStructure !== 'self-moderated') {
    return null;
  }

  const handleJoinWaitlist = async () => {
    if (!stance.trim()) {
      alert('Please enter your stance on the issue');
      return;
    }

    setLoading(true);
    try {
      await joinWaitlist(
        debateId,
        currentUser.uid,
        userProfile.username,
        userProfile.photoURL,
        stance
      );
      setStance('');
      setShowJoinForm(false);
    } catch (error) {
      console.error('Error joining waitlist:', error);
      alert('Failed to join waitlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveWaitlist = async () => {
    setLoading(true);
    try {
      await leaveWaitlist(debateId, currentUser.uid);
    } catch (error) {
      console.error('Error leaving waitlist:', error);
      alert('Failed to leave waitlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (userId, userData) => {
    if (window.confirm(`Accept ${userData.username} as the next debater?`)) {
      setLoading(true);
      try {
        await acceptFromWaitlist(debateId, userId, userData);
      } catch (error) {
        console.error('Error accepting from waitlist:', error);
        alert('Failed to accept user. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemoveDebater = async () => {
    if (window.confirm('Remove the current debater? This will end the current debate and allow you to accept someone from the waitlist.')) {
      setLoading(true);
      try {
        await removeDebater(debateId);
      } catch (error) {
        console.error('Error removing debater:', error);
        alert('Failed to remove debater. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{
      background: 'rgba(17, 24, 39, 0.6)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '24px',
      marginTop: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '22px' }}>📋</span>
          Waitlist ({waitlist.length})
        </h3>

        {/* Host: Remove current debater button */}
        {isHost && debaterB && (
          <button
            onClick={handleRemoveDebater}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#fff',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '14px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
            }}
          >
            🔄 Remove Current Debater
          </button>
        )}

        {/* Viewer: Join/Leave waitlist button */}
        {!isHost && !debaterB && currentUser && (
          <>
            {!isOnWaitlist ? (
              <button
                onClick={() => setShowJoinForm(!showJoinForm)}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                }}
              >
                ✋ Join Waitlist
              </button>
            ) : (
              <button
                onClick={handleLeaveWaitlist}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '14px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                ❌ Leave Waitlist
              </button>
            )}
          </>
        )}
      </div>

      {/* Join Waitlist Form */}
      {showJoinForm && !isOnWaitlist && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <label style={{
            display: 'block',
            color: '#e2e8f0',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '10px'
          }}>
            Your CON stance (brief sentence):
          </label>
          <textarea
            value={stance}
            onChange={(e) => setStance(e.target.value)}
            placeholder="e.g., I believe the opposite because..."
            maxLength={150}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(31, 41, 55, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
              resize: 'vertical',
              minHeight: '80px',
              marginBottom: '12px'
            }}
          />
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
            {stance.length}/150 characters
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleJoinWaitlist}
              disabled={loading || !stance.trim()}
              style={{
                padding: '10px 20px',
                background: stance.trim() ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(100, 116, 139, 0.3)',
                color: '#fff',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '14px',
                border: 'none',
                cursor: (loading || !stance.trim()) ? 'not-allowed' : 'pointer',
                opacity: (loading || !stance.trim()) ? 0.6 : 1,
                boxShadow: stance.trim() ? '0 4px 15px rgba(16, 185, 129, 0.4)' : 'none'
              }}
            >
              {loading ? 'Joining...' : '✓ Confirm Join'}
            </button>
            <button
              onClick={() => {
                setShowJoinForm(false);
                setStance('');
              }}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: 'rgba(100, 116, 139, 0.2)',
                color: '#94a3b8',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '14px',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Waitlist Entries */}
      {waitlist.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#64748b',
          fontSize: '15px'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '12px', opacity: 0.3 }}>📋</div>
          <p style={{ fontWeight: '600', marginBottom: '4px' }}>No one waiting</p>
          <p style={{ fontSize: '13px', opacity: 0.8 }}>Be the first to join the waitlist!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {waitlist.map((entry, index) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                background: entry.userId === currentUser?.uid
                  ? 'rgba(59, 130, 246, 0.1)'
                  : 'rgba(31, 41, 55, 0.6)',
                border: entry.userId === currentUser?.uid
                  ? '1px solid rgba(59, 130, 246, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Position Number */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: '800',
                color: '#fff',
                flexShrink: 0
              }}>
                #{index + 1}
              </div>

              {/* User Avatar */}
              <img
                src={entry.photoURL}
                alt={entry.username}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  border: '2px solid rgba(239, 68, 68, 0.5)',
                  flexShrink: 0
                }}
              />

              {/* User Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: '700',
                  color: '#fff',
                  fontSize: '16px',
                  marginBottom: '4px'
                }}>
                  {entry.username}
                  {entry.userId === currentUser?.uid && (
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '12px',
                      color: '#60a5fa',
                      fontWeight: '600'
                    }}>
                      (You)
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#94a3b8',
                  fontWeight: '500',
                  lineHeight: '1.4'
                }}>
                  <span style={{ color: '#f87171', fontWeight: '600' }}>CON:</span> {entry.stance}
                </div>
              </div>

              {/* Host: Accept Button */}
              {isHost && !debaterB && (
                <button
                  onClick={() => handleAccept(entry.userId, entry)}
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '14px',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                    flexShrink: 0
                  }}
                >
                  ✓ Accept
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WaitlistPanel;
