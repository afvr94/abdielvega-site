'use client';

import { useState, useTransition } from 'react';
import { Plus, Check, Tag } from 'lucide-react';
import type { TvList } from '@/lib/tv/types';
import { addShowToList, removeShowFromList, createList } from '@/app/tv/actions';

export function ListPicker({
  tmdbId,
  allLists,
  initialListIds,
}: {
  tmdbId: number;
  allLists: TvList[];
  initialListIds: number[];
}) {
  const [lists, setLists] = useState<TvList[]>(allLists);
  const [memberIds, setMemberIds] = useState<Set<number>>(() => new Set(initialListIds));
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [, startTransition] = useTransition();

  function toggle(listId: number) {
    const isMember = memberIds.has(listId);
    setMemberIds((prev) => {
      const c = new Set(prev);
      if (isMember) c.delete(listId);
      else c.add(listId);
      return c;
    });
    startTransition(async () => {
      if (isMember) await removeShowFromList(listId, tmdbId);
      else await addShowToList(listId, tmdbId);
    });
  }

  function create() {
    const name = newName.trim();
    if (!name) return;
    setNewName('');
    startTransition(async () => {
      const id = await createList(name);
      if (id != null) {
        await addShowToList(id, tmdbId);
        setLists((prev) => [...prev, { id, name }].sort((a, b) => a.name.localeCompare(b.name)));
        setMemberIds((prev) => new Set(prev).add(id));
      }
    });
  }

  const memberLists = lists.filter((l) => memberIds.has(l.id));

  return (
    <div className="mb-6">
      <div className="label-tag mb-2">Lists</div>
      <div className="flex flex-wrap items-center gap-2">
        {memberLists.map((l) => (
          <span
            key={l.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-savings px-2.5 py-1 text-xs font-medium text-white"
          >
            <Tag size={11} strokeWidth={2.4} />
            {l.name}
          </span>
        ))}

        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-card px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:text-ink"
          >
            <Plus size={13} strokeWidth={2.4} /> Add to list
          </button>

          {open ? (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute left-0 z-20 mt-1.5 w-56 overflow-hidden rounded-card border border-hairline bg-card shadow-lg">
                <div className="max-h-56 overflow-y-auto py-1">
                  {lists.map((l) => {
                    const member = memberIds.has(l.id);
                    return (
                      <button
                        key={l.id}
                        onClick={() => toggle(l.id)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-ink/5"
                      >
                        {l.name}
                        {member ? (
                          <Check size={15} strokeWidth={2.4} className="text-savings" />
                        ) : null}
                      </button>
                    );
                  })}
                  {lists.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted">No lists yet.</div>
                  ) : null}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    create();
                  }}
                  className="flex items-center gap-1 border-t border-hairline p-1.5"
                >
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="New list…"
                    className="min-w-0 flex-1 bg-transparent px-2 py-1 text-sm focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newName.trim()}
                    className="rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-cream disabled:opacity-40"
                  >
                    Add
                  </button>
                </form>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
