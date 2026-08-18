// /lib/userValidation.ts

/**
 * Validates a username according to the strict system rules:
 * - Username may only contain alphanumeric characters (a-z, A-Z, 0-9) or single hyphens (-)
 * - Cannot begin with a hyphen
 * - Cannot end with a hyphen
 * - Cannot contain consecutive hyphens (e.g. '--')
 * - Must be at least 3 characters and at most 30 characters long
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required.' };
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long.' };
  }

  if (trimmed.length > 30) {
    return { valid: false, error: 'Username cannot exceed 30 characters.' };
  }

  if (trimmed.startsWith('-') || trimmed.endsWith('-')) {
    return { valid: false, error: 'Username cannot begin or end with a hyphen.' };
  }

  if (trimmed.includes('--')) {
    return { valid: false, error: 'Username cannot contain consecutive hyphens.' };
  }

  // Regex enforcing only alphanumeric and non-consecutive hyphens
  const validPattern = /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/;
  if (!validPattern.test(trimmed)) {
    return {
      valid: false,
      error: 'Username may only contain alphanumeric characters or single hyphens.',
    };
  }

  const reservedNames = ['admin', 'official', 'system', 'root', 'api', 'muzikoo', 'guest', 'null', 'undefined'];
  if (reservedNames.includes(trimmed.toLowerCase())) {
    return { valid: false, error: 'This username is reserved.' };
  }

  return { valid: true };
}

/**
 * Sanitizes an arbitrary string (e.g. from email or OAuth metadata) into a valid username
 */
export function sanitizeUsername(raw: string): string {
  if (!raw) return 'listener-1';

  // Replace invalid characters with hyphens
  let clean = raw
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-') // collapse consecutive hyphens
    .replace(/^-+|-+$/g, ''); // strip leading & trailing hyphens

  if (clean.length < 3) {
    clean = (clean + '-user').slice(0, 30);
    clean = clean.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
    if (clean.length < 3) clean = 'user-' + Math.floor(100 + Math.random() * 900);
  }

  if (clean.length > 30) {
    clean = clean.slice(0, 30).replace(/-+$/, '');
  }

  return clean;
}

/**
 * Generates a standard UUID v4 string compatible with Supabase UUID columns
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback below
    }
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
