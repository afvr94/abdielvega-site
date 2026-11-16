import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const signInWithOAuth = vi.fn();
vi.mock('@/lib/supabase/client', () => ({ createClient: () => ({ auth: { signInWithOAuth } }) }));

import { LoginForm } from '@/components/budget/LoginForm';

beforeEach(() => signInWithOAuth.mockReset());

describe('LoginForm', () => {
  it('starts Google sign-in that returns to this host’s callback', async () => {
    signInWithOAuth.mockResolvedValue({ error: null });
    render(<LoginForm />);
    await userEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  });

  it('shows the error and re-enables the button when it can’t start', async () => {
    signInWithOAuth.mockResolvedValue({ error: new Error('provider is not enabled') });
    render(<LoginForm />);
    await userEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    expect(await screen.findByText('provider is not enabled')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeEnabled();
  });
});
