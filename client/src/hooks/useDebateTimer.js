import { useState, useEffect, useRef } from 'react';
import { switchTurn } from '../services/debateStateService';

/**
 * Custom hook for managing debate turn timer countdown
 * @param {string} debateId - The debate ID
 * @param {object} debateState - The current debate state
 * @returns {number} timeRemaining - Seconds remaining in current turn
 */
export const useDebateTimer = (debateId, debateState) => {
  const [timeRemaining, setTimeRemaining] = useState(60);
  const timerIntervalRef = useRef(null);

  // Update timeRemaining when debate state changes (new turn or debate starts)
  useEffect(() => {
    if (debateState && debateState.timeRemaining &&
        debateState.timeRemaining !== timeRemaining) {
      setTimeRemaining(debateState.timeRemaining);
    }
  }, [debateState?.turnNumber, debateState?.debateStarted]);

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
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
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
