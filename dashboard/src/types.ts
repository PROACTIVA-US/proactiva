export type EngagementStatus = 'intake' | 'diagnosed' | 'active' | 'verified';

export type MuddleCategory =
  | 'handoff-loss'
  | 'manual-reporting'
  | 'review-bottleneck'
  | 'status-meeting'
  | 'vendor-exception';

export type MuddleStatus = 'identified' | 'in-progress' | 'resolved';

export interface ClientEngagement {
  id: string;
  companyName: string;
  status: EngagementStatus;
  startDate: string;
  monthlySavings: number;
  verifiedSavings: number;
  interventionCount: number;
}

export interface MuddleItem {
  id: string;
  category: MuddleCategory;
  description: string;
  severity: 1 | 2 | 3 | 4 | 5;
  status: MuddleStatus;
  estimatedCost: number;
  actualSavings: number;
}

export interface AgentActivity {
  id: string;
  timestamp: string;
  agentName: string;
  action: string;
  engagementId: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface SavingsMetric {
  month: string;
  projected: number;
  verified: number;
  cumulative: number;
}
