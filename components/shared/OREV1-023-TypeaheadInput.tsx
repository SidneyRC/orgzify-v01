"use client";
// OREV1-023 — Typeahead Input
// Shows +Add when typed value has no exact match — even if other results are showing

import { useState } from "react";

interface TypeaheadInputProps {
  label:        string;
  placeholder:  string;
  data:         string[];
  value:        string;
  onChange:     (value: string) => void;
  onAddNew?:    (value: string) => void;
  required?:    boolean;
  optional?:    boolean;
  indented?:    boolean;
}

export default function TypeaheadInput({
  label, placeholder, data, value, onChange, onAddNew,
  required, optional, indented,
}: TypeaheadInputProps) {
  const [search, setSearch] = useState(value);
  const [open,   setOpen]   = useState(false);

  const filtered   = data.filter(item => item.toLowerCase().includes(search.toLowerCase()));
  const exactMatch = data.some(item => item.toLowerCase() === search.toLowerCase());
  const showAdd    = search.length > 0 && !exactMatch;

  const handleSelect = (item: string) => {
    setSearch(item);
    onChange(item);
    setOpen(false);
  };

  const handleAddNew = () => {
    onChange(search);
    onAddNew?.(search);
    setOpen(false);
  };

  return (
    <div className={`mb-4 ${indented ? "ml-4 border-l-2 border-blue-100 pl-4" : ""}`}>
      <label className="block text-sm text-gray-600 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {optional && <span className="text-xs text-gray-400 ml-1">optional</span>}
      </label>

      <div className="relative">
        <input
          type="text"
          value={search}
          placeholder={placeholder}
          onChange={(e) => { setSearch(e.target.value); onChange(""); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none bg-white transition-colors ${
            open ? "border-blue-400" : "border-gray-200"
          }`}
        />

        {open && search.length > 0 && (filtered.length > 0 || showAdd) && (
          <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-sm overflow-hidden">
            {filtered.slice(0, 5).map(item => (
              <button key={item} onMouseDown={() => handleSelect(item)}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                {item}
              </button>
            ))}
            {showAdd && (
              <button onMouseDown={handleAddNew}
                className="w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 border-t border-gray-100">
                + Add &quot;{search}&quot;
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
