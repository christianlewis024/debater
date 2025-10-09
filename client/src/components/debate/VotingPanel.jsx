import React, { useState, useEffect } from "react";
import {
  castVote,
  getVoteCounts,
  hasUserVoted,
} from "../../services/voteService";

const VotingPanel = ({ debateId, participants, currentUser }) => {
  const [voteCounts, setVoteCounts] = useState({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!debateId) return;

    loadVotes();
    checkIfVoted();

    const interval = setInterval(loadVotes, 5000);
    return () => clearInterval(interval);
  }, [debateId, currentUser, loadVotes, checkIfVoted]); // Added loadVotes and checkIfVoted to dependency array

  const loadVotes = async () => {
    try {
      const { counts, total } = await getVoteCounts(debateId);
      setVoteCounts(counts);
      setTotalVotes(total);
    } catch (error) {
      console.error("Error loading votes:", error);
    }
  };

  const checkIfVoted = async () => {
    if (!currentUser) {
      setHasVoted(false);
      return;
    }

    try {
      const voted = await hasUserVoted(debateId, currentUser.uid);
      setHasVoted(voted);
    } catch (error) {
      console.error("Error checking vote:", error);
    }
  };

  const handleVote = async (participantId) => {
    if (!currentUser) {
      setError("Please login to vote");
      return;
    }

    if (hasVoted) {
      setError("You have already voted");
      return;
    }

    try {
      setVoting(true);
      setError("");
      await castVote(debateId, currentUser.uid, participantId);
      setHasVoted(true);
      await loadVotes();
    } catch (error) {
      setError(error.message || "Failed to cast vote");
    } finally {
      setVoting(false);
    }
  };

  const getPercentage = (participantId) => {
    if (totalVotes === 0) return 0;
    const count = voteCounts[participantId] || 0;
    return Math.round((count / totalVotes) * 100);
  };

  const getVoteCount = (participantId) => {
    return voteCounts[participantId] || 0;
  };

  const debaters = Object.entries(participants).filter(
    ([role]) => role === "debater_a" || role === "debater_b"
  );

  if (debaters.length === 0) {
    return (
      <div
        style={{
          background: "rgba(17, 24, 39, 0.6)",
          backdropFilter: "blur(20px)",
          borderRadius: "20px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "24px",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "700",
            marginBottom: "16px",
            color: "#fff",
          }}
        >
          🗳️ Cast Your Vote
        </h3>
        <p style={{ textAlign: "center", color: "#94a3b8", padding: "20px 0" }}>
          Waiting for debaters...
        </p>
      </div>
    );
  }

  const debaterA = debaters.find(([role]) => role === "debater_a")?.[1];
  const debaterB = debaters.find(([role]) => role === "debater_b")?.[1];

  const percentageA = debaterA ? getPercentage(debaterA.id) : 0;
  const percentageB = debaterB ? getPercentage(debaterB.id) : 0;
  const countA = debaterA ? getVoteCount(debaterA.id) : 0;
  const countB = debaterB ? getVoteCount(debaterB.id) : 0;

  const winningA = percentageA > percentageB;
  const winningB = percentageB > percentageA;

  return (
    <div
      style={{
        background: "rgba(17, 24, 39, 0.6)",
        backdropFilter: "blur(20px)",
        borderRadius: "20px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        padding: "24px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <h3
        style={{
          fontSize: "18px",
          fontWeight: "700",
          marginBottom: "16px",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        🗳️ Cast Your Vote
      </h3>

      {error && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#fca5a5",
            padding: "10px 14px",
            borderRadius: "10px",
            marginBottom: "16px",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          {error}
        </div>
      )}

      {hasVoted && (
        <div
          style={{
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#6ee7b7",
            padding: "10px 14px",
            borderRadius: "10px",
            marginBottom: "16px",
            fontSize: "13px",
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          ✓ You have voted!
        </div>
      )}

      {/* Voting Options - Side by Side */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        {/* Debater A */}
        {debaterA && (
          <div
            onClick={() =>
              !hasVoted && currentUser && !voting && handleVote(debaterA.id)
            }
            style={{
              background: winningA
                ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.05) 100%)"
                : "rgba(31, 41, 55, 0.5)",
              border: winningA
                ? "2px solid rgba(59, 130, 246, 0.5)"
                : "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              padding: "20px 16px",
              cursor:
                !hasVoted && currentUser && !voting ? "pointer" : "default",
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              if (!hasVoted && currentUser && !voting) {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.boxShadow =
                  "0 8px 30px rgba(59, 130, 246, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Winning Badge */}
            {winningA && totalVotes > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#fff",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: "800",
                  boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
                }}
              >
                🏆 WINNING
              </div>
            )}

            <div style={{ textAlign: "center" }}>
              <img
                src={
                  debaterA.profileData?.photoURL ||
                  "https://ui-avatars.com/api/?name=User"
                }
                alt={debaterA.profileData?.username}
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  border: "3px solid rgba(59, 130, 246, 0.5)",
                  marginBottom: "12px",
                  boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
                }}
              />
              <div
                style={{
                  fontWeight: "700",
                  color: "#fff",
                  fontSize: "15px",
                  marginBottom: "4px",
                }}
              >
                {debaterA.profileData?.username}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  marginBottom: "12px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {debaterA.sideDescription}
              </div>

              {/* Percentage */}
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "900",
                  color: "#60a5fa",
                  marginBottom: "4px",
                }}
              >
                {percentageA}%
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  fontWeight: "600",
                }}
              >
                {countA} {countA === 1 ? "vote" : "votes"}
              </div>
            </div>
          </div>
        )}

        {/* Debater B */}
        {debaterB && (
          <div
            onClick={() =>
              !hasVoted && currentUser && !voting && handleVote(debaterB.id)
            }
            style={{
              background: winningB
                ? "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.05) 100%)"
                : "rgba(31, 41, 55, 0.5)",
              border: winningB
                ? "2px solid rgba(239, 68, 68, 0.5)"
                : "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              padding: "20px 16px",
              cursor:
                !hasVoted && currentUser && !voting ? "pointer" : "default",
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              if (!hasVoted && currentUser && !voting) {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.boxShadow =
                  "0 8px 30px rgba(239, 68, 68, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Winning Badge */}
            {winningB && totalVotes > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#fff",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: "800",
                  boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
                }}
              >
                🏆 WINNING
              </div>
            )}

            <div style={{ textAlign: "center" }}>
              <img
                src={
                  debaterB.profileData?.photoURL ||
                  "https://ui-avatars.com/api/?name=User"
                }
                alt={debaterB.profileData?.username}
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  border: "3px solid rgba(239, 68, 68, 0.5)",
                  marginBottom: "12px",
                  boxShadow: "0 4px 15px rgba(239, 68, 68, 0.3)",
                }}
              />
              <div
                style={{
                  fontWeight: "700",
                  color: "#fff",
                  fontSize: "15px",
                  marginBottom: "4px",
                }}
              >
                {debaterB.profileData?.username}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  marginBottom: "12px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {debaterB.sideDescription}
              </div>

              {/* Percentage */}
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "900",
                  color: "#f87171",
                  marginBottom: "4px",
                }}
              >
                {percentageB}%
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  fontWeight: "600",
                }}
              >
                {countB} {countB === 1 ? "vote" : "votes"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Total Votes */}
      <div
        style={{
          marginTop: "16px",
          paddingTop: "16px",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          textAlign: "center",
          color: "#94a3b8",
          fontSize: "13px",
          fontWeight: "600",
        }}
      >
        Total Votes: <span style={{ color: "#fff" }}>{totalVotes}</span>
      </div>
    </div>
  );
};

export default VotingPanel;
