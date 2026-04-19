import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { MuddleItem } from '../types';
import { cn } from '../lib/utils';

const CATEGORY_LABELS: Record<string, string> = {
  'handoff-loss': 'Handoff Loss',
  'manual-reporting': 'Manual Reporting',
  'review-bottleneck': 'Review Bottleneck',
  'status-meeting': 'Status Meeting',
  'vendor-exception': 'Vendor Exception',
};

const STATUS_CONFIG = {
  identified: { color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', icon: AlertTriangle },
  'in-progress': { color: 'text-accent-primary bg-accent-primary/10 border-accent-primary/20', icon: Clock },
  resolved: { color: 'text-green-400 bg-green-500/10 border-green-500/20', icon: CheckCircle },
};

interface EngagementCardProps {
  key?: React.Key;
  muddle: MuddleItem;
}

export default function EngagementCard({ muddle }: EngagementCardProps) {
  const statusCfg = STATUS_CONFIG[muddle.status];
  const StatusIcon = statusCfg.icon;

  return (
    <motion.div
      whileHover={{ y: -4, borderColor: 'rgba(129, 140, 248, 0.3)' }}
      className="glass-card rounded-[24px] p-6 flex flex-col gap-4 transition-all group cursor-pointer"
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-accent-primary font-bold mb-1 block">
            {CATEGORY_LABELS[muddle.category] ?? muddle.category}
          </span>
          <h3 className="text-sm font-semibold text-text-main group-hover:text-accent-primary transition-colors leading-snug">
            {muddle.description}
          </h3>
        </div>
        <div className={cn('px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-tight border flex items-center gap-1', statusCfg.color)}>
          <StatusIcon size={10} />
          {muddle.status}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-text-dim/60">
            <AlertTriangle size={12} />
            <span className="text-[10px] uppercase font-bold tracking-wider">Severity</span>
          </div>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-2 h-2 rounded-full',
                  i < muddle.severity ? 'bg-accent-primary' : 'bg-white/10'
                )}
              />
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-text-dim/60">
            <TrendingUp size={12} />
            <span className="text-[10px] uppercase font-bold tracking-wider">Est. Cost</span>
          </div>
          <div className="text-sm font-bold text-red-400/80">${muddle.estimatedCost.toLocaleString()}/mo</div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-text-dim/60">
            <CheckCircle size={12} />
            <span className="text-[10px] uppercase font-bold tracking-wider">Saved</span>
          </div>
          <div className={cn('text-sm font-bold', muddle.actualSavings > 0 ? 'text-green-400' : 'text-text-dim/40')}>
            {muddle.actualSavings > 0 ? `$${muddle.actualSavings.toLocaleString()}/mo` : '--'}
          </div>
        </div>
      </div>

      <div className="pt-2 mt-auto flex justify-end">
        <button className="text-text-dim/40 group-hover:text-text-main transition-colors">
          <ExternalLink size={16} />
        </button>
      </div>
    </motion.div>
  );
}
