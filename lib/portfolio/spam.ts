// Lightweight, dependency-free spam heuristics for the contact form.
//
// The form gets hit by bots that submit random-token gibberish (e.g. a name of
// "apYODOABtCGRVhdmDW" and a message of "QrMiBRFyMcYBLaxxM"). These helpers
// catch that pattern without a CAPTCHA or any third-party service.

/**
 * True when a string looks like a machine-generated random token: a single
 * long alphanumeric blob with an unnaturally low vowel ratio or erratic case
 * flipping. Deliberately conservative — real words and names should not trip.
 */
export function looksLikeGibberish(input: string): boolean {
  const value = input.trim();
  if (value.length < 10) return false;
  // Real messages have spaces/punctuation; random tokens are one alnum blob.
  if (!/^[A-Za-z0-9]+$/.test(value)) return false;

  const letters = value.replace(/[^A-Za-z]/g, '');
  if (letters.length < 8) return false;

  const vowels = (letters.match(/[aeiouAEIOU]/g) || []).length;
  const vowelRatio = vowels / letters.length;

  let caseTransitions = 0;
  const isUpper = (ch: string) => ch >= 'A' && ch <= 'Z';
  for (let i = 1; i < letters.length; i++) {
    if (isUpper(letters.charAt(i - 1)) !== isUpper(letters.charAt(i))) {
      caseTransitions++;
    }
  }
  const caseTransitionRatio = caseTransitions / letters.length;

  // Natural language sits around a 0.35–0.45 vowel ratio with few case flips.
  return vowelRatio < 0.28 || caseTransitionRatio > 0.4;
}

export type ContactSubmission = {
  name: string;
  email: string;
  message: string;
  /** Hidden honeypot field. Non-empty means a bot filled it. */
  honeypot?: string;
};

/**
 * Classify a contact submission as spam. Returns a reason for logging when it
 * trips, or null when the message looks legitimate.
 */
export function classifyContactSpam(sub: ContactSubmission): string | null {
  if (sub.honeypot && sub.honeypot.trim().length > 0) {
    return 'honeypot';
  }
  // Require BOTH name and message to look machine-generated to keep false
  // positives near zero — a real person won't have a random-blob name AND body.
  if (looksLikeGibberish(sub.name) && looksLikeGibberish(sub.message)) {
    return 'gibberish';
  }
  return null;
}

/**
 * True when the request's Origin header matches the host it was sent to. Bots
 * that POST straight to the API from elsewhere fail this. Requests with no
 * Origin header (some non-browser clients) are allowed through so the content
 * heuristics can still judge them.
 */
export function isTrustedOrigin(origin: string | null, host: string | null): boolean {
  if (!origin) return true;
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
