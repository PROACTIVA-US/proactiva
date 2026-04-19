import React, { useState, useEffect } from 'react';
import Sidebar, { NavTab } from './components/Sidebar';
import EngagementCard from './components/EngagementCard';
import AgentTerminal from './components/AgentTerminal';
import SavingsChart from './components/SavingsChart';
import DirectionInput from './components/DirectionInput';
import { ClientEngagement, MuddleItem, AgentActivity, SavingsMetric } from './types';
import { Cpu, Building2, Calendar, CheckCircle, TrendingUp, AlertTriangle, FileBarChart } from 'lucide-react';

// --- Mock Data: Pacific Ridge Property Management ---

const ENGAGEMENT: ClientEngagement = {
  id: 'eng-001',
  companyName: 'Pacific Ridge Property Management',
  status: 'active',
  startDate: '2026-01-15',
  monthlySavings: 4200,
  verifiedSavings: 12600,
  interventionCount: 3,
};

const MUDDLE_ITEMS: MuddleItem[] = [
  {
    id: 'm-1',
    category: 'status-meeting',
    description: 'Weekly all-hands status meetings consuming 6+ hrs/wk across 3 teams with no actionable outcomes',
    severity: 4,
    status: 'in-progress',
    estimatedCost: 2800,
    actualSavings: 1400,
  },
  {
    id: 'm-2',
    category: 'handoff-loss',
    description: 'Maintenance requests lost in handoff between front desk and field crews, avg 12 dropped/month',
    severity: 5,
    status: 'in-progress',
    estimatedCost: 3200,
    actualSavings: 1800,
  },
  {
    id: 'm-3',
    category: 'vendor-exception',
    description: 'Duplicate vendor invoice processing due to manual entry across two disconnected systems',
    severity: 3,
    status: 'resolved',
    estimatedCost: 1800,
    actualSavings: 1000,
  },
];

const SAVINGS_DATA: SavingsMetric[] = [
  { month: 'Jan', projected: 0, verified: 0, cumulative: 0 },
  { month: 'Feb', projected: 2400, verified: 1800, cumulative: 1800 },
  { month: 'Mar', projected: 6200, verified: 4200, cumulative: 6000 },
  { month: 'Apr', projected: 10800, verified: 8400, cumulative: 12600 },
  { month: 'May', projected: 16000, verified: 0, cumulative: 12600 },
  { month: 'Jun', projected: 21600, verified: 0, cumulative: 12600 },
];

