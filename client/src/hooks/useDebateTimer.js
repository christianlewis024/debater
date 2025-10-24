import { useState, useEffect, useRef } from 'react';
import { switchTurn, updateTimeRemaining } from '../services/debateStateService';

/**
 * Custom hook for managing debate turn timer countdown
 * @param {string} debateId - The debate ID
 * @param {object} debateState - The current debate state
 * @returns {number} timeRemaining - Seconds remaining in current turn
 */
export const useDebateTimer = (debateId, debateState) => {
  const [timeRemaining, setTimeRemaining] = useState(60);
  const timerIntervalRef = useRef(null);
  const lastSyncRef = useRef(null);

  // Update timeRemaining when debate state changes (new turn, debate starts, or time added)
  useEffect(() => {
    if (debateState && debateState.timeRemaining !== undefined) {
      // Only sync if it's a significant change (e.g., turn switch, time added, or fresh load)
      // This prevents fighting with local countdown
      const diff = Math.abs(debateState.timeRemaining - timeRemaining);
      if (diff > 2 || timeRemaining === 60) {
        console.log('⏱️ Syncing timer from database:', debateState.timeRemaining, 'diff:', diff);
        setTimeRemaining(debateState.timeRemaining);
        lastSyncRef.current = debateState.timeRemaining;
      }
    }
  }, [debateState?.turnNumber, debateState?.debateStarted, debateState?.timeRemaining]);

  // Timer countdown
  useEffect(() => {
    if (
      !debateState ||
      !debateState.debateStarted ||
      debateState.debateEnded ||
      debateState.paused
    ) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    // Only start timer if not already running
    if (!timerIntervalRef.current) {
      timerIntervalRef.current = setInterval(async () => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;

          // Update database every 5 seconds to keep it in sync
          if (newTime % 5 === 0 && newTime > 0) {
            updateTimeRemaining(debateId, newTime);
          }

          if (newTime <= 0) {
            switchTurn(debateId, debateState);
            return debateState.turnTime;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [debateState?.debateStarted, debateState?.debateEnded, debateState?.paused, debateId, debateState]);

  return timeRemaining;
};
