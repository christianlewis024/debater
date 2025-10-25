import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeToDebate, joinDebate } from '../services/debateService';
import { subscribeToParticipants, joinAsViewer, subscribeToViewerCount } from '../services/chatService';
import { subscribeToDebateState } from '../services/debateStateService';
import { handleDebateEnd, scheduleDebateDeletion } from '../services/debateEndService';
import { subscribeToWaitlist, joinWaitlist, leaveWaitlist } from '../services/waitlistService';
import { ref, onValue } from 'firebase/database';
import { collection, onSnapshot, query, where, limit } from 'firebase/firestore';
import { rtdb, db } from '../services/firebase';
import ChatPanel from '../components/debate/ChatPanel';
import VotingPanel from '../components/debate/VotingPanel';
import VideoDebateRoom from '../components/debate/VideoDebateRoom';

const DebatePage = () => {
  const { debateId } = useParams();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [debate, setDebate] = useState(null);
  const [participants, setParticipants] = useState({});
  const [debateState, setDebateState] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinSide, setJoinSide] = useState('debater_a');
  const [sideDescription, setSideDescription] = useState('');
  const [waitlist, setWaitlist] = useState([]);
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistStance, setWaitlistStance] = useState('');
  const [trendingDebates, setTrendingDebates] = useState([]);

  // Add pulse animation CSS for Join button and scrollbar styling
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes joinButtonPulse {
        0%, 100% {
          box-shadow: 0 0 25px rgba(59, 130, 246, 0.5);
        }
        50% {
          box-shadow: 0 0 40px rgba(59, 130, 246, 0.8);
        }
      }

      /* Custom scrollbar for trending sidebar */
      .trending-sidebar::-webkit-scrollbar {
        width: 4px;
      }

      .trending-sidebar::-webkit-scrollbar-track {
        background: transparent;
      }

      .trending-sidebar::-webkit-scrollbar-thumb {
        background: rgba(100, 116, 139, 0.3);
        border-radius: 4px;
      }

      .trending-sidebar::-webkit-scrollbar-thumb:hover {
        background: rgba(100, 116, 139, 0.5);
      }

      /* Firefox scrollbar */
      .trending-sidebar {
        scrollbar-width: thin;
        scrollbar-color: rgba(100, 116, 139, 0.3) transparent;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const debaterA = participants.debater_a;
  const debaterB = participants.debater_b;
  const moderator = participants.moderator;

  // Check if current user is already a participant
  const isParticipant = currentUser && (
    debaterA?.userId === currentUser.uid ||
    debaterB?.userId === currentUser.uid ||
    moderator?.userId === currentUser.uid
  );

  // Set default join side based on available slots
  useEffect(() => {
    if (!debaterA) {
      setJoinSide('debater_a');
    } else if (!debaterB) {
      setJoinSide('debater_b');
    } else if (!moderator) {
      setJoinSide('moderator');
    } else {
      // All slots filled
      setJoinSide('');
    }
  }, [debaterA, debaterB, moderator]);

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

    const unsubDebateState = subscribeToDebateState(debateId, (state) => {
      setDebateState(state);
    });

    let leaveViewer;
    if (currentUser) {
      leaveViewer = joinAsViewer(debateId, currentUser.uid);
    }

    return () => {
      unsubDebate();
      unsubParticipants();
      unsubViewers();
      unsubDebateState();
      if (leaveViewer) leaveViewer();
    };
  }, [debateId, currentUser]);

  // Subscribe to waitlist for self-moderated debates
  useEffect(() => {
    if (!debateId || !debate || debate.structure !== 'self-moderated') return;

    const unsubscribe = subscribeToWaitlist(debateId, (entries) => {
      setWaitlist(entries);
      const userInWaitlist = entries.find(entry => entry.userId === currentUser?.uid);
      setIsOnWaitlist(!!userInWaitlist);
    });

    return () => unsubscribe();
  }, [debateId, currentUser, debate]);

  // Handle debate end - count votes and schedule cleanup
  useEffect(() => {
    const handleEnd = async () => {
      if (!debateState || !debateState.debateEnded || !debateId) return;
      
      // Check if already processed
      if (debate?.status === 'completed') return;

      try {
        // Calculate winner and update stats
        await handleDebateEnd(debateId);

        // Schedule deletion in 30 minutes
        await scheduleDebateDeletion(debateId, 30);
      } catch (error) {
        console.error('Error processing debate end:', error);
      }
    };
    
    handleEnd();
  }, [debateState?.debateEnded, debateId, debate?.status]);

  // Fetch trending debates
  useEffect(() => {
    const debatesQuery = query(
      collection(db, 'debates'),
      where('status', 'in', ['waiting', 'active']),
      limit(15)
    );

    const unsubDebates = onSnapshot(debatesQuery, (snapshot) => {
      const debatesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        viewerCount: 0
      }));

      // Subscribe to viewer counts for each debate
      const viewerUnsubscribes = [];
      debatesData.forEach(deb => {
        const viewersRef = ref(rtdb, `activeViewers/${deb.id}`);
        const unsub = onValue(viewersRef, (snap) => {
          const viewers = snap.val();
          const count = viewers ? Object.keys(viewers).length : 0;

          setTrendingDebates(prev => {
            const updated = prev.map(d =>
              d.id === deb.id ? { ...d, viewerCount: count } : d
            );
            // If debate doesn't exist yet, add it
            if (!prev.find(d => d.id === deb.id)) {
              updated.push({ ...deb, viewerCount: count });
            }
            // Sort by viewer count and take top 10
            return updated
              .sort((a, b) => b.viewerCount - a.viewerCount)
              .slice(0, 10); // Keep current debate in list
          });
        });
        viewerUnsubscribes.push(unsub);
      });

      return () => {
        viewerUnsubscribes.forEach(unsub => unsub());
      };
    });

    return () => unsubDebates();
  }, [debateId]);

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

  const handleJoinWaitlist = async () => {
    if (!waitlistStance.trim()) {
      alert('Please enter your stance on the issue');
      return;
    }

    if (!currentUser) {
      alert('You must be logged in to join the waitlist');
      return;
    }

    if (!userProfile) {
      alert('Loading user profile... please try again in a moment');
      return;
    }

    try {
      console.log('Joining waitlist with:', {
        debateId,
        userId: currentUser.uid,
        username: userProfile.username,
        photoURL: userProfile.photoURL,
        stance: waitlistStance
      });

      await joinWaitlist(
        debateId,
        currentUser.uid,
        userProfile.username,
        userProfile.photoURL,
        waitlistStance
      );

      console.log('Successfully joined waitlist');
      setWaitlistStance('');
      setShowWaitlistModal(false);

      // Refresh the page to update video/audio state
      window.location.reload();
    } catch (error) {
      console.error('Error joining waitlist:', error);
      console.error('Error details:', error.message, error.code);
      alert(`Failed to join waitlist: ${error.message || 'Please try again.'}`);
    }
  };

  const handleLeaveWaitlist = async () => {
    try {
      await leaveWaitlist(debateId, currentUser.uid);
    } catch (error) {
      console.error('Error leaving waitlist:', error);
      alert('Failed to leave waitlist. Please try again.');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(26, 26, 46, 0.95) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(26, 26, 46, 0.95) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(26, 26, 46, 0.95) 100%)' }}>
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
        backdropFilter: 'blur(20px)',
        background: 'rgba(17, 24, 39, 0.95)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '800',
                color: '#fff',
                background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
                marginBottom: '8px'
              }}>
                {debate.title}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#94a3b8' }}>
                <span style={{ fontWeight: '500' }}>by <span style={{ color: '#e2e8f0' }}>{debate.hostUsername}</span></span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span style={{
                  padding: '3px 10px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  borderRadius: '6px',
                  color: '#60a5fa',
                  fontWeight: '600',
                  fontSize: '12px'
                }}>
                  {debate.category}
                </span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span
                  title={
                    debate.structure === 'moderated'
                      ? 'A third-party moderator controls the debate flow and can pause/resume turns'
                      : debate.structure === 'auto-moderated'
                      ? 'The system automatically manages turn switching with no human moderator'
                      : 'Debaters control their own turns and can switch whenever ready'
                  }
                  style={{
                    padding: '3px 10px',
                    background: debate.structure === 'self-moderated'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : debate.structure === 'auto-moderated'
                      ? 'rgba(147, 51, 234, 0.15)'
                      : 'rgba(251, 191, 36, 0.15)',
                    borderRadius: '6px',
                    color: debate.structure === 'self-moderated'
                      ? '#10b981'
                      : debate.structure === 'auto-moderated'
                      ? '#a78bfa'
                      : '#fbbf24',
                    fontWeight: '600',
                    fontSize: '12px',
                    cursor: 'help'
                  }}
                >
                  {debate.structure === 'self-moderated' ? '👥 Self-Moderated' :
                   debate.structure === 'auto-moderated' ? '🤖 Auto-Moderated' :
                   '👨‍⚖️ 3rd Party Moderator'}
                </span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span>{debate.settings?.turnTime}s per turn</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Waiting Status Message */}
              {debate.status === 'waiting' && (!debaterA || !debaterB || (!moderator && debate?.structure !== 'self-moderated')) && (
                <div style={{
                  padding: '6px 14px',
                  background: 'rgba(251, 191, 36, 0.15)',
                  borderRadius: '10px',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#fbbf24',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>⏳</span>
                  {!debaterA && !debaterB ? 'Need 2 debaters' :
                   (!debaterA || !debaterB) ? 'Need 1 more debater' :
                   (debate?.structure === 'self-moderated' ? 'Waiting to start...' : 'Need moderator')}
                </div>
              )}

              {/* Join Button in Header */}
              {debate.status === 'waiting' && currentUser && !isParticipant && (!debaterA || !debaterB || (!moderator && debate?.structure !== 'self-moderated')) && (
                <button
                  onClick={() => setShowJoinModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '13px',
                    border: '2px solid rgba(96, 165, 250, 1)',
                    cursor: 'pointer',
                    boxShadow: '0 0 25px rgba(59, 130, 246, 0.5)',
                    transition: 'all 0.3s ease',
                    whiteSpace: 'nowrap',
                    animation: 'joinButtonPulse 2s ease-in-out infinite'
                  }}
                >
                  {(!debaterA || !debaterB) ? '🎯 Join Debate' : '🎯 Join as Moderator'}
                </button>
              )}

              {/* Waitlist Button - For self-moderated debates only */}
              {debate?.structure === 'self-moderated' && currentUser && !isParticipant && !debaterB && (
                <>
                  {!isOnWaitlist ? (
                    <button
                      onClick={() => setShowWaitlistModal(true)}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#fff',
                        padding: '10px 20px',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '13px',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                        transition: 'all 0.3s ease',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      ✋ Join Waitlist ({waitlist.length})
                    </button>
                  ) : (
                    <button
                      onClick={handleLeaveWaitlist}
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        padding: '10px 20px',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '13px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      ❌ Leave Waitlist
                    </button>
                  )}
                </>
              )}

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '10px',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <span style={{ fontSize: '16px' }}>👁️</span>
                <span style={{ color: '#60a5fa', fontWeight: '600', fontSize: '14px' }}>{viewerCount}</span>
              </div>
              {debate.status === 'active' && (
                <div style={{
                  padding: '6px 16px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#fff',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                  letterSpacing: '0.05em'
                }}>
                  <span style={{ width: '6px', height: '6px', background: '#fff', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
                  LIVE
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trending Debates Sidebar - Fixed to left edge */}
      <div style={{
        position: 'fixed',
        left: '20px',
        top: '90px',
        width: '260px',
        background: 'rgba(17, 24, 39, 0.6)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '20px',
        maxHeight: 'calc(100vh - 110px)',
        overflowY: 'auto',
        zIndex: 100
      }}
      className="trending-sidebar"
      >
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🔥 Trending
            </h3>

            {trendingDebates.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>
                No active debates right now
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {trendingDebates.map((tDebate, index) => {
                  const isCurrentDebate = tDebate.id === debateId;
                  return (
                  <Link
                    key={tDebate.id}
                    to={`/debate/${tDebate.id}`}
                    style={{
                      textDecoration: 'none',
                      padding: '12px',
                      background: isCurrentDebate
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'rgba(31, 41, 55, 0.6)',
                      borderRadius: '10px',
                      border: isCurrentDebate
                        ? '2px solid rgba(59, 130, 246, 0.5)'
                        : '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrentDebate) {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                        e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrentDebate) {
                        e.currentTarget.style.background = 'rgba(31, 41, 55, 0.6)';
                        e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.05)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#64748b',
                        minWidth: '20px'
                      }}>
                        #{index + 1}
                      </span>
                      {tDebate.status === 'active' && (
                        <span style={{
                          width: '6px',
                          height: '6px',
                          background: '#ef4444',
                          borderRadius: '50%',
                          animation: 'pulse 2s infinite'
                        }}></span>
                      )}
                    </div>

                    <h4 style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#e2e8f0',
                      marginBottom: '8px',
                      lineHeight: '1.3',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {tDebate.title}
                    </h4>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '6px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: '#94a3b8',
                        fontWeight: '600'
                      }}>
                        <span>👁️</span>
                        <span>{tDebate.viewerCount} watching</span>
                      </div>
                      {isCurrentDebate && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          color: '#60a5fa',
                          background: 'rgba(59, 130, 246, 0.2)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          YOU'RE HERE
                        </span>
                      )}
                    </div>
                  </Link>
                  );
                })}
              </div>
            )}
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px 24px 320px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
          {/* Main Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Video */}
            <VideoDebateRoom
              key={debateId} // Force unmount/remount when debateId changes
              debateId={debateId}
              participants={participants}
              currentUser={currentUser}
              userProfile={userProfile}
              debate={debate}
            />
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '14px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <button
                onClick={() => navigate('/browse')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#60a5fa',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '14px',
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
                {/* Only show moderator option for non-self-moderated debates */}
                {!moderator && debate?.structure !== 'self-moderated' && <option value="moderator">Moderator</option>}
                {debaterA && debaterB && (debate?.structure === 'self-moderated' || moderator) && (
                  <option value="" disabled>All slots filled</option>
                )}
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
                disabled={!joinSide || (debaterA && debaterB && moderator)}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  background: (!joinSide || (debaterA && debaterB && moderator)) 
                    ? 'rgba(100, 116, 139, 0.3)' 
                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#fff',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '15px',
                  border: 'none',
                  cursor: (!joinSide || (debaterA && debaterB && moderator)) ? 'not-allowed' : 'pointer',
                  boxShadow: (!joinSide || (debaterA && debaterB && moderator)) 
                    ? 'none' 
                    : '0 4px 15px rgba(59, 130, 246, 0.4)',
                  opacity: (!joinSide || (debaterA && debaterB && moderator)) ? 0.5 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waitlist Modal */}
      {showWaitlistModal && (
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
              Join Waitlist
            </h2>

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#e2e8f0',
                marginBottom: '10px',
                letterSpacing: '0.02em'
              }}>
                Your CON stance (brief sentence):
              </label>
              <textarea
                value={waitlistStance}
                onChange={(e) => setWaitlistStance(e.target.value)}
                placeholder="e.g., I believe the opposite because..."
                maxLength={150}
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
                  resize: 'vertical',
                  minHeight: '100px'
                }}
              />
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                {waitlistStance.length}/150 characters
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowWaitlistModal(false);
                  setWaitlistStance('');
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
                onClick={handleJoinWaitlist}
                disabled={!waitlistStance.trim()}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  background: waitlistStance.trim()
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'rgba(100, 116, 139, 0.3)',
                  color: '#fff',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '15px',
                  border: 'none',
                  cursor: waitlistStance.trim() ? 'pointer' : 'not-allowed',
                  boxShadow: waitlistStance.trim()
                    ? '0 4px 15px rgba(16, 185, 129, 0.4)'
                    : 'none',
                  opacity: waitlistStance.trim() ? 1 : 0.5,
                  transition: 'all 0.2s ease'
                }}
              >
                Join Waitlist
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