const INITIAL_LOGS: AgentActivity[] = [
  { id: '1', timestamp: '09:01:12', agentName: 'Proactiva-Core', action: 'Engagement eng-001 loaded. Status: active.', engagementId: 'eng-001', type: 'info' },
  { id: '2', timestamp: '09:01:18', agentName: 'Handoff-Monitor', action: 'Scanning front-desk ticket queue for dropped handoffs...', engagementId: 'eng-001', type: 'info' },
  { id: '3', timestamp: '09:02:05', agentName: 'Handoff-Monitor', action: 'Zero dropped tickets in last 48h. Routing agent performing well.', engagementId: 'eng-001', type: 'success' },
  { id: '4', timestamp: '09:03:44', agentName: 'Invoice-Dedup', action: 'Flagged 2 potential duplicate invoices from vendor Apex HVAC for review.', engagementId: 'eng-001', type: 'warning' },
  { id: '5', timestamp: '09:05:01', agentName: 'Meeting-Optimizer', action: 'Generated async status digest for Week 15. Distributed to 3 teams.', engagementId: 'eng-001', type: 'success' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [logs, setLogs] = useState<AgentActivity[]>(INITIAL_LOGS);

  useEffect(() => {
    const messages = [
      { name: 'Handoff-Monitor', msg: 'Checking maintenance request pipeline... 0 in limbo.', type: 'info' as const },
      { name: 'Invoice-Dedup', msg: 'Reconciled 14 invoices against PO records. All clear.', type: 'success' as const },
      { name: 'Meeting-Optimizer', msg: 'Detected calendar conflict: two status syncs overlap Thursday PM.', type: 'warning' as const },
      { name: 'Proactiva-Core', msg: 'Monthly savings snapshot: $4,200 verified for April.', type: 'success' as const },
      { name: 'Handoff-Monitor', msg: 'New maintenance request routed: Unit 4B HVAC inspection.', type: 'info' as const },
    ];

    const interval = setInterval(() => {
      const pick = messages[Math.floor(Math.random() * messages.length)];
      setLogs((prev) => [
        ...prev.slice(-49),
        {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString([], { hour12: false }),
          agentName: pick.name,
          action: pick.msg,
          engagementId: 'eng-001',
          type: pick.type,
        },
      ]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const totalVerified = SAVINGS_DATA.reduce((sum, d) => sum + d.verified, 0);
  const totalProjected = SAVINGS_DATA[SAVINGS_DATA.length - 1].projected;

  return (
    <div className="flex min-h-screen bg-transparent text-text-main font-sans selection:bg-accent-primary/30">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 flex flex-col min-w-0 p-[30px] gap-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-text-main">{ENGAGEMENT.companyName}</h1>
            <p className="text-xs text-text-dim mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold uppercase tracking-tight">
                <CheckCircle size={10} /> {ENGAGEMENT.status}
              </span>
              <span>Since {new Date(ENGAGEMENT.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-text-dim">
                Engagement <strong className="text-text-main">#{ENGAGEMENT.id.slice(-3)}</strong>
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary border border-white/20 shadow-lg" />
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-hide">
          {activeTab === 'overview' && <OverviewTab logs={logs} savingsData={SAVINGS_DATA} totalVerified={totalVerified} totalProjected={totalProjected} />}
          {activeTab === 'engagements' && <EngagementsTab />}
          {activeTab === 'muddle-map' && <MuddleMapTab />}
          {activeTab === 'savings' && <SavingsTab savingsData={SAVINGS_DATA} totalVerified={totalVerified} totalProjected={totalProjected} />}
          {activeTab === 'reports' && <ReportsTab />}
        </div>
      </main>
    </div>
  );
}

// --- Tab Views ---

function OverviewTab({ logs, savingsData, totalVerified, totalProjected }: { logs: AgentActivity[]; savingsData: SavingsMetric[]; totalVerified: number; totalProjected: number }) {
  return (
    <>
      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Monthly Savings" value={`$${ENGAGEMENT.monthlySavings.toLocaleString()}`} sub="Verified this month" color="text-green-400" />
        <StatCard icon={CheckCircle} label="Total Verified" value={`$${ENGAGEMENT.verifiedSavings.toLocaleString()}`} sub="Since engagement start" color="text-accent-primary" />
        <StatCard icon={AlertTriangle} label="Muddle Items" value={`${MUDDLE_ITEMS.length}`} sub={`${MUDDLE_ITEMS.filter((m) => m.status === 'resolved').length} resolved`} color="text-yellow-400" />
        <StatCard icon={Cpu} label="Active Agents" value="3" sub="Monitoring continuously" color="text-accent-secondary" />
      </div>

      {/* Chart + notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[400px]">
          <SavingsChart data={savingsData} totalVerified={totalVerified} totalProjected={totalProjected} />
        </div>
        <div className="space-y-6 flex flex-col">
          <DirectionInput />
          <div className="flex-1 glass-card rounded-[24px] p-6 flex flex-col justify-center items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center border border-accent-primary/20">
              <Building2 size={24} className="text-accent-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-main uppercase tracking-widest">Engagement Health</h3>
              <p className="text-xs text-text-dim mt-1">All interventions running normally</p>
            </div>
            <div className="w-full grid grid-cols-2 gap-4 pt-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="text-lg font-bold text-text-main">3</div>
                <div className="text-[9px] text-text-dim uppercase tracking-widest">Interventions</div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="text-lg font-bold text-text-main">99.8%</div>
                <div className="text-[9px] text-text-dim uppercase tracking-widest">Agent Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Muddle items */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-main tracking-tight flex items-center gap-2">
            Identified Muddle
            <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded text-text-dim border border-white/5">
              {String(MUDDLE_ITEMS.length).padStart(2, '0')}
            </span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {MUDDLE_ITEMS.map((m) => (
            <EngagementCard key={m.id} muddle={m} />
          ))}
        </div>
      </section>

      {/* Agent terminal */}
      <section className="h-[400px] mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-main tracking-tight flex items-center gap-2">
            Agent Activity
            <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded text-text-dim border border-white/5">Live</span>
          </h2>
        </div>
        <AgentTerminal logs={logs.map((l) => ({ id: l.id, timestamp: l.timestamp, agentName: l.agentName, message: l.action, type: l.type }))} />
      </section>
    </>
  );
}

function EngagementsTab() {
  return (
    <div className="glass-card rounded-[24px] p-8">
      <div className="flex items-center gap-3 mb-6">
        <Building2 size={20} className="text-accent-primary" />
        <h2 className="text-lg font-semibold text-text-main">Engagement Details</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DetailRow label="Company" value={ENGAGEMENT.companyName} />
        <DetailRow label="Status" value={ENGAGEMENT.status.charAt(0).toUpperCase() + ENGAGEMENT.status.slice(1)} />
        <DetailRow label="Start Date" value={new Date(ENGAGEMENT.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
        <DetailRow label="Interventions" value={String(ENGAGEMENT.interventionCount)} />
        <DetailRow label="Monthly Savings" value={`$${ENGAGEMENT.monthlySavings.toLocaleString()}`} />
        <DetailRow label="Total Verified Savings" value={`$${ENGAGEMENT.verifiedSavings.toLocaleString()}`} />
      </div>
      <div className="mt-8 pt-6 border-t border-glass-border">
        <h3 className="text-sm font-bold text-text-dim uppercase tracking-widest mb-4">Workflow</h3>
        <div className="flex items-center gap-2">
          {['Intake', 'Diagnose', 'Deploy Agents', 'Track Savings', 'Verify'].map((step, i) => {
            const done = i < 3;
            const current = i === 3;
            return (
              <React.Fragment key={step}>
                <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border ${current ? 'bg-accent-primary/20 text-accent-primary border-accent-primary/30' : done ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-text-dim border-glass-border'}`}>
                  {step}
                </div>
                {i < 4 && <div className={`w-6 h-px ${done ? 'bg-green-400/40' : 'bg-white/10'}`} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MuddleMapTab() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-main">Muddle Map</h2>
        <div className="flex items-center gap-4 text-xs text-text-dim">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Identified</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-primary" /> In Progress</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" /> Resolved</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {MUDDLE_ITEMS.map((m) => (
          <EngagementCard key={m.id} muddle={m} />
        ))}
      </div>
      <div className="glass-card rounded-[24px] p-6">
        <h3 className="text-sm font-bold text-text-dim uppercase tracking-widest mb-4">Impact Summary</h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-2xl font-bold text-red-400/80">${MUDDLE_ITEMS.reduce((s, m) => s + m.estimatedCost, 0).toLocaleString()}/mo</div>
            <div className="text-[10px] text-text-dim uppercase tracking-widest mt-1">Total Estimated Waste</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">${MUDDLE_ITEMS.reduce((s, m) => s + m.actualSavings, 0).toLocaleString()}/mo</div>
            <div className="text-[10px] text-text-dim uppercase tracking-widest mt-1">Currently Saving</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-accent-primary">{Math.round((MUDDLE_ITEMS.reduce((s, m) => s + m.actualSavings, 0) / MUDDLE_ITEMS.reduce((s, m) => s + m.estimatedCost, 0)) * 100)}%</div>
            <div className="text-[10px] text-text-dim uppercase tracking-widest mt-1">Recovery Rate</div>
          </div>
        </div>
      </div>
    </>
  );
}

function SavingsTab({ savingsData, totalVerified, totalProjected }: { savingsData: SavingsMetric[]; totalVerified: number; totalProjected: number }) {
  return (
    <>
      <div className="h-[450px]">
        <SavingsChart data={savingsData} totalVerified={totalVerified} totalProjected={totalProjected} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-[24px] p-6 text-center">
          <div className="text-3xl font-bold text-green-400">${totalVerified.toLocaleString()}</div>
          <div className="text-[10px] text-text-dim uppercase tracking-widest mt-2">Total Verified</div>
        </div>
        <div className="glass-card rounded-[24px] p-6 text-center">
          <div className="text-3xl font-bold text-accent-primary">${totalProjected.toLocaleString()}</div>
          <div className="text-[10px] text-text-dim uppercase tracking-widest mt-2">6-Month Projection</div>
        </div>
        <div className="glass-card rounded-[24px] p-6 text-center">
          <div className="text-3xl font-bold text-text-main">${ENGAGEMENT.monthlySavings.toLocaleString()}</div>
          <div className="text-[10px] text-text-dim uppercase tracking-widest mt-2">Current Monthly Rate</div>
        </div>
      </div>
    </>
  );
}

function ReportsTab() {
  return (
    <div className="glass-card rounded-[24px] p-8">
      <div className="flex items-center gap-3 mb-6">
        <FileBarChart size={20} className="text-accent-primary" />
        <h2 className="text-lg font-semibold text-text-main">Monthly Verification Reports</h2>
      </div>
      <div className="space-y-4">
        {[
          { month: 'March 2026', savings: 4200, status: 'Verified' },
          { month: 'February 2026', savings: 2400, status: 'Verified' },
          { month: 'January 2026', savings: 0, status: 'Intake Period' },
        ].map((r) => (
          <div key={r.month} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-glass-border">
            <div className="flex items-center gap-4">
              <Calendar size={16} className="text-text-dim" />
              <div>
                <div className="text-sm font-semibold text-text-main">{r.month}</div>
                <div className="text-[10px] text-text-dim uppercase tracking-widest">{r.status}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-green-400">{r.savings > 0 ? `$${r.savings.toLocaleString()}` : '--'}</div>
              <div className="text-[10px] text-text-dim">Verified savings</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Shared small components ---

function StatCard({ icon: Icon, label, value, sub, color }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="glass-card rounded-[24px] p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5`}>
        <Icon size={18} className={color} />
      </div>
      <div>
        <div className="text-lg font-bold text-text-main">{value}</div>
        <div className="text-[10px] text-text-dim uppercase tracking-widest">{label}</div>
        <div className="text-[10px] text-text-dim mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-white/5 rounded-xl border border-glass-border">
      <div className="text-[10px] text-text-dim uppercase tracking-widest mb-1">{label}</div>
      <div className="text-sm font-semibold text-text-main">{value}</div>
    </div>
  );
}

// Re-export engagement constant for tab components
const ENGAGEMENT_CONST = ENGAGEMENT;
