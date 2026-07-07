import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

import { SurpriseButton } from '@/components/tv/SurpriseButton';

beforeEach(() => vi.clearAllMocks());

describe('SurpriseButton', () => {
  it('renders nothing when there are no shows', () => {
    const { container } = render(<SurpriseButton showIds={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('navigates to one of the provided shows', async () => {
    render(<SurpriseButton showIds={[10, 20, 30]} />);
    await userEvent.click(screen.getByRole('button', { name: /surprise me/i }));
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(expect.stringMatching(/^\/show\/(10|20|30)$/));
  });
});
