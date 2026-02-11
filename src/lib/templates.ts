export interface StageConfig {
  name: string;
  pct: number;
  revisions: number;
  extPct: number;
}

export interface Template {
  id: string;
  name: string;
  emoji: string;
  stages: number;
  typical: number;
  config: StageConfig[];
}

export const TEMPLATES: Template[] = [
  {
    id: 'graphic-brand-design',
    name: 'Graphic & Brand Design',
    emoji: '🎨',
    stages: 4,
    typical: 4000,
    config: [
      { name: 'Discovery & Research', pct: 20, revisions: 2, extPct: 10 },
      { name: 'Concept Development', pct: 40, revisions: 3, extPct: 15 },
      { name: 'Refinement & Guidelines', pct: 30, revisions: 2, extPct: 13 },
      { name: 'Final Delivery', pct: 10, revisions: 1, extPct: 10 }
    ]
  },
  {
    id: 'web-design-development',
    name: 'Web Design & Development',
    emoji: '💻',
    stages: 4,
    typical: 6700,
    config: [
      { name: 'Planning & Design', pct: 25, revisions: 2, extPct: 15 },
      { name: 'Development', pct: 40, revisions: 2, extPct: 13 },
      { name: 'Testing & Refinement', pct: 25, revisions: 2, extPct: 15 },
      { name: 'Launch & Training', pct: 10, revisions: 1, extPct: 10 }
    ]
  },
  {
    id: 'content-creation',
    name: 'Content Creation',
    emoji: '📸',
    stages: 4,
    typical: 3200,
    config: [
      { name: 'Planning & Preparation', pct: 20, revisions: 2, extPct: 12.5 },
      { name: 'Content Production', pct: 40, revisions: 2, extPct: 15 },
      { name: 'Editing & Revisions', pct: 30, revisions: 2, extPct: 15 },
      { name: 'Final Delivery', pct: 10, revisions: 1, extPct: 12.5 }
    ]
  }
];

export function generateShareCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'ST-';
  // First part: 4 characters (human-readable prefix)
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Second part: 12 characters (security suffix)
  code += '-';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
