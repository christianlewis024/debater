import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscribeToDebates } from '../services/debateService';

const BrowseDebatesPage = () => {
  const [debates, setDebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');

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
    console.log('Setting up debate subscription...');
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
        console.log('Received debates:', debatesData);
        setDebates(debatesData);
        setLoading(false);
      }, filters);

      return () => {
        console.log('Cleaning up subscription');
        unsubscribe();
      };
    } catch (err) {
      console.error('Error setting up subscription:', err);
      setError('Failed to load debates. Please check your connection.');
      setLoading(false);
    }
  }, [categoryFilter, statusFilter]);

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    try {
      const seconds = Math.floor((new Date() - timestamp.toDate()) / 1000);
      
      if (seconds < 60) return `${seconds}s ago`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
      return `${Math.floor(seconds / 86400)}d ago`;
    } catch (e) {
      return 'Just now';
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
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
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
          Browse Debates
        </h1>

        {/* Filters */}
        <div style={{
          background: 'rgba(17, 24, 39, 0.6)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
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
        {!loading && !error && debates.length === 0 && (
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

        {/* Debates Grid */}
        {!loading && !error && debates.length > 0 && (
          <div style={{ display: 'grid', gap: '24px' }}>
            {debates.map(debate => (
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
                      <span>{formatTimeAgo(debate.createdAt)}</span>
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
                    </div>
                  </div>
                  {getStatusBadge(debate.status)}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '32px', fontSize: '15px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>👁️</span>
                    <span style={{ fontWeight: '600', color: '#e2e8f0' }}>
                      {debate.stats?.currentViewers || 0} watching
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseDebatesPage;
