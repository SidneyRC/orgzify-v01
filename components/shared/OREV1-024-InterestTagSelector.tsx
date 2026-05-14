"use client";

const INTERESTS = [
  "Football", "Athletics", "Chess", "Swimming", "Cricket", "Badminton",
  "Tennis", "Music", "Dance", "Yoga", "Cycling", "Basketball",
  "Volleyball", "Table Tennis", "Martial Arts",
];

interface InterestTagSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function InterestTagSelector({ selected, onChange }: InterestTagSelectorProps) {
  const toggle = (item: string) => {
    onChange(
      selected.includes(item)
        ? selected.filter((i) => i !== item)
        : [...selected, item]
    );
  };

  return (
    <div className="mb-4">
      <label className="block text-sm text-gray-600 mb-2">
        Area of Interest <span className="text-red-500">*</span>{" "}
        <span className="text-xs text-gray-400">{selected.length}/{INTERESTS.length} selected</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {INTERESTS.map((item) => (
          <button
            key={item}
            onClick={() => toggle(item)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              selected.includes(item)
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
