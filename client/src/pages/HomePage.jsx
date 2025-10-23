import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const HomePage = () => {
  const { currentUser } = useAuth();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(26, 26, 46, 0.95) 100%)",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Animated Background */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.05) 0%, transparent 50%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      ></div>

      {/* Hero Section */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "80px 32px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "80px" }}>
          <h1
            style={{
              fontSize: "72px",
              fontWeight: "900",
              background: "linear-gradient(135deg, #fff 0%, #94a3b8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "24px",
              letterSpacing: "-0.03em",
              lineHeight: "1.1",
            }}
          >
            Welcome to{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textTransform: "uppercase",
                fontWeight: "900",
              }}
            >
              Klash
            </span>
          </h1>
          <p
            style={{
              fontSize: "24px",
              color: "#94a3b8",
              marginBottom: "48px",
              fontWeight: "500",
              maxWidth: "700px",
              margin: "0 auto 48px",
            }}
          >
            Where perspectives collide. Engage in live video debates with
            real-time voting and structured discussions.
          </p>

          {currentUser ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "20px",
                flexWrap: "wrap",
              }}
            >
              <Link
                to="/create"
                style={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  color: "#fff",
                  padding: "18px 40px",
                  borderRadius: "14px",
                  fontSize: "18px",
                  fontWeight: "700",
                  textDecoration: "none",
                  boxShadow: "0 8px 30px rgba(59, 130, 246, 0.4)",
                  transition: "all 0.3s ease",
                  display: "inline-block",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-3px)";
                  e.target.style.boxShadow =
                    "0 12px 40px rgba(59, 130, 246, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow =
                    "0 8px 30px rgba(59, 130, 246, 0.4)";
                }}
              >
                🎤 Host a Debate
              </Link>
              <Link
                to="/browse"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                  padding: "18px 40px",
                  borderRadius: "14px",
                  fontSize: "18px",
                  fontWeight: "700",
                  textDecoration: "none",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  transition: "all 0.3s ease",
                  display: "inline-block",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.15)";
                  e.target.style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.1)";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                🔍 Browse Debates
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "20px",
                flexWrap: "wrap",
              }}
            >
              <Link
                to="/signup"
                style={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  color: "#fff",
                  padding: "18px 40px",
                  borderRadius: "14px",
                  fontSize: "18px",
                  fontWeight: "700",
                  textDecoration: "none",
                  boxShadow: "0 8px 30px rgba(59, 130, 246, 0.4)",
                  transition: "all 0.3s ease",
                  display: "inline-block",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-3px)";
                  e.target.style.boxShadow =
                    "0 12px 40px rgba(59, 130, 246, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow =
                    "0 8px 30px rgba(59, 130, 246, 0.4)";
                }}
              >
                🚀 Get Started
              </Link>
              <Link
                to="/login"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                  padding: "18px 40px",
                  borderRadius: "14px",
                  fontSize: "18px",
                  fontWeight: "700",
                  textDecoration: "none",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  transition: "all 0.3s ease",
                  display: "inline-block",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.15)";
                  e.target.style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.1)";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "32px",
            marginBottom: "80px",
          }}
        >
          <div
            style={{
              background: "rgba(17, 24, 39, 0.6)",
              backdropFilter: "blur(20px)",
              padding: "40px",
              borderRadius: "20px",
              textAlign: "center",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.boxShadow =
                "0 20px 60px rgba(59, 130, 246, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>📹</div>
            <h3
              style={{
                fontSize: "28px",
                fontWeight: "800",
                marginBottom: "16px",
                color: "#fff",
              }}
            >
              Live Video
            </h3>
            <p
              style={{ color: "#94a3b8", fontSize: "16px", lineHeight: "1.6" }}
            >
              Face-to-face debates with real-time video streaming and speaking
              detection
            </p>
          </div>

          <div
            style={{
              background: "rgba(17, 24, 39, 0.6)",
              backdropFilter: "blur(20px)",
              padding: "40px",
              borderRadius: "20px",
              textAlign: "center",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.boxShadow =
                "0 20px 60px rgba(147, 51, 234, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>⏱️</div>
            <h3
              style={{
                fontSize: "28px",
                fontWeight: "800",
                marginBottom: "16px",
                color: "#fff",
              }}
            >
              Turn-Based
            </h3>
            <p
              style={{ color: "#94a3b8", fontSize: "16px", lineHeight: "1.6" }}
            >
              Structured debates with timed turns and automatic switching
              between speakers
            </p>
          </div>

          <div
            style={{
              background: "rgba(17, 24, 39, 0.6)",
              backdropFilter: "blur(20px)",
              padding: "40px",
              borderRadius: "20px",
              textAlign: "center",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.boxShadow =
                "0 20px 60px rgba(16, 185, 129, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>🗳️</div>
            <h3
              style={{
                fontSize: "28px",
                fontWeight: "800",
                marginBottom: "16px",
                color: "#fff",
              }}
            >
              Live Voting
            </h3>
            <p
              style={{ color: "#94a3b8", fontSize: "16px", lineHeight: "1.6" }}
            >
              Viewers vote in real-time to decide the most convincing argument
            </p>
          </div>
        </div>

        {/* How It Works Section */}
        <div
          style={{
            background: "rgba(17, 24, 39, 0.6)",
            backdropFilter: "blur(20px)",
            borderRadius: "20px",
            padding: "64px 48px",
            marginBottom: "80px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <h2
            style={{
              fontSize: "48px",
              fontWeight: "800",
              textAlign: "center",
              marginBottom: "64px",
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            How It Works
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "40px",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                  fontSize: "32px",
                  fontWeight: "900",
                  color: "#fff",
                  boxShadow: "0 8px 30px rgba(59, 130, 246, 0.4)",
                }}
              >
                1
              </div>
              <h4
                style={{
                  fontWeight: "700",
                  fontSize: "20px",
                  marginBottom: "12px",
                  color: "#fff",
                }}
              >
                Create or Join
              </h4>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "15px",
                  lineHeight: "1.6",
                }}
              >
                Host a new debate or join an existing one
              </p>
            </div>

            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                  fontSize: "32px",
                  fontWeight: "900",
                  color: "#fff",
                  boxShadow: "0 8px 30px rgba(139, 92, 246, 0.4)",
                }}
              >
                2
              </div>
              <h4
                style={{
                  fontWeight: "700",
                  fontSize: "20px",
                  marginBottom: "12px",
                  color: "#fff",
                }}
              >
                Pick Your Side
              </h4>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "15px",
                  lineHeight: "1.6",
                }}
              >
                Choose which position you want to defend
              </p>
            </div>

            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                  fontSize: "32px",
                  fontWeight: "900",
                  color: "#fff",
                  boxShadow: "0 8px 30px rgba(236, 72, 153, 0.4)",
                }}
              >
                3
              </div>
              <h4
                style={{
                  fontWeight: "700",
                  fontSize: "20px",
                  marginBottom: "12px",
                  color: "#fff",
                }}
              >
                Debate Live
              </h4>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "15px",
                  lineHeight: "1.6",
                }}
              >
                Present arguments in timed turns
              </p>
            </div>

            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                  fontSize: "32px",
                  fontWeight: "900",
                  color: "#fff",
                  boxShadow: "0 8px 30px rgba(16, 185, 129, 0.4)",
                }}
              >
                4
              </div>
              <h4
                style={{
                  fontWeight: "700",
                  fontSize: "20px",
                  marginBottom: "12px",
                  color: "#fff",
                }}
              >
                Win Votes
              </h4>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "15px",
                  lineHeight: "1.6",
                }}
              >
                Viewers decide the winner
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        {!currentUser && (
          <div
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              borderRadius: "20px",
              padding: "64px 48px",
              textAlign: "center",
              color: "#fff",
              boxShadow: "0 20px 60px rgba(59, 130, 246, 0.3)",
            }}
          >
            <h2
              style={{
                fontSize: "48px",
                fontWeight: "800",
                marginBottom: "20px",
                letterSpacing: "-0.02em",
              }}
            >
              Ready to Start Debating?
            </h2>
            <p
              style={{
                fontSize: "22px",
                marginBottom: "40px",
                opacity: 0.9,
                fontWeight: "500",
              }}
            >
              Join the conversation and share your perspective
            </p>
            <Link
              to="/signup"
              style={{
                background: "#fff",
                color: "#3b82f6",
                padding: "18px 48px",
                borderRadius: "14px",
                fontSize: "18px",
                fontWeight: "700",
                textDecoration: "none",
                display: "inline-block",
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.2)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "scale(1.05)";
                e.target.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.2)";
              }}
            >
              Create Free Account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
