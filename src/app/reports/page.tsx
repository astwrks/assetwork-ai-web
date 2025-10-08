'use client';

import { useState, useEffect } from 'react';
import ReportLayout from '@/components/layouts/ReportLayout';
import { AIAgent } from '@/types/report.types';

// Mock agent data
const mockAgents: AIAgent[] = [
  {
    id: 'data-agent',
    name: 'Data Agent',
    type: 'data',
    status: 'idle',
    lastActivity: new Date(),
    capabilities: ['Data fetching', 'Data validation', 'Data transformation'],
  },
  {
    id: 'analysis-agent',
    name: 'Analysis Agent',
    type: 'analysis',
    status: 'working',
    lastActivity: new Date(),
    capabilities: ['Financial analysis', 'Risk assessment', 'Trend analysis'],
  },
  {
    id: 'visualization-agent',
    name: 'Visualization Agent',
    type: 'visualization',
    status: 'idle',
    lastActivity: new Date(),
    capabilities: ['Chart generation', 'Interactive visualizations', 'Dashboard creation'],
  },
  {
    id: 'writer-agent',
    name: 'Writer Agent',
    type: 'writer',
    status: 'idle',
    lastActivity: new Date(),
    capabilities: ['Report writing', 'Content generation', 'Narrative creation'],
  },
  {
    id: 'review-agent',
    name: 'Review Agent',
    type: 'review',
    status: 'idle',
    lastActivity: new Date(),
    capabilities: ['Quality assurance', 'Compliance checking', 'Accuracy validation'],
  },
];

export default function ReportsPage() {
  const [agents, setAgents] = useState<AIAgent[]>(mockAgents);

  return (
    <div className="h-screen">
      <ReportLayout 
        reportId="demo-report"
        initialData={undefined}
      />
    </div>
  );
}
