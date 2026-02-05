'use client';

export default function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${on ? 'bg-emerald-600' : 'bg-gray-700'}`}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          on ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </div>
  );
}
