import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscribeToDebates } from '../services/debateService';
import { ref, onValue } from 'firebase/database';
import { rtdb, db } from '../services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const BrowseDebatesPage = () => {
  const [debates, setDebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [needsDebatersFilter, setNeedsDebatersFilter] = useState(false);
  const [viewerCounts, setViewerCounts] = useState({}); // Track viewer counts for all debates
  const [debateParticipants, setDebateParticipants] = useState({}); // Track participants for all debates

  // Add pulse animation CSS
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse {
        0%, 100% {
          box-shadow: 0 0 20px rgba(234, 179, 8, 0.3);
        }
        50% {
          box-shadow: 0 0 30px rgba(234, 179, 8, 0.6);
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const categories = [
    'all',
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

  useEffect(() => {
    setLoading(true);
    setError('');

    const filters = {};
    if (categoryFilter !== 'all') {
      filters.category = categoryFilter;
    }
    if (statusFilter) {
      filters.status = statusFilter;
    }

    try {
      const unsubscribe = subscribeToDebates((debatesData) => {
        // Filter out debates older than 24 hours
        const recentDebates = debatesData.filter(debate => !isDebateOld(debate.createdAt));
        setDebates(recentDebates);
        setLoading(false);
      }, filters);

      return () => {
        unsubscribe();
      };
    } catch (err) {
      console.error('Error setting up subscription:', err);
      setError('Failed to load debates. Please check your connection.');
      setLoading(false);
    }
  }, [categoryFilter, statusFilter]);

  // Subscribe to viewer counts for all debates
  useEffect(() => {
    if (debates.length === 0) return;

    const unsubscribes = [];

    debates.forEach(debate => {
      const viewersRef = ref(rtdb, `activeViewers/${debate.id}`);

      const unsubscribe = onValue(viewersRef, (snapshot) => {
        const viewers = snapshot.val();
        const count = viewers ? Object.keys(viewers).length : 0;

        setViewerCounts(prev => ({
          ...prev,
          [debate.id]: count
        }));
      });

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [debates]);

  // Subscribe to participants for all debates
  useEffect(() => {
    if (debates.length === 0) return;

    const unsubscribes = [];

    debates.forEach(debate => {
      const participantsRef = collection(db, `debates/${debate.id}/participants`);

      const unsubscribe = onSnapshot(participantsRef, (snapshot) => {
        const participants = {};
        snapshot.forEach(doc => {
          participants[doc.id] = doc.data();
        });

        setDebateParticipants(prev => ({
          ...prev,
          [debate.id]: participants
        }));
      });

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [debates]);

  // Filter debates based on search query and needsDebaters filter
  const filteredDebates = debates.filter(debate => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const participants = debateParticipants[debate.id] || {};

      const matchesTitle = debate.title?.toLowerCase().includes(query);
      const matchesHost = debate.hostUsername?.toLowerCase().includes(query);
      const matchesProDebater = participants.debater_a?.username?.toLowerCase().includes(query);
      const matchesConDebater = participants.debater_b?.username?.toLowerCase().includes(query);
      const matchesModerator = participants.moderator?.username?.toLowerCase().includes(query);

      if (!matchesTitle && !matchesHost && !matchesProDebater && !matchesConDebater && !matchesModerator) {
        return false;
      }
    }

    // Needs debaters filter
    if (needsDebatersFilter) {
      const participants = debateParticipants[debate.id] || {};
      const hasDebaterA = participants.debater_a?.userId;
      const hasDebaterB = participants.debater_b?.userId;
      const hasModerator = participants.moderator?.userId;

      // Only show debates that are waiting and missing at least one role
      if (debate.status !== 'waiting') return false;

      if (debate.structure === 'moderated') {
        // Needs at least one debater or moderator
        if (hasDebaterA && hasDebaterB && hasModerator) return false;
      } else {
        // Needs at least one debater
        if (hasDebaterA && hasDebaterB) return false;
      }
    }

    return true;
  });

  // Format timestamp with full date/time for older debates
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    try {
      const date = timestamp.toDate();
      const now = new Date();
      const seconds = Math.floor((now - date) / 1000);

      // Less than 1 hour: show relative time
      if (seconds < 3600) {
        if (seconds < 60) return `${seconds}s ago`;
        return `${Math.floor(seconds / 60)}m ago`;
      }

      // Less than 24 hours: show hours ago
      if (seconds < 86400) {
        return `${Math.floor(seconds / 3600)}h ago`;
      }

      // Older than 24 hours: show full date and time
      const options = {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };
      return date.toLocaleString('en-US', options);
    } catch (e) {
      return 'Just now';
    }
  };

  // Check if debate is older than 24 hours
  const isDebateOld = (timestamp) => {
    if (!timestamp) return false;
    try {
      const seconds = Math.floor((new Date() - timestamp.toDate()) / 1000);
      return seconds > 86400; // 24 hours in seconds
    } catch (e) {
      return false;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      waiting: { text: 'Waiting', bg: 'rgba(234, 179, 8, 0.2)', color: '#eab308', border: 'rgba(234, 179, 8, 0.3)' },
      active: { text: 'LIVE', bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.4)' },
      completed: { text: 'Ended', bg: 'rgba(100, 116, 139, 0.2)', color: '#94a3b8', border: 'rgba(100, 116, 139, 0.3)' }
    };
    const badge = badges[status] || badges.waiting;
    return (
      <span style={{
        padding: '6px 16px',
        borderRadius: '10px',
        fontSize: '13px',
        fontWeight: '700',
        background: badge.bg,
        color: badge.color,
        border: `1px solid ${badge.border}`,
        letterSpacing: '0.05em'
      }}>
        {badge.text}
      </span>
    );
  };

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

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: '900',
          marginBottom: '40px',
          background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em'
        }}>
          Browse Klashes
        </h1>

        {/* Search and Filters */}
        <div style={{
          background: 'rgba(17, 24, 39, 0.6)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          {/* Search Bar */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#e2e8f0',
              marginBottom: '10px',
              letterSpacing: '0.02em'
            }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Search by topic, host, or debater name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.border = '1px solid rgba(59, 130, 246, 0.5)'}
              onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {/* Category Filter */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#e2e8f0',
                marginBottom: '10px',
                letterSpacing: '0.02em'
              }}>
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
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

            {/* Status Filter */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#e2e8f0',
                marginBottom: '10px',
                letterSpacing: '0.02em'
              }}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
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
                <option value="" style={{ background: '#1f2937' }}>All Status</option>
                <option value="waiting" style={{ background: '#1f2937' }}>Waiting</option>
                <option value="active" style={{ background: '#1f2937' }}>Live</option>
                <option value="completed" style={{ background: '#1f2937' }}>Completed</option>
              </select>
            </div>
          </div>

          {/* Needs Debaters Toggle */}
          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setNeedsDebatersFilter(!needsDebatersFilter)}
              style={{
                padding: '12px 24px',
                background: needsDebatersFilter
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
                color: needsDebatersFilter ? '#fff' : '#94a3b8',
                borderRadius: '12px',
                border: needsDebatersFilter ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                boxShadow: needsDebatersFilter ? '0 4px 15px rgba(59, 130, 246, 0.4)' : 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!needsDebatersFilter) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!needsDebatersFilter) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
            >
              {needsDebatersFilter ? '✓ ' : ''}Needs Debaters
            </button>
            {needsDebatersFilter && (
              <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>
                Showing debates with open spots
              </span>
            )}
          </div>
        </div>

        {/* Error */}
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

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>⏳</div>
            <p style={{ color: '#94a3b8', fontSize: '18px', fontWeight: '600' }}>Loading debates...</p>
          </div>
        )}

        {/* No debates */}
        {!loading && !error && filteredDebates.length === 0 && debates.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'rgba(17, 24, 39, 0.6)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>🤷</div>
            <p style={{ color: '#94a3b8', marginBottom: '32px', fontSize: '18px', fontWeight: '600' }}>No debates found</p>
            <Link
              to="/create"
              style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                padding: '16px 40px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '16px',
                boxShadow: '0 8px 30px rgba(59, 130, 246, 0.4)'
              }}
            >
              Create First Debate
            </Link>
          </div>
        )}

        {/* No filtered results */}
        {!loading && !error && filteredDebates.length === 0 && debates.length > 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'rgba(17, 24, 39, 0.6)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
            <p style={{ color: '#94a3b8', fontSize: '16px', fontWeight: '600' }}>No debates match your filters</p>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>Try adjusting your search or filters</p>
          </div>
        )}

        {/* Debates Grid */}
        {!loading && !error && filteredDebates.length > 0 && (
          <div style={{ display: 'grid', gap: '24px' }}>
            {filteredDebates.map(debate => {
              const participants = debateParticipants[debate.id] || {};
              const hasDebaterA = participants.debater_a?.userId;
              const hasDebaterB = participants.debater_b?.userId;
              const hasModerator = participants.moderator?.userId;

              // Determine if debate is open
              let isOpen = false;
              if (debate.status === 'waiting') {
                if (debate.structure === 'moderated') {
                  isOpen = !hasDebaterA || !hasDebaterB || !hasModerator;
                } else {
                  isOpen = !hasDebaterA || !hasDebaterB;
                }
              }

              return (
              <Link
                key={debate.id}
                to={`/debate/${debate.id}`}
                style={{
                  display: 'block',
                  background: 'rgba(17, 24, 39, 0.6)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '32px',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.3)';
                  e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.08)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '28px',
                      fontWeight: '800',
                      color: '#fff',
                      marginBottom: '12px',
                      letterSpacing: '-0.01em'
                    }}>
                      {debate.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#94a3b8', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '600' }}>by {debate.hostUsername}</span>
                      <span style={{ opacity: 0.5 }}>•</span>
                      <span>{formatTimestamp(debate.createdAt)}</span>
                      <span style={{ opacity: 0.5 }}>•</span>
                      <span style={{
                        padding: '4px 12px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        borderRadius: '8px',
                        color: '#60a5fa',
                        fontWeight: '600',
                        fontSize: '13px'
                      }}>
                        {debate.category?.charAt(0).toUpperCase() + debate.category?.slice(1)}
                      </span>
                      {debate.structure && (
                        <>
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
                              padding: '4px 12px',
                              background: 'rgba(147, 51, 234, 0.15)',
                              borderRadius: '8px',
                              color: '#a78bfa',
                              fontWeight: '600',
                              fontSize: '13px',
                              cursor: 'help'
                            }}
                          >
                            {debate.structure === 'moderated' && '👤 Moderated'}
                            {debate.structure === 'auto-moderated' && '⚙️ Auto'}
                            {debate.structure === 'self-moderated' && '🎙️ Self'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    {getStatusBadge(debate.status)}
                    {isOpen && (
                      <span style={{
                        padding: '6px 16px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: '700',
                        background: 'rgba(34, 197, 94, 0.2)',
                        color: '#22c55e',
                        border: '1px solid rgba(34, 197, 94, 0.4)',
                        letterSpacing: '0.05em'
                      }}>
                        🟢 OPEN
                      </span>
                    )}
                  </div>
                </div>

                {/* Participants Section */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: debate.structure === 'moderated' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                  gap: '16px',
                  marginBottom: '20px',
                  marginTop: '20px'
                }}>
                  {/* PRO Debater */}
                  <div style={{
                    padding: '12px 16px',
                    background: hasDebaterA
                      ? 'rgba(59, 130, 246, 0.1)'
                      : 'rgba(234, 179, 8, 0.15)',
                    borderRadius: '12px',
                    border: hasDebaterA
                      ? '1px solid rgba(59, 130, 246, 0.3)'
                      : '2px solid rgba(234, 179, 8, 0.6)',
                    boxShadow: hasDebaterA
                      ? 'none'
                      : '0 0 20px rgba(234, 179, 8, 0.3)',
                    animation: hasDebaterA ? 'none' : 'pulse 2s ease-in-out infinite',
                  }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#94a3b8',
                      marginBottom: '6px',
                      letterSpacing: '0.05em'
                    }}>
                      👍 PRO
                    </div>
                    {hasDebaterA ? (
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          color: '#60a5fa',
                          marginBottom: '4px'
                        }}>
                          {participants.debater_a.profileData?.username || participants.debater_a.username}
                        </div>
                        {participants.debater_a.sideDescription && (
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#94a3b8',
                            lineHeight: '1.4'
                          }}>
                            "{participants.debater_a.sideDescription}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#eab308',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span style={{ fontSize: '18px' }}>✨</span>
                        JOIN NOW!
                      </div>
                    )}
                  </div>

                  {/* CON Debater */}
                  <div style={{
                    padding: '12px 16px',
                    background: hasDebaterB
                      ? 'rgba(239, 68, 68, 0.1)'
                      : 'rgba(234, 179, 8, 0.15)',
                    borderRadius: '12px',
                    border: hasDebaterB
                      ? '1px solid rgba(239, 68, 68, 0.3)'
                      : '2px solid rgba(234, 179, 8, 0.6)',
                    boxShadow: hasDebaterB
                      ? 'none'
                      : '0 0 20px rgba(234, 179, 8, 0.3)',
                    animation: hasDebaterB ? 'none' : 'pulse 2s ease-in-out infinite',
                  }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#94a3b8',
                      marginBottom: '6px',
                      letterSpacing: '0.05em'
                    }}>
                      👎 CON
                    </div>
                    {hasDebaterB ? (
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          color: '#f87171',
                          marginBottom: '4px'
                        }}>
                          {participants.debater_b.profileData?.username || participants.debater_b.username}
                        </div>
                        {participants.debater_b.sideDescription && (
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#94a3b8',
                            lineHeight: '1.4',
                            marginBottom: debate.structure === 'self-moderated' ? '6px' : '0'
                          }}>
                            "{participants.debater_b.sideDescription}"
                          </div>
                        )}
                        {debate.structure === 'self-moderated' && (
                          <div style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#22c55e',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            Waitlist ✓
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#eab308',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span style={{ fontSize: '18px' }}>✨</span>
                        JOIN NOW!
                      </div>
                    )}
                  </div>

                  {/* Moderator (only for moderated debates) */}
                  {debate.structure === 'moderated' && (
                    <div style={{
                      padding: '12px 16px',
                      background: hasModerator
                        ? 'rgba(147, 51, 234, 0.1)'
                        : 'rgba(234, 179, 8, 0.15)',
                      borderRadius: '12px',
                      border: hasModerator
                        ? '1px solid rgba(147, 51, 234, 0.3)'
                        : '2px solid rgba(234, 179, 8, 0.6)',
                      boxShadow: hasModerator
                        ? 'none'
                        : '0 0 20px rgba(234, 179, 8, 0.3)',
                      animation: hasModerator ? 'none' : 'pulse 2s ease-in-out infinite',
                    }}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#94a3b8',
                        marginBottom: '6px',
                        letterSpacing: '0.05em'
                      }}>
                        👤 MODERATOR
                      </div>
                      {hasModerator ? (
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          color: '#a78bfa'
                        }}>
                          {participants.moderator.profileData?.username || participants.moderator.username}
                        </div>
                      ) : (
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          color: '#eab308',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <span style={{ fontSize: '18px' }}>✨</span>
                          JOIN NOW!
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '32px', fontSize: '15px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>👁️</span>
                    <span style={{ fontWeight: '600', color: '#e2e8f0' }}>
                      {viewerCounts[debate.id] || 0} watching
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>⏱️</span>
                    <span style={{ color: '#94a3b8', fontWeight: '500' }}>
                      {debate.settings?.turnTime}s turns
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>🔄</span>
                    <span style={{ color: '#94a3b8', fontWeight: '500' }}>
                      Max {debate.settings?.maxTurns} turns
                    </span>
                  </div>
                </div>
              </Link>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseDebatesPage;
