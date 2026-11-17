import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { setServices } = vi.hoisted(() => ({ setServices: vi.fn() }));
vi.mock('@/app/tv/actions', () => ({ setServices }));

import { ServicesPicker } from '@/components/tv/ServicesPicker';

const options = [
  { provider: { id: 8, name: 'Netflix', logoPath: null }, shows: 12 },
  { provider: { id: 15, name: 'Hulu', logoPath: null }, shows: 1 },
];

beforeEach(() => setServices.mockReset());

describe('ServicesPicker', () => {
  it('saves the full selection on each toggle', async () => {
    setServices.mockResolvedValue(undefined);
    render(<ServicesPicker options={options} initial={[8]} />);
    expect(screen.getByRole('button', { name: /netflix/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await userEvent.click(screen.getByRole('button', { name: /hulu/i }));
    expect(setServices).toHaveBeenLastCalledWith([8, 15]);
    await userEvent.click(screen.getByRole('button', { name: /netflix/i }));
    expect(setServices).toHaveBeenLastCalledWith([15]);
  });

  it('rolls back and says so when saving fails', async () => {
    setServices.mockRejectedValueOnce(new Error('down'));
    render(<ServicesPicker options={options} initial={[]} />);
    await userEvent.click(screen.getByRole('button', { name: /hulu/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn.t save/i);
    expect(screen.getByRole('button', { name: /hulu/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('keeps a later toggle when an earlier save fails', async () => {
    let rejectFirst!: (e: Error) => void;
    setServices
      .mockImplementationOnce(() => new Promise((_, reject) => (rejectFirst = reject)))
      .mockResolvedValueOnce(undefined);
    render(<ServicesPicker options={options} initial={[]} />);
    await userEvent.click(screen.getByRole('button', { name: /hulu/i }));
    await userEvent.click(screen.getByRole('button', { name: /netflix/i }));
    rejectFirst(new Error('down'));
    await new Promise((r) => setTimeout(r, 0));
    expect(setServices).toHaveBeenLastCalledWith([15, 8]);
    expect(screen.getByRole('button', { name: /hulu/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /netflix/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
