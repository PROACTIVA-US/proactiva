import React, { useState } from 'react';
import { Send, StickyNote } from 'lucide-react';

export default function DirectionInput() {
  const [value, setValue] = useState('');

  return (
    <div className="glass-card rounded-[24px] p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <StickyNote size={14} className="text-accent-primary" />
        <span className="text-[10px] uppercase tracking-widest text-text-dim font-bold">Operator Notes</span>
      </div>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g., 'Client reports front-desk handoff still dropping tickets on weekends. Check if weekend routing agent is active.'"
          className="w-full bg-black/20 border border-glass-border rounded-xl p-4 text-sm text-text-main placeholder:text-text-dim/30 focus:outline-none focus:border-accent-primary/50 transition-colors resize-none h-28 font-sans leading-relaxed"
        />
        <button
          className="absolute bottom-4 right-4 bg-accent-primary hover:bg-accent-secondary text-white p-2.5 rounded-xl shadow-lg shadow-accent-primary/20 transition-all active:scale-95"
          onClick={() => setValue('')}
        >
          <Send size={16} />
        </button>
      </div>
      <div className="flex gap-2 mt-4">
        {['Flag for Review', 'Escalate to Client', 'Add Context'].map((tag) => (
          <button
            key={tag}
            className="text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-full bg-white/5 text-text-dim hover:bg-white/10 hover:text-text-main border border-glass-border transition-colors"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
