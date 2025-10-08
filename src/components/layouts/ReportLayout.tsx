'use client';

import { useState, useEffect } from 'react';
import ResizablePanels from './ResizablePanels';
import MainSidebar from '../navigation/MainSidebar';
import ReportCanvas from '../report/ReportCanvas';
import ChatPanel from '../chat/ChatPanel';
import AgentStatusPanel from '../agents/AgentStatusPanel';
import DataSourceManager from '../data/DataSourceManager';
import { AIAgent } from '@/types/report.types';
import { agentOrchestrator } from '@/lib/agents/AgentOrchestrator';

interface ReportLayoutProps {
  reportId?: string;
  initialData?: any;
}

export default function ReportLayout({ reportId, initialData }: ReportLayoutProps) {
  const [activeView, setActiveView] = useState('reports');
  const [selectedReport, setSelectedReport] = useState(reportId);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [dataSources, setDataSources] = useState<any[]>([]);

  useEffect(() => {
    // Initialize agents
    const initialAgents = agentOrchestrator.getAgents();
    setAgents(initialAgents);

    // Subscribe to agent updates
    const listenerId = agentOrchestrator.subscribeToTasks((task) => {
      console.log('Agent task completed:', task);
      // Update agent status based on task completion
      setAgents(prev => prev.map(agent => 
        agent.id === task.agentId 
          ? { ...agent, status: task.status === 'completed' ? 'idle' : 'working' }
          : agent
      ));
    });

    return () => {
      agentOrchestrator.unsubscribeFromTasks(listenerId);
    };
  }, []);

  const handleViewChange = (view: string) => {
    setActiveView(view);
  };

  const handleReportSelect = (reportId: string) => {
    setSelectedReport(reportId);
  };

  const handleChatMessage = (message: any) => {
    setChatMessages(prev => [...prev, message]);
    
    // Trigger AI agent processing
    if (message.type === 'user') {
      // Find appropriate agent based on message content
      const agentId = 'analysis-agent'; // Default to analysis agent
      agentOrchestrator.executeTask(agentId, message.content, {
        reportId: selectedReport,
        context: 'chat',
      });
    }
  };

  const handleAgentResponse = (response: any) => {
    setChatMessages(prev => [...prev, response]);
  };

  const handleDataSourceUpdate = (sources: any[]) => {
    setDataSources(sources);
  };

  const renderMainContent = () => {
    switch (activeView) {
      case 'reports':
        return (
          <ReportCanvas 
            reportId={selectedReport}
            initialData={initialData}
            onReportUpdate={(report) => {
              console.log('Report updated:', report);
            }}
          />
        );
      case 'data-sources':
        return (
          <div className="p-6">
            <DataSourceManager onDataSourceUpdate={handleDataSourceUpdate} />
          </div>
        );
      case 'ai-agents':
        return (
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  AI Agents
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage and monitor your AI agents
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {agent.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {agent.capabilities.join(', ')}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        agent.status === 'idle' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : agent.status === 'working'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {agent.status}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {agent.lastActivity?.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Settings
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Navigate to the dedicated settings page for full configuration options.
              </p>
              <a 
                href="/settings" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Open Settings
              </a>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Welcome to AssetWorks AI
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Select a view from the sidebar to get started.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <ResizablePanels
      defaultSizes={{ sidebar: 20, main: 50, chat: 30, bottom: 20 }}
    >
      {{
        sidebar: (
          <MainSidebar 
            activeView={activeView}
            onViewChange={handleViewChange}
            selectedReport={selectedReport}
            onReportSelect={handleReportSelect}
          />
        ),
        main: renderMainContent(),
        chat: (
          <ChatPanel 
            messages={chatMessages}
            onSendMessage={handleChatMessage}
            onAgentResponse={handleAgentResponse}
          />
        ),
        bottom: (
          <AgentStatusPanel 
            agents={agents}
            onAgentUpdate={setAgents}
          />
        )
      }}
    </ResizablePanels>
  );
}
