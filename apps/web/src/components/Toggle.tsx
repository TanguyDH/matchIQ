'use client';

export default function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${
        on ? 'bg-[#10b981]' : 'bg-[#334155]'
      }`}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow transition-transform ${
          on ? 'bg-[#0f172a] translate-x-4' : 'bg-[#64748b] translate-x-0'
        }`}
      />
    </div>
  );
}
