import React from 'react';
import { pauseDebate, resumeDebate, addTime, switchTurn } from '../../services/debateStateService';

/**
 * ModeratorControls component - Pause/Resume, Add Time, and Skip Turn buttons
 * Only visible to moderators during active debates
 * @param {string} debateId - The debate ID
 * @param {object} debateState - Current debate state
 * @param {number} timeRemaining - Current time remaining in turn
 */
const ModeratorControls = ({ debateId, debateState, timeRemaining }) => {
  const handlePauseResume = async () => {
    if (debateState.paused) {
      await resumeDebate(debateId);
    } else {
      await pauseDebate(debateId, timeRemaining);
    }
  };

  const handleAddTime = async () => {
    await addTime(debateId, 30);
  };

  const handleSkipTurn = async () => {
    await switchTurn(debateId, debateState);
  };

  const buttonHoverStyle = {
    onMouseEnter: (e) => (e.target.style.transform = "translateY(-2px)"),
    onMouseLeave: (e) => (e.target.style.transform = "translateY(0)"),
  };

  return (
    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
      {/* Pause/Resume Button */}
      <button
        onClick={handlePauseResume}
        style={{
          padding: "10px 20px",
          borderRadius: "10px",
          fontWeight: "700",
          fontSize: "14px",
          border: "none",
          cursor: "pointer",
          background: debateState.paused
            ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
            : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          color: "#fff",
          boxShadow: debateState.paused
            ? "0 4px 15px rgba(16, 185, 129, 0.4)"
            : "0 4px 15px rgba(245, 158, 11, 0.4)",
          transition: "all 0.2s ease",
        }}
        {...buttonHoverStyle}
      >
        {debateState.paused ? "▶️ Resume" : "⏸️ Pause"}
      </button>

      {/* Add Time Button */}
      <button
        onClick={handleAddTime}
        style={{
          padding: "10px 20px",
          borderRadius: "10px",
          fontWeight: "700",
          fontSize: "14px",
          border: "none",
          cursor: "pointer",
          background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          color: "#fff",
          boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)",
          transition: "all 0.2s ease",
        }}
        {...buttonHoverStyle}
      >
        ⏱️ +30s
      </button>

      {/* Skip Turn Button */}
      <button
        onClick={handleSkipTurn}
        style={{
          padding: "10px 20px",
          borderRadius: "10px",
          fontWeight: "700",
          fontSize: "14px",
          border: "none",
          cursor: "pointer",
          background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
          color: "#fff",
          boxShadow: "0 4px 15px rgba(139, 92, 246, 0.4)",
          transition: "all 0.2s ease",
        }}
        {...buttonHoverStyle}
      >
        ⏭️ Skip Turn
      </button>
    </div>
  );
};

export default ModeratorControls;
