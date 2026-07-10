'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { X, Plus, CheckSquare, Square } from 'lucide-react';
import { CRM_FIELDS } from '@/lib/types';
import type { CrmFieldKey } from '@/lib/types';

interface HeaderSelectorProps {
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

export default function HeaderSelector({ selected, onChange }: HeaderSelectorProps) {
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const allSelected = CRM_FIELDS.every((f) => selected.has(f));

  function toggleAll() {
    if (allSelected) {
      onChange(new Set());
    } else {
      onChange(new Set(CRM_FIELDS));
    }
  }

  function addCustom() {
    const val = inputVal.trim().toLowerCase().replace(/\s+/g, '_');
    if (!val) return;
    onChange(new Set([...selected, val]));
    setInputVal('');
    inputRef.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') addCustom();
  }

  function remove(field: string) {
    const next = new Set(selected);
    next.delete(field);
    onChange(next);
  }

  function toggleField(field: string) {
    const next = new Set(selected);
    if (next.has(field)) {
      next.delete(field);
    } else {
      next.add(field);
    }
    onChange(next);
  }

  return (
    <div className="flex h-full flex-col border border-zinc-800 bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-wide text-zinc-500">
          Output Fields
        </span>
        <button
          onClick={toggleAll}
          title={allSelected ? 'Deselect all' : 'Select all'}
          className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-zinc-500 transition hover:text-accent"
        >
          {allSelected ? <CheckSquare size={12} /> : <Square size={12} />}
          {allSelected ? 'All' : 'None'}
        </button>
      </div>

      {/* CRM Fields checklist */}
      <div className="flex-1 overflow-y-auto p-2">
        <p className="mb-1.5 px-1 font-mono text-[9px] uppercase tracking-wider text-zinc-700">
          CRM Fields
        </p>
        <div className="space-y-0.5">
          {CRM_FIELDS.map((field) => (
            <button
              key={field}
              onClick={() => toggleField(field)}
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors ${
                selected.has(field)
                  ? 'bg-accent/10 text-accent'
                  : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <span className="shrink-0">
                {selected.has(field) ? (
                  <CheckSquare size={11} />
                ) : (
                  <Square size={11} />
                )}
              </span>
              <span className="truncate font-mono text-[10px]">{field}</span>
            </button>
          ))}
        </div>

        {/* Custom fields chips */}
        {[...selected].filter((f) => !(CRM_FIELDS as readonly string[]).includes(f)).length > 0 && (
          <>
            <p className="mb-1.5 mt-3 px-1 font-mono text-[9px] uppercase tracking-wider text-zinc-700">
              Custom
            </p>
            <div className="flex flex-wrap gap-1 px-1">
              {[...selected]
                .filter((f) => !(CRM_FIELDS as readonly string[]).includes(f))
                .map((f) => (
                  <span
                    key={f}
                    className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[9px] text-accent"
                  >
                    {f}
                    <button
                      onClick={() => remove(f)}
                      className="ml-0.5 rounded-full transition hover:text-bad"
                    >
                      <X size={9} />
                    </button>
                  </span>
                ))}
            </div>
          </>
        )}
      </div>

      {/* Add custom field input */}
      <div className="border-t border-zinc-800 p-2">
        <div className="flex gap-1">
          <input
            ref={inputRef}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="custom_field…"
            className="min-w-0 flex-1 border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-[10px] text-zinc-300 placeholder-zinc-700 outline-none focus:border-accent"
          />
          <button
            onClick={addCustom}
            disabled={!inputVal.trim()}
            className="flex items-center gap-1 border border-accent bg-accent px-2 py-1.5 font-mono text-[10px] text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={11} />
          </button>
        </div>
        <p className="mt-1.5 font-mono text-[9px] text-zinc-700">
          {selected.size} field{selected.size !== 1 ? 's' : ''} selected
        </p>
      </div>
    </div>
  );
}
