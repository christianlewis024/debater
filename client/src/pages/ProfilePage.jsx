import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const ProfilePage = () => {
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile?.username || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Available emoji profile pictures (same as AuthContext)
  const availableEmojis = [
    '🐶', '🐱', '🦊', '🐼', '🐨',
    '🦁', '🐯', '🐸', '🐵', '🦉',
    '🦅', '🦆', '🐧', '🦈', '🐙',
    '🦋', '🐝', '🐢', '🦖', '🦕',
    '😀', '😎', '🤓', '😇', '🥳',
    '🤠', '👽', '🤖', '👾', '🦄'
  ];

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (!displayName.trim()) {
      setMessage({ type: 'error', text: 'Display name cannot be empty' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: displayName.trim()
      });

      // Update Firestore user document
      await updateDoc(doc(db, 'users', currentUser.uid), {
        username: displayName.trim()
      });

      // Refresh user profile to show changes immediately
      await refreshUserProfile();

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmojiSelect = async (emoji) => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Update Firebase Auth profile with emoji as photoURL
      await updateProfile(currentUser, {
        photoURL: emoji
      });

      // Update Firestore user document
      await updateDoc(doc(db, 'users', currentUser.uid), {
        photoURL: emoji
      });

      // Refresh user profile to show changes immediately
      await refreshUserProfile();

      setMessage({ type: 'success', text: 'Profile picture updated!' });
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error updating profile picture:', error);
      setMessage({ type: 'error', text: 'Failed to update profile picture.' });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(26, 26, 46, 0.95) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <p style={{ fontSize: '18px' }}>Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(26, 26, 46, 0.95) 100%)',
      fontFamily: "'Inter', sans-serif",
      padding: '40px 20px'
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
        {/* Header */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '12px',
            letterSpacing: '-0.02em'
          }}>
            Profile Settings
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>Manage your account information</p>
        </div>

        {/* Profile Card */}
        <div style={{
          background: 'rgba(17, 24, 39, 0.6)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '40px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          {/* Avatar Section */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {/* Check if photoURL is an emoji (single character) or image URL */}
              {currentUser.photoURL && currentUser.photoURL.length <= 2 ? (
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  border: '4px solid rgba(59, 130, 246, 0.5)',
                  marginBottom: '20px',
                  boxShadow: '0 8px 30px rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '64px',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%)'
                }}>
                  {currentUser.photoURL}
                </div>
              ) : (
                <img
                  src={currentUser.photoURL || 'https://ui-avatars.com/api/?name=' + (userProfile?.username || 'User')}
                  alt="Profile"
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    border: '4px solid rgba(59, 130, 246, 0.5)',
                    marginBottom: '20px',
                    boxShadow: '0 8px 30px rgba(59, 130, 246, 0.3)'
                  }}
                />
              )}

              {/* Change Picture Button */}
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={loading}
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  right: '0',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: '3px solid rgba(17, 24, 39, 0.9)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'scale(1.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                }}
              >
                📷
              </button>
            </div>

            {/* Emoji Picker Modal */}
            {showEmojiPicker && (
              <div style={{
                marginTop: '20px',
                padding: '24px',
                background: 'rgba(31, 41, 55, 0.95)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#fff',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  Choose Your Avatar
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: '12px',
                  marginBottom: '16px',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {availableEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiSelect(emoji)}
                      disabled={loading}
                      style={{
                        width: '56px',
                        height: '56px',
                        fontSize: '32px',
                        borderRadius: '12px',
                        border: currentUser.photoURL === emoji
                          ? '3px solid #3b82f6'
                          : '2px solid rgba(255, 255, 255, 0.1)',
                        background: currentUser.photoURL === emoji
                          ? 'rgba(59, 130, 246, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading && currentUser.photoURL !== emoji) {
                          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                          e.target.style.transform = 'scale(1.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentUser.photoURL !== emoji) {
                          e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                        }
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#94a3b8',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: "'Inter', sans-serif"
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            <h2 style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#fff',
              marginBottom: '8px'
            }}>
              {userProfile?.username || 'User'}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>{currentUser.email}</p>
          </div>

          {/* Message */}
          {message.text && (
            <div style={{
              padding: '14px 18px',
              borderRadius: '12px',
              marginBottom: '24px',
              background: message.type === 'success' 
                ? 'rgba(16, 185, 129, 0.15)' 
                : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${message.type === 'success' 
                ? 'rgba(16, 185, 129, 0.3)' 
                : 'rgba(239, 68, 68, 0.3)'}`,
              color: message.type === 'success' ? '#10b981' : '#ef4444',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {message.text}
            </div>
          )}

          {/* Display Name Section */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#e2e8f0',
              marginBottom: '12px',
              letterSpacing: '0.02em'
            }}>
              Display Name
            </label>

            {editing ? (
              <form onSubmit={handleUpdateProfile}>
                <div style={{ marginBottom: '20px' }}>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
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
                    disabled={loading}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '14px 24px',
                      background: loading ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: '#fff',
                      borderRadius: '12px',
                      fontWeight: '700',
                      fontSize: '15px',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                      fontFamily: "'Inter', sans-serif"
                    }}
                  >
                    {loading ? 'Saving...' : '💾 Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setDisplayName(userProfile?.username || '');
                      setMessage({ type: '', text: '' });
                    }}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '14px 24px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#e2e8f0',
                      borderRadius: '12px',
                      fontWeight: '600',
                      fontSize: '15px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontFamily: "'Inter', sans-serif"
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: 'rgba(31, 41, 55, 0.8)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <span style={{ color: '#fff', fontSize: '15px', fontWeight: '500' }}>
                  {userProfile?.username || 'Not set'}
                </span>
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    padding: '8px 20px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: '14px',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif"
                  }}
                >
                  ✏️ Edit
                </button>
              </div>
            )}
          </div>

          {/* Debate Stats */}
          <div style={{
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '800',
              color: '#fff',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🏆 Debate Statistics
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '16px'
            }}>
              {/* Total Debates */}
              <div style={{
                padding: '16px',
                background: 'rgba(31, 41, 55, 0.6)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '800',
                  color: '#60a5fa',
                  marginBottom: '4px'
                }}>
                  {userProfile?.stats?.totalDebates || 0}
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#94a3b8',
                  letterSpacing: '0.05em'
                }}>
                  TOTAL DEBATES
                </div>
              </div>

              {/* Wins */}
              <div style={{
                padding: '16px',
                background: 'rgba(31, 41, 55, 0.6)',
                borderRadius: '12px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '800',
                  color: '#10b981',
                  marginBottom: '4px'
                }}>
                  {userProfile?.stats?.wins || 0}
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#94a3b8',
                  letterSpacing: '0.05em'
                }}>
                  WINS
                </div>
              </div>

              {/* Losses */}
              <div style={{
                padding: '16px',
                background: 'rgba(31, 41, 55, 0.6)',
                borderRadius: '12px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '800',
                  color: '#ef4444',
                  marginBottom: '4px'
                }}>
                  {userProfile?.stats?.losses || 0}
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#94a3b8',
                  letterSpacing: '0.05em'
                }}>
                  LOSSES
                </div>
              </div>

              {/* Win Rate */}
              <div style={{
                padding: '16px',
                background: 'rgba(31, 41, 55, 0.6)',
                borderRadius: '12px',
                border: '1px solid rgba(147, 51, 234, 0.3)',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '800',
                  color: '#a78bfa',
                  marginBottom: '4px'
                }}>
                  {userProfile?.stats?.totalDebates > 0
                    ? Math.round((userProfile.stats.wins / userProfile.stats.totalDebates) * 100)
                    : 0}%
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#94a3b8',
                  letterSpacing: '0.05em'
                }}>
                  WIN RATE
                </div>
              </div>

              {/* Total Votes Received */}
              <div style={{
                padding: '16px',
                background: 'rgba(31, 41, 55, 0.6)',
                borderRadius: '12px',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '800',
                  color: '#fbbf24',
                  marginBottom: '4px'
                }}>
                  {userProfile?.stats?.totalVotesReceived || 0}
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#94a3b8',
                  letterSpacing: '0.05em'
                }}>
                  VOTES EARNED
                </div>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div style={{
            padding: '24px',
            background: 'rgba(31, 41, 55, 0.5)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '16px'
            }}>
              Account Information
            </h3>

            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Email</span>
              <span style={{ color: '#e2e8f0', fontSize: '15px', fontWeight: '500' }}>{currentUser.email}</span>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '4px' }}>User ID</span>
              <span style={{
                color: '#64748b',
                fontSize: '13px',
                fontFamily: 'monospace',
                padding: '4px 8px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                display: 'inline-block'
              }}>
                {currentUser.uid}
              </span>
            </div>

            <div>
              <span style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Account Created</span>
              <span style={{ color: '#e2e8f0', fontSize: '15px', fontWeight: '500' }}>
                {new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
