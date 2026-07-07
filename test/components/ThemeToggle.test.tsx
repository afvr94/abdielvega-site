import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '@/components/tv/ThemeToggle';

beforeEach(() => {
  document.documentElement.classList.remove('dark');
  localStorage.clear();
});

describe('ThemeToggle', () => {
  it('starts in light mode and toggles to dark, persisting the choice', async () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-label', 'Switch to dark mode');

    await userEvent.click(btn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(btn).toHaveAttribute('aria-label', 'Switch to light mode');

    await userEvent.click(btn);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('reflects an existing dark class on mount', async () => {
    document.documentElement.classList.add('dark');
    render(<ThemeToggle />);
    expect(await screen.findByLabelText('Switch to light mode')).toBeInTheDocument();
  });
});
