/**
 * Get a user-friendly error message for Agora errors
 * @param {Error} error - The error object from Agora
 * @returns {string} - User-friendly error message
 */
export const getAgoraErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred.';

  // UID Conflict (user already connected from another tab/device)
  if (error.code === 'UID_CONFLICT' || error.message?.toLowerCase().includes('uid_conflict')) {
    return 'You are already connected from another tab or device. Please close other sessions and try again.';
  }

  // Invalid Parameters
  if (error.code === 'INVALID_PARAMS') {
    return 'Invalid connection parameters. Please refresh the page and try again.';
  }

  // Network Errors
  if (error.code === 'NETWORK_ERROR' || error.message?.toLowerCase().includes('network')) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }

  // Permission Denied
  if (error.name === 'NotAllowedError' || error.code === 'PERMISSION_DENIED') {
    return 'Camera/microphone access denied. Please allow permissions in your browser settings and refresh.';
  }

  // Device Not Found
  if (error.name === 'NotFoundError') {
    return 'No camera or microphone found. Please connect a device and try again.';
  }

  // Invalid Operation
  if (error.code === 'INVALID_OPERATION') {
    return 'Unable to connect to video service. Please try again.';
  }

  // Device Not Readable (device in use by another app)
  if (error.name === 'NotReadableError') {
    return 'Camera or microphone is being used by another application. Please close other apps and try again.';
  }

  // Overconstrained (no device matches the constraints)
  if (error.name === 'OverconstrainedError') {
    return 'No device matches the requested settings. Please try different camera/microphone settings.';
  }

  // Default fallback
  return 'Failed to join video room. Please refresh the page and try again.';
};

/**
 * Check if an error should be hidden from the UI (logged only)
 * @param {Error} error - The error object
 * @returns {boolean} - True if error should be hidden from UI
 */
export const shouldHideError = (error) => {
  // Hide UID conflicts from UI (they're expected in some cases)
  return error?.code === 'UID_CONFLICT' || error?.message?.toLowerCase().includes('uid_conflict');
};

/**
 * Get device-specific error messages
 * @param {boolean} hasAudio - Whether audio track was created
 * @param {boolean} hasVideo - Whether video track was created
 * @returns {string|null} - Warning message or null
 */
export const getDeviceWarning = (hasAudio, hasVideo) => {
  if (!hasAudio && !hasVideo) {
    return 'No camera or microphone detected. You can still join, but others won\'t see or hear you.';
  }

  if (!hasVideo) {
    return 'No camera detected. Others will see your profile picture.';
  }

  if (!hasAudio) {
    return 'No microphone detected. Others can see you but not hear you.';
  }

  return null;
};
