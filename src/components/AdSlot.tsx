import React from 'react';

interface AdSlotProps {
  variant: 'header' | 'in-content' | 'sidebar';
  label?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({ variant, label }) => {
  const dimensions =
    variant === 'header'
      ? 'min-h-[90px] w-full max-w-[728px] mx-auto'
      : variant === 'sidebar'
      ? 'min-h-[280px] w-full'
      : 'min-h-[120px] w-full';

  return (
    <aside
      aria-label="Advertisement"
      className={`rounded-xl border border-slate-800/80 bg-slate-900/50 px-4 py-3 flex flex-col items-center justify-center text-center ${dimensions}`}
    >
      <span className="text-[11px] tracking-widest uppercase text-slate-500 font-medium mb-1">
        {label || 'Advertisement'}
      </span>
      <p className="text-xs text-slate-400 max-w-md">
        {variant === 'header'
          ? 'Google AdSense Responsive Display Slot (728 × 90 Leaderboard)'
          : variant === 'sidebar'
          ? 'Google AdSense Sidebar Slot (300 × 250 / 300 × 600)'
          : 'Google AdSense In-Article Native Slot (Fluid Responsive)'}
      </p>
    </aside>
  );
};
