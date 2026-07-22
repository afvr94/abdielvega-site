import { describe, it, expect } from 'vitest';
import { looksLikeGibberish, classifyContactSpam, isTrustedOrigin } from '@/lib/portfolio/spam';

describe('looksLikeGibberish', () => {
  it('flags machine-generated random tokens', () => {
    expect(looksLikeGibberish('apYODOABtCGRVhdmDW')).toBe(true);
    expect(looksLikeGibberish('QrMiBRFyMcYBLaxxM')).toBe(true);
  });

  it('passes real names and words', () => {
    expect(looksLikeGibberish('Abdiel Vega')).toBe(false);
    expect(looksLikeGibberish('Alexandria')).toBe(false);
    expect(looksLikeGibberish('John')).toBe(false);
    expect(looksLikeGibberish('María González')).toBe(false);
  });

  it('passes normal sentences', () => {
    expect(looksLikeGibberish('Hi, I loved your portfolio and wanted to connect.')).toBe(false);
    expect(looksLikeGibberish('Can we chat about a project?')).toBe(false);
  });

  it('ignores short strings', () => {
    expect(looksLikeGibberish('xKqZ')).toBe(false);
  });
});

describe('classifyContactSpam', () => {
  const legit = {
    name: 'Abdiel Vega',
    email: 'someone@example.com',
    message: 'Hi, I really enjoyed your work and would love to collaborate.',
  };

  it('returns null for a legitimate submission', () => {
    expect(classifyContactSpam(legit)).toBeNull();
  });

  it('flags a filled honeypot', () => {
    expect(classifyContactSpam({ ...legit, honeypot: 'Acme Inc' })).toBe('honeypot');
  });

  it('flags the gibberish name + message pattern', () => {
    expect(
      classifyContactSpam({
        name: 'apYODOABtCGRVhdmDW',
        email: 'vacad.i.wux.u.b.3.5@gmail.com',
        message: 'QrMiBRFyMcYBLaxxM',
      })
    ).toBe('gibberish');
  });

  it('does not flag a gibberish name with a real message', () => {
    expect(classifyContactSpam({ ...legit, name: 'apYODOABtCGRVhdmDW' })).toBeNull();
  });
});

describe('isTrustedOrigin', () => {
  it('accepts a matching origin/host', () => {
    expect(isTrustedOrigin('https://abdielvega.com', 'abdielvega.com')).toBe(true);
  });

  it('rejects a mismatched origin', () => {
    expect(isTrustedOrigin('https://evil.example', 'abdielvega.com')).toBe(false);
  });

  it('allows a missing origin through to content checks', () => {
    expect(isTrustedOrigin(null, 'abdielvega.com')).toBe(true);
  });

  it('rejects a malformed origin', () => {
    expect(isTrustedOrigin('not-a-url', 'abdielvega.com')).toBe(false);
  });
});
