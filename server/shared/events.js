const STREAM_ACTIVITY = 'stream:activity';   // inbound user activities
const STREAM_OUTGOING = 'stream:outgoing';   // events for UI (badge awarded, score updated)
const STREAM_DLQ      = 'stream:dead';       // dead-letter

// Types
const EVT_ACTIVITY_COMPLETED = 'activity.completed';
const EVT_BADGE_AWARDED      = 'badge.awarded';
const EVT_XP_UPDATED      = 'xp.updated';

function toEntry(obj) {
  // Flatten to field-value pairs for XADD
  return Object.entries(obj).flat();
}

function fromEntry(fields) {
  // Convert Redis stream entry fields array => object
  const obj = {};
  for (let i = 0; i < fields.length; i += 2) obj[fields[i]] = fields[i + 1];
  // Convert numbers if needed
  if (obj.points) obj.points = Number(obj.points);
  return obj;
}

module.exports = {
  STREAM_ACTIVITY, STREAM_OUTGOING, STREAM_DLQ,
  EVT_ACTIVITY_COMPLETED, EVT_BADGE_AWARDED, EVT_XP_UPDATED,
  toEntry, fromEntry
};
