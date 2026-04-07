export const formatDate = (value?: string | null) => {
  if (!value) return 'To be announced';

  // Keep date-only values deterministic across server/client time zones.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return new Intl.DateTimeFormat('en-GB', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

export const formatTime = (value?: string | null) => {
  if (!value) return '';

  // Parse PostgreSQL time values like HH:mm or HH:mm:ss into a deterministic 12-hour clock.
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return value;

  const hours24 = Number(match[1]);
  const minutes = match[2];

  if (!Number.isFinite(hours24) || hours24 < 0 || hours24 > 23) {
    return value;
  }

  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes} ${suffix}`;
};

