import React from 'react';

/**
 * Formats seconds into MM:SS format
 */
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * DebateTimer component - Displays turn status, time remaining, and turn number
 * @param {number} timeRemaining - Seconds remaining in current turn
 * @param {boolean} isMyTurn - Whether it's the current user's turn
 * @param {number} turnNumber - Current turn number
 * @param {number} maxTurns - Maximum number of turns
 */
const DebateTimer = ({ timeRemaining, isMyTurn, turnNumber, maxTurns }) => {
  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
      {/* Turn Status Indicator */}
      <div
        style={{
          padding: "8px 16px",
          background: isMyTurn
            ? "rgba(16, 185, 129, 0.2)"
            : "rgba(100, 116, 139, 0.2)",
          borderRadius: "10px",
          border: `1px solid ${
            isMyTurn
              ? "rgba(16, 185, 129, 0.4)"
              : "rgba(100, 116, 139, 0.3)"
          }`,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "18px" }}>
          {isMyTurn ? "🎤" : "👂"}
        </span>
        <span
          style={{
            color: isMyTurn ? "#10b981" : "#94a3b8",
            fontWeight: "700",
            fontSize: "14px",
          }}
        >
          {isMyTurn ? "Your Turn" : "Their Turn"}
        </span>
      </div>

      {/* Time Remaining */}
      <div
        style={{
          padding: "8px 20px",
          background:
            timeRemaining <= 10
              ? "rgba(239, 68, 68, 0.2)"
              : "rgba(59, 130, 246, 0.2)",
          borderRadius: "10px",
          border: `1px solid ${
            timeRemaining <= 10
              ? "rgba(239, 68, 68, 0.4)"
              : "rgba(59, 130, 246, 0.4)"
          }`,
          fontWeight: "800",
          fontSize: "18px",
          color: timeRemaining <= 10 ? "#ef4444" : "#60a5fa",
          fontFamily: "monospace",
        }}
      >
        {formatTime(timeRemaining)}
      </div>

      {/* Turn Counter */}
      <div
        style={{
          padding: "6px 12px",
          background: "rgba(147, 51, 234, 0.2)",
          borderRadius: "8px",
          border: "1px solid rgba(147, 51, 234, 0.3)",
          fontSize: "12px",
          color: "#a78bfa",
          fontWeight: "600",
        }}
      >
        Turn {turnNumber}/{maxTurns}
      </div>
    </div>
  );
};

export default DebateTimer;
