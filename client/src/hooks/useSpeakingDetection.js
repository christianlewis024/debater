import { useState, useEffect, useCallback } from 'react';
import { SPEAKING_THRESHOLD } from '../constants/videoDebate';

/**
 * Custom hook for detecting who is speaking in the debate
 * Uses Agora's volume indicator API
 * @param {Object} client - Agora RTC client
 * @param {Object} debateState - Current debate state
 * @returns {Object} Speaking detection state and utilities
 */
export const useSpeakingDetection = (client, debateState) => {
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [remoteSpeaking, setRemoteSpeaking] = useState({});

  /**
   * Get border style based on speaking state and turn
   * @param {boolean} isSpeaking - Whether the user is speaking
   * @param {boolean} isUserTurn - Whether it's the user's turn
   * @returns {Object} Style object with border and boxShadow
   */
  const getBorderStyle = useCallback((isSpeaking, isUserTurn) => {
    if (isSpeaking && isUserTurn) {
      // Speaking on their turn - green pulsing border with glow
      return {
        border: '3px solid #10b981',
        boxShadow: '0 0 30px rgba(16, 185, 129, 0.6), 0 0 60px rgba(16, 185, 129, 0.3)'
      };
    } else if (isSpeaking && !isUserTurn) {
      // Speaking off turn - yellow/orange border with glow
      return {
        border: '3px solid #fbbf24',
        boxShadow: '0 0 30px rgba(251, 191, 36, 0.6), 0 0 60px rgba(251, 191, 36, 0.3)'
      };
    } else if (isUserTurn) {
      // Their turn but not speaking - blue border
      return {
        border: '3px solid #3b82f6',
        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.5)'
      };
    }

    // Default - subtle border
    return {
      border: '2px solid rgba(100, 116, 139, 0.3)'
    };
  }, []);

  /**
   * Setup volume indicator listener
   */
  useEffect(() => {
    if (!client) return;

    const handleVolumeIndicator = (volumes) => {
      const remoteSpeakingState = {};

      volumes.forEach((volume) => {
        // volume.level ranges from 0 to ~100
        const isSpeaking = volume.level > SPEAKING_THRESHOLD;

        if (volume.uid === 'local') {
          setLocalSpeaking(isSpeaking);
        } else {
          remoteSpeakingState[volume.uid] = isSpeaking;
        }
      });

      setRemoteSpeaking((prev) => ({
        ...prev,
        ...remoteSpeakingState
      }));
    };

    client.on('volume-indicator', handleVolumeIndicator);

    // Enable volume indicator with 300ms interval
    client.enableAudioVolumeIndicator();

    return () => {
      client.off('volume-indicator', handleVolumeIndicator);
    };
  }, [client]);

  return {
    localSpeaking,
    remoteSpeaking,
    getBorderStyle
  };
};
