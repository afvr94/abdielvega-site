import '@testing-library/jest-dom/vitest';
import React from 'react';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => cleanup());

// jsdom has no matchMedia (ThemeToggle / theme detection)
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Lightweight stand-ins for Next primitives so components render in jsdom.
vi.mock('next/image', () => ({
  default: ({ src, alt, fill, priority, sizes, ...rest }: Record<string, unknown>) =>
    React.createElement('img', { src: typeof src === 'string' ? src : '', alt, ...rest }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: Record<string, unknown>) =>
    React.createElement('a', { href, ...rest }, children as React.ReactNode),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));
