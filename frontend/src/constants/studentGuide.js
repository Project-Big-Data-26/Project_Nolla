export const REGISTER_GUIDE_PENDING_KEY = "nolla:register-guide:pending";

export const studentGuideEnabledKey = (userId) =>
  `nolla:student-guide:enabled:${userId}`;

export const studentGuideCompletedKey = (userId, pageId) =>
  `nolla:student-guide:completed:${userId}:${pageId}`;
