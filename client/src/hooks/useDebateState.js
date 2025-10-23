import { useState, useEffect } from 'react';
import { subscribeToDebateState, initializeDebateState } from '../services/debateStateService';

/**
 * Custom hook for managing debate state subscription and initialization
 * @param {string} debateId - The debate ID
 * @param {object} participants - The debate participants
 * @param {object} debate - The debate document with settings
 * @returns {object} debateState - The current debate state
 */
export const useDebateState = (debateId, participants, debate) => {
  const [debateState, setDebateState] = useState(null);

  // Subscribe to debate state
  useEffect(() => {
    if (!debateId) return;

    const unsubscribe = subscribeToDebateState(debateId, (state) => {
      setDebateState(state);
    });

    return () => unsubscribe();
  }, [debateId]);

  // Initialize debate state when both debaters join
  useEffect(() => {
    const initDebateStateAsync = async () => {
      if (
        participants.debater_a &&
        participants.debater_b &&
        debate?.settings
      ) {
        try {
          await initializeDebateState(debateId, debate.settings);
        } catch (error) {
          console.error("Error initializing debate state:", error);
        }
      }
    };
    initDebateStateAsync();
  }, [participants.debater_a, participants.debater_b, debate, debateId]);

  return debateState;
};
