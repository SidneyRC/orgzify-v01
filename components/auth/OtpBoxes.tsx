"use client";

import { useRef, useState, ClipboardEvent, KeyboardEvent } from "react";

interface OtpBoxesProps {
  length?: number;
  onComplete?: (otp: string) => void;
  onChange?: (otp: string) => void;
  value?: string;
  disabled?: boolean;
}

export default function OtpBoxes({ length = 6, onComplete, onChange, disabled = false }: OtpBoxesProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const focusNext = (index: number) => {
    if (index < length - 1) inputs.current[index + 1]?.focus();
  };

  const focusPrev = (index: number) => {
    if (index > 0) inputs.current[index - 1]?.focus();
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // numbers only
    const newValues = [...values];
    newValues[index] = value.slice(-1); // take last digit only
    setValues(newValues);

if (value) {
      focusNext(index);
      const joined = newValues.join("");
      onChange?.(joined);
      if (index === length - 1 && newValues.every((v) => v !== "")) {
        onComplete?.(joined);
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !values[index]) {
      focusPrev(index);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;

    const newValues = [...values];
    pasted.split("").forEach((char, i) => {
      newValues[i] = char;
    });
    setValues(newValues);

    // Focus last filled box
    const lastIndex = Math.min(pasted.length, length - 1);
    inputs.current[lastIndex]?.focus();

    // Auto submit if fully filled
onChange?.(pasted);
    if (pasted.length === length) {
      onComplete?.(pasted);
    }
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`
            w-10 h-12 sm:w-12 sm:h-14
            text-center text-xl font-bold
            border-2 rounded-lg
            outline-none transition-all duration-200
            ${disabled
              ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
              : val
                ? "border-[#1e3a8a] bg-blue-50 text-[#1e3a8a]"
                : "border-gray-300 bg-white text-gray-800 focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-100"
            }
          `}
        />
      ))}
    </div>
  );
}
