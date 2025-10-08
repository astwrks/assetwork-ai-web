'use client';

import { useState, useEffect } from 'react';
import { AIAgent } from '@/types/report.types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Activity,
  Database,
  BarChart3,
  FileText,
  Shield
} from 'lucide-react';

interface AgentStatusPanelProps {
  agents: AIAgent[];
  onAgentUpdate: (agents: AIAgent[]) => void;
}

const agentTypes = {
  data: { name: 'Data Agent', icon: Database, color: 'text-green-600' },
  analysis: { name: 'Analysis Agent', icon: BarChart3, color: 'text-blue-600' },
  visualization: { name: 'Visualization Agent', icon: BarChart3, color: 'text-purple-600' },
  writer: { name: 'Writer Agent', icon: FileText, color: 'text-orange-600' },
  review: { name: 'Review Agent', icon: Shield, color: 'text-red-600' },
};

export default function AgentStatusPanel({ agents, onAgentUpdate }: AgentStatusPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Simulate agent status updates
  useEffect(() => {
    const interval = setInterval(() => {
      const updatedAgents = agents.map(agent => {
        if (agent.status === 'working') {
          // Randomly change status
          const statuses: AIAgent['status'][] = ['idle', 'working', 'error'];
          const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
          return { ...agent, status: newStatus, lastActivity: new Date() };
        }
        return agent;
      });
      onAgentUpdate(updatedAgents);
    }, 5000);

    return () => clearInterval(interval);
  }, [agents, onAgentUpdate]);

  const getStatusIcon = (status: AIAgent['status']) => {
    switch (status) {
      case 'idle':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'working':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: AIAgent['status']) => {
    switch (status) {
      case 'idle':
        return 'Ready';
      case 'working':
        return 'Processing';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: AIAgent['status']) => {
    switch (status) {
      case 'idle':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'working':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              AI Agents Status
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 px-2"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>

        {isExpanded ? (
          <div className="space-y-3">
            {agents.map((agent) => {
              const agentType = agentTypes[agent.type];
              const Icon = agentType.icon;
              
              return (
                <Card key={agent.id} className="p-3">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-4 w-4 ${agentType.color}`} />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {agent.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {agent.capabilities.join(', ')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(agent.status)}
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(agent.status)}`}>
                          {getStatusText(agent.status)}
                        </span>
                      </div>
                    </div>
                    
                    {agent.lastActivity && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Last activity: {agent.lastActivity.toLocaleTimeString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            {agents.map((agent) => {
              const agentType = agentTypes[agent.type];
              const Icon = agentType.icon;
              
              return (
                <div key={agent.id} className="flex items-center space-x-2">
                  <Icon className={`h-4 w-4 ${agentType.color}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {agent.name}
                  </span>
                  {getStatusIcon(agent.status)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
