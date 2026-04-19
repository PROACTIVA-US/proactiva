import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SavingsMetric } from '../types';

interface SavingsChartProps {
  data: SavingsMetric[];
  totalVerified: number;
  totalProjected: number;
}

export default function SavingsChart({ data, totalVerified, totalProjected }: SavingsChartProps) {
  return (
    <div className="glass-card rounded-[24px] p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-sm font-bold text-text-main uppercase tracking-widest">Cumulative Savings</h2>
          <p className="text-xs text-text-dim mt-1">Projected vs. verified savings over engagement</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-text-main">${totalVerified.toLocaleString()}</div>
          <div className="text-[11px] text-green-400 font-bold uppercase tracking-wider mt-1">
            Verified &middot; ${totalProjected.toLocaleString()} projected
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="rgba(255,255,255,0.2)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="rgba(255,255,255,0.2)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#f8fafc',
              }}
              formatter={(value: number, name: string) => [
                `$${value.toLocaleString()}`,
                name === 'projected' ? 'Projected' : name === 'verified' ? 'Verified' : 'Cumulative',
              ]}
            />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value: string) =>
                value === 'projected' ? 'Projected' : value === 'verified' ? 'Verified' : 'Cumulative'
              }
              wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
            />
            <Area
              type="monotone"
              dataKey="projected"
              stroke="#818cf8"
              fillOpacity={1}
              fill="url(#colorProjected)"
              strokeWidth={2}
              strokeDasharray="6 3"
            />
            <Area
              type="monotone"
              dataKey="verified"
              stroke="#34d399"
              fillOpacity={1}
              fill="url(#colorVerified)"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
