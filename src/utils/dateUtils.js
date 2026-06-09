/**
 * Converts a Firebase Timestamp or Date string into a formatted readable string.
 * Example: "Jun 12, 8:00 PM"
 */
export function formatMatchTime(timestamp) {
  if (!timestamp) return '';
  
  // Handle Firestore Timestamp
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Checks if the kickoff time for a match has already passed.
 * Used to lock prediction submissions.
 */
export function isKickoffPassed(timestamp) {
  if (!timestamp) return true; // Safe default: lock it if no kickoff time is set
  
  const kickoffDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  
  return now >= kickoffDate;
}

/**
 * Formats a relative time or checks days remaining.
 */
export function getDaysRemaining(timestamp) {
  if (!timestamp) return 0;
  
  const kickoffDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  
  const diffTime = kickoffDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}
