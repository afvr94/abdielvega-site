import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShowsLibrary } from '@/components/tv/ShowsLibrary';
import { makeLibraryItem, makeShow } from '../factories';

// One of each state. Distinct names so they don't collide with tab labels.
const items = [
  makeLibraryItem({ show: makeShow({ tmdbId: 1, name: 'Alpha' }), airedTotal: 5, airedWatched: 0 }), // not started
  makeLibraryItem({
    show: makeShow({ tmdbId: 2, name: 'Bravo' }),
    airedTotal: 10,
    airedWatched: 3,
  }), // behind
  makeLibraryItem({
    show: makeShow({ tmdbId: 3, name: 'Charlie' }),
    airedTotal: 8,
    airedWatched: 8,
  }), // caught up
  makeLibraryItem({
    show: makeShow({ tmdbId: 4, name: 'Delta', status: 'Ended' }),
    airedTotal: 6,
    airedWatched: 6,
  }), // done (ended) + caught up
  makeLibraryItem({
    show: makeShow({ tmdbId: 5, name: 'Echo' }),
    archived: true,
    airedTotal: 4,
    airedWatched: 2,
  }), // archived
];

function tab(name: RegExp) {
  return screen.getByRole('button', { name });
}

describe('ShowsLibrary', () => {
  it('defaults to the Behind filter', () => {
    render(<ShowsLibrary items={items} />);
    expect(screen.getByText('Bravo')).toBeInTheDocument();
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
    expect(screen.queryByText('Echo')).not.toBeInTheDocument();
  });

  it('shows per-filter counts in the tabs', () => {
    render(<ShowsLibrary items={items} />);
    expect(tab(/^All/)).toHaveTextContent('4'); // non-archived
    expect(tab(/not started/i)).toHaveTextContent('1');
    expect(tab(/^Behind/)).toHaveTextContent('1');
    expect(tab(/caught up/i)).toHaveTextContent('2'); // Charlie + Delta
    expect(tab(/^Done/)).toHaveTextContent('1'); // Delta (Ended)
    expect(tab(/archived/i)).toHaveTextContent('1');
  });

  it('filters to not-started shows', async () => {
    render(<ShowsLibrary items={items} />);
    await userEvent.click(tab(/not started/i));
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Bravo')).not.toBeInTheDocument();
  });

  it('Done shows ended/canceled series regardless of progress', async () => {
    render(<ShowsLibrary items={items} />);
    await userEvent.click(tab(/^Done/));
    expect(screen.getByText('Delta')).toBeInTheDocument();
    expect(screen.queryByText('Bravo')).not.toBeInTheDocument();
  });

  it('Archived shows only archived series', async () => {
    render(<ShowsLibrary items={items} />);
    await userEvent.click(tab(/archived/i));
    expect(screen.getByText('Echo')).toBeInTheDocument();
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
  });

  it('renders a remaining-count badge for behind shows', () => {
    render(<ShowsLibrary items={items} />);
    // Bravo is 3/10 → 7 remaining
    const link = screen.getByText('Bravo').closest('a')!;
    expect(within(link).getByText('7')).toBeInTheDocument();
  });
});
