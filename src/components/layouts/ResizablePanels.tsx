'use client';

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useState } from 'react';
import { ChevronUp, ChevronDown, Settings, Database, Bot, FileText } from 'lucide-react';

interface ResizablePanelsProps {
  children: {
    sidebar: React.ReactNode;
    main: React.ReactNode;
    chat: React.ReactNode;
    bottom?: React.ReactNode;
  };
  defaultSizes?: {
    sidebar: number;
    main: number;
    chat: number;
    bottom: number;
  };
}

export default function ResizablePanels({ 
  children, 
  defaultSizes = { sidebar: 20, main: 50, chat: 30, bottom: 20 } 
}: ResizablePanelsProps) {
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Top Panel Group: Sidebar, Main, Chat */}
      <PanelGroup direction="horizontal" className="flex-1">
        {/* Left Sidebar */}
        <Panel defaultSize={defaultSizes.sidebar} minSize={15} maxSize={40}>
          <div className="h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            {children.sidebar}
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors" />

        {/* Main Content Area */}
        <Panel defaultSize={defaultSizes.main} minSize={30}>
          <div className="h-full bg-white dark:bg-gray-800">
            {children.main}
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors" />

        {/* Right Chat Panel */}
        <Panel defaultSize={defaultSizes.chat} minSize={20} maxSize={50}>
          <div className="h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
            {children.chat}
          </div>
        </Panel>
      </PanelGroup>

      {/* Bottom Panel (Collapsible) */}
      {children.bottom && (
        <>
          <div className="h-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors cursor-row-resize" />
          <PanelGroup direction="vertical">
            <Panel 
              defaultSize={bottomPanelCollapsed ? 0 : defaultSizes.bottom} 
              minSize={0}
              maxSize={50}
            >
              {!bottomPanelCollapsed && (
                <div className="h-full bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                  {children.bottom}
                </div>
              )}
            </Panel>
          </PanelGroup>
        </>
      )}

      {/* Bottom Panel Toggle */}
      {children.bottom && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <button
            onClick={() => setBottomPanelCollapsed(!bottomPanelCollapsed)}
            className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            {bottomPanelCollapsed ? (
              <>
                <ChevronUp className="h-4 w-4" />
                <span className="text-sm font-medium">Show Panel</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span className="text-sm font-medium">Hide Panel</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
