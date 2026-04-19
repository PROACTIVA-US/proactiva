import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Cpu, Zap } from 'lucide-react';
interface LogEntry {
  id: string;
  timestamp: string;
  agentName: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}
import { cn } from '../lib/utils';

interface AgentTerminalProps {
  logs: LogEntry[];
}

export default function AgentTerminal({ logs }: AgentTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-card rounded-[24px] overflow-hidden flex flex-col h-full shadow-2xl">
      <div className="bg-white/5 px-6 py-3 border-b border-glass-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-accent-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Proactiva Agent Orchestrator</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
          <span className="text-[9px] font-bold text-green-500/80 uppercase tracking-wider">Live Feed</span>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 p-6 font-mono text-xs overflow-y-auto space-y-3 scrollbar-hide"
      >
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-4 leading-relaxed items-start"
            >
              <div className="w-2 h-2 rounded-full bg-accent-primary shrink-0 mt-1 shadow-[0_0_10px_var(--color-accent-primary)]" />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-accent-primary font-bold">{log.agentName.replace('Henry', 'Proactiva')}</span>
                  <span className="text-text-dim/40 text-[10px]">[{log.timestamp}]</span>
                </div>
                <span className={cn(
                  "break-words",
                  log.type === 'success' && "text-green-400",
                  log.type === 'error' && "text-red-400",
                  log.type === 'warning' && "text-yellow-400",
                  log.type === 'info' && "text-text-main/80"
                )}>
                  {log.message}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-4 bg-white/5 border-t border-glass-border flex items-center gap-6">
        <div className="flex items-center gap-2 text-[10px] text-text-dim font-bold uppercase tracking-wider">
          <Cpu size={12} className="text-accent-primary" />
          <span>CPU: 14%</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-text-dim font-bold uppercase tracking-wider">
          <Zap size={12} className="text-accent-primary" />
          <span>LATENCY: 42ms</span>
        </div>
      </div>
    </div>
  );
}
