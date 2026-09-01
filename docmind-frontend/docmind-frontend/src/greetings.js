// A pool of phrasings per time-of-day, so the dashboard doesn't say the
// exact same "Good morning, Aman" every single time it loads.

const MORNING = [
  (n) => `Good morning, ${n}`,
  (n) => `Rise and shine, ${n}`,
  (n) => `Morning, ${n}`,
  (n) => `Hey ${n}, ready to start the day?`,
  (n) => `Good morning, ${n} — let's get organized`,
];

const AFTERNOON = [
  (n) => `Good afternoon, ${n}`,
  (n) => `Hey ${n}, hope your day's going well`,
  (n) => `Afternoon, ${n}`,
  (n) => `Welcome back, ${n}`,
  (n) => `Good afternoon, ${n} — let's see what's new`,
];

const EVENING = [
  (n) => `Good evening, ${n}`,
  (n) => `Evening, ${n}`,
  (n) => `Hey ${n}, winding down for the day?`,
  (n) => `Welcome back, ${n}`,
];

const NIGHT = [
  (n) => `Working late, ${n}?`,
  (n) => `Burning the midnight oil, ${n}`,
  (n) => `Hey ${n}, up late tonight`,
  (n) => `Good to see you, ${n}`,
];

const EMOJI_BY_BUCKET = {
  morning: ["👋", "☀️", "✨"],
  afternoon: ["👋", "🌤️", "📄"],
  evening: ["👋", "🌆"],
  night: ["🌙", "✨"],
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getBucket(hour) {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

const TEMPLATES = { morning: MORNING, afternoon: AFTERNOON, evening: EVENING, night: NIGHT };

/**
 * Returns a greeting string like "Rise and shine, Aman ☀️", varied by both
 * the actual local time of day and a random phrasing within that bucket.
 * Call once per page load (e.g. via useMemo) rather than on every render,
 * so it doesn't change mid-visit.
 */
export function getTimeBasedGreeting(name) {
  const bucket = getBucket(new Date().getHours());
  const template = pick(TEMPLATES[bucket]);
  const emoji = pick(EMOJI_BY_BUCKET[bucket]);
  return `${template(name)} ${emoji}`;
}
