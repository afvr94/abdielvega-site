import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

import { ForegroundRefresh } from '@/components/tv/ForegroundRefresh';

let visibility: DocumentVisibilityState = 'visible';
function setVisibility(state: DocumentVisibilityState) {
  visibility = state;
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  vi.useFakeTimers();
  refresh.mockClear();
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => visibility,
  });
  visibility = 'visible';
});
afterEach(() => vi.useRealTimers());

describe('ForegroundRefresh', () => {
  it('refreshes when the app returns after five minutes hidden', () => {
    render(<ForegroundRefresh />);
    setVisibility('hidden');
    vi.advanceTimersByTime(5 * 60_000);
    setVisibility('visible');
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('does not refresh after a short trip away', () => {
    render(<ForegroundRefresh />);
    setVisibility('hidden');
    vi.advanceTimersByTime(4 * 60_000);
    setVisibility('visible');
    expect(refresh).not.toHaveBeenCalled();
  });

  it('measures each absence on its own', () => {
    render(<ForegroundRefresh />);
    setVisibility('hidden');
    vi.advanceTimersByTime(6 * 60_000);
    setVisibility('visible');
    vi.advanceTimersByTime(10 * 60_000);
    setVisibility('hidden');
    vi.advanceTimersByTime(60_000);
    setVisibility('visible');
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
