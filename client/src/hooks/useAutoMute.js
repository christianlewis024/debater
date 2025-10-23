import { useEffect } from 'react';

/**
 * Custom hook for automatically muting/unmuting debaters based on their turn
 * Moderators and viewers are never auto-muted
 * Respects manual muting - if user manually mutes, don't auto-unmute them
 * @param {object} debateState - The current debate state
 * @param {string} myRole - User's role (debater_a, debater_b, moderator, or null)
 * @param {boolean} isMyTurn - Whether it's the user's turn to speak
 * @param {object} localAudioTrack - Agora local audio track
 * @param {boolean} micMuted - Current mic muted state
 * @param {function} setMicMuted - State setter for mic muted
 * @param {boolean} manuallyMuted - Whether user manually muted themselves
 * @param {function} setManuallyMuted - State setter for manual mute
 */
export const useAutoMute = (
  debateState,
  myRole,
  isMyTurn,
  localAudioTrack,
  micMuted,
  setMicMuted,
  manuallyMuted,
  setManuallyMuted
) => {
  useEffect(() => {
    if (!debateState || !debateState.debateStarted || debateState.debateEnded) {
      return;
    }

    // Only control audio for debaters, not moderators or viewers
    if (myRole === 'debater_a' || myRole === 'debater_b') {
      if (isMyTurn) {
        // It's my turn - unmute only if they weren't manually muted
        if (micMuted && localAudioTrack && !manuallyMuted) {
          localAudioTrack.setEnabled(true);
          setMicMuted(false);
        }
        // If manually muted, respect their choice and don't unmute
      } else {
        // Not my turn - mute (this is automatic, so clear manual flag)
        if (!micMuted && localAudioTrack) {
          localAudioTrack.setEnabled(false);
          setMicMuted(true);
          setManuallyMuted(false); // Clear manual flag when auto-muting
        }
      }
    }
    // Moderators and viewers are never auto-muted - they can speak freely
  }, [debateState?.currentTurn, isMyTurn, myRole, localAudioTrack, micMuted, setMicMuted, manuallyMuted, setManuallyMuted]);
};
