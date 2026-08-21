'use client';

import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';

interface SubjectPickerProps {
  value: Id<'subjects'> | null;
  onChange: (id: Id<'subjects'> | null) => void;
}

export default function SubjectPicker({ value, onChange }: SubjectPickerProps) {
  const subjects = useQuery(api.subjects.listMine, {});
  const addSubject = useMutation(api.subjects.add);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const loaded = subjects !== undefined;
  const isEmptyList = loaded && subjects.length === 0;

  const submitDraft = async () => {
    const name = draft.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      const id = await addSubject({ name });
      onChange(id);
      setDraft('');
      setAdding(false);
    } catch {
      // keep input open so the name can be retried
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isEmptyList &&
        subjects.map((s) => (
          <button
            key={s._id}
            type="button"
            onClick={() => onChange(value === s._id ? null : s._id)}
            className={`label-meta cursor-pointer rounded-md border px-3.5 py-1.5 transition-colors duration-200 ${
              value === s._id
                ? 'border-transparent bg-[#E9C468] text-black'
                : 'border-white/[0.08] bg-black text-gray-400 hover:text-white'
            }`}
          >
            {s.name}
          </button>
        ))}

      {isEmptyList || adding ? (
        <input
          autoFocus
          value={draft}
          disabled={busy}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void submitDraft();
            }
            if (e.key === 'Escape') {
              setDraft('');
              setAdding(false);
            }
          }}
          onBlur={() => {
            if (!draft.trim() && !isEmptyList) setAdding(false);
          }}
          placeholder={isEmptyList ? 'Add your first subject' : 'New subject…'}
          aria-label="Subject name"
          className="label-meta w-48 rounded-md border border-white/[0.08] bg-[#0c0f0d] px-3.5 py-1.5 text-gray-200 placeholder:text-gray-600 focus:border-[#E9C468]/60 focus:outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="label-meta cursor-pointer rounded-md border border-dashed border-white/[0.14] px-3.5 py-1.5 text-gray-500 transition-colors duration-200 hover:border-[#E9C468]/50 hover:text-[#E9C468]"
        >
          + Add
        </button>
      )}
    </div>
  );
}
