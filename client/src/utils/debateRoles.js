import { ROLE_DEBATER_A, ROLE_DEBATER_B, ROLE_MODERATOR, STRUCTURE_MODERATED } from '../constants/videoDebate';

/**
 * Get the role of the current user in the debate
 * @param {Object} participants - Participants object from Firestore
 * @param {Object} currentUser - Current Firebase user
 * @returns {string|null} - Role name or null if not a participant
 */
export const getUserRole = (participants, currentUser) => {
  if (!participants || !currentUser) return null;

  if (participants.debater_a?.userId === currentUser.uid) {
    return ROLE_DEBATER_A;
  }

  if (participants.debater_b?.userId === currentUser.uid) {
    return ROLE_DEBATER_B;
  }

  if (participants.moderator?.userId === currentUser.uid) {
    return ROLE_MODERATOR;
  }

  return null;
};

/**
 * Check if a role is a debater
 * @param {string} role - Role to check
 * @returns {boolean}
 */
export const isDebaterRole = (role) => {
  return role === ROLE_DEBATER_A || role === ROLE_DEBATER_B;
};

/**
 * Check if a role is a moderator
 * @param {string} role - Role to check
 * @returns {boolean}
 */
export const isModeratorRole = (role) => {
  return role === ROLE_MODERATOR;
};

/**
 * Check if the current user is a debater
 * @param {Object} participants - Participants object
 * @param {Object} currentUser - Current Firebase user
 * @returns {boolean}
 */
export const isDebater = (participants, currentUser) => {
  const role = getUserRole(participants, currentUser);
  return isDebaterRole(role);
};

/**
 * Check if the current user is a moderator
 * @param {Object} participants - Participants object
 * @param {Object} currentUser - Current Firebase user
 * @returns {boolean}
 */
export const isModerator = (participants, currentUser) => {
  const role = getUserRole(participants, currentUser);
  return isModeratorRole(role);
};

/**
 * Check if the current user needs video/audio media
 * Debaters and moderators need media, viewers don't
 * @param {Object} participants - Participants object
 * @param {Object} currentUser - Current Firebase user
 * @returns {boolean}
 */
export const needsMedia = (participants, currentUser) => {
  const role = getUserRole(participants, currentUser);
  return isDebaterRole(role) || isModeratorRole(role);
};

/**
 * Check if the current user has moderator controls
 * In moderated debates, only the moderator has controls
 * In self-moderated debates, the host has controls
 * @param {Object} debate - Debate document
 * @param {Object} participants - Participants object
 * @param {Object} currentUser - Current Firebase user
 * @returns {boolean}
 */
export const hasModeratorControls = (debate, participants, currentUser) => {
  if (!debate || !currentUser) return false;

  const role = getUserRole(participants, currentUser);
  const isHost = debate.hostId === currentUser.uid;

  // Moderated debates: only moderator has controls
  if (debate.structure === STRUCTURE_MODERATED) {
    return isModeratorRole(role);
  }

  // Self-moderated or legacy debates: host has controls
  return isHost;
};

/**
 * Check if it's the current user's turn
 * @param {Object} debateState - Current debate state
 * @param {string} myRole - Current user's role
 * @returns {boolean}
 */
export const isMyTurn = (debateState, myRole) => {
  if (!debateState || !myRole) return false;
  return debateState.currentTurn === myRole;
};

/**
 * Get user display information from participants
 * @param {Object} participants - Participants object
 * @param {string} role - Role to get info for
 * @returns {Object|null} - User info or null
 */
export const getParticipantInfo = (participants, role) => {
  if (!participants || !role) return null;
  return participants[role] || null;
};
