import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { currentUser, userProfile, logOut } = useAuth();

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <header style={{
      background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      fontFamily: "'Inter', sans-serif",
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo and Title */}
          <Link to="/" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            textDecoration: 'none' 
          }}>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: '900',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}>
              DEBATE APP
            </div>
          </Link>

          {/* Navigation */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <Link 
              to="/" 
              style={{ 
                color: '#e2e8f0', 
                textDecoration: 'none', 
                fontWeight: '600',
                fontSize: '15px',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#fff'}
              onMouseLeave={(e) => e.target.style.color = '#e2e8f0'}
            >
              Home
            </Link>
            
            <Link 
              to="/browse" 
              style={{ 
                color: '#e2e8f0', 
                textDecoration: 'none', 
                fontWeight: '600',
                fontSize: '15px',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#fff'}
              onMouseLeave={(e) => e.target.style.color = '#e2e8f0'}
            >
              Browse Debates
            </Link>

            {currentUser ? (
              <>
                <Link 
                  to="/create" 
                  style={{ 
                    color: '#e2e8f0', 
                    textDecoration: 'none', 
                    fontWeight: '600',
                    fontSize: '15px',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#fff'}
                  onMouseLeave={(e) => e.target.style.color = '#e2e8f0'}
                >
                  Create Debate
                </Link>
                <Link 
                  to="/profile" 
                  style={{ 
                    color: '#e2e8f0', 
                    textDecoration: 'none', 
                    fontWeight: '600',
                    fontSize: '15px',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#fff'}
                  onMouseLeave={(e) => e.target.style.color = '#e2e8f0'}
                >
                  Profile
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={userProfile?.photoURL || 'https://ui-avatars.com/api/?name=' + (userProfile?.username || 'User')}
                      alt="Profile"
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%',
                        border: '2px solid rgba(59, 130, 246, 0.5)',
                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                      }}
                    />
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#fff',
                      fontSize: '15px'
                    }}>
                      {userProfile?.username}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      padding: '10px 24px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                      fontFamily: "'Inter', sans-serif"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    padding: '10px 24px',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.2s ease',
                    display: 'inline-block'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: '#fff',
                    padding: '10px 24px',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    fontWeight: '700',
                    fontSize: '14px',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                    transition: 'all 0.2s ease',
                    display: 'inline-block'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
                  }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
