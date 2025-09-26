// components/Home.tsx - New home page with mobile-like widget thumbnails
'use client';

import { useState } from 'react';
import AppNavigation from './AppNavigation';
import HomeGrid from './HomeGrid';
import Dashboard from './Dashboard';
import { toast } from 'sonner';

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);

  const handleWidgetClick = (widgetId: string) => {
    // For now, show a toast. Later this could open a modal or navigate to widget detail page
    toast.info(`Opening widget: ${widgetId}`);
    setSelectedWidget(widgetId);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeGrid onWidgetClick={handleWidgetClick} />;
      
      case 'trending':
        return (
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 md:mb-8">Trending Widgets</h2>
            <HomeGrid onWidgetClick={handleWidgetClick} />
          </div>
        );
      
      case 'saved':
        return (
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 md:mb-8">Saved Widgets</h2>
            <div className="text-center py-12">
              <p className="text-lg text-gray-600">Your saved widgets will appear here</p>
            </div>
          </div>
        );
      
      case 'notifications':
      case 'profile':
        // For these tabs, we'll use the existing Dashboard component
        return <Dashboard />;
      
      default:
        return <HomeGrid onWidgetClick={handleWidgetClick} />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <AppNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      {/* Main Content */}
      <main className={`${activeTab === 'home' ? 'pt-6' : ''} pb-20 md:pb-6`}>
        {renderContent()}
      </main>

      {/* Widget Detail Modal - TODO: Implement later */}
      {selectedWidget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Widget Detail</h3>
            <p className="text-gray-600 mb-4">Widget ID: {selectedWidget}</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setSelectedWidget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  toast.success('Widget opened!');
                  setSelectedWidget(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800"
              >
                Open Widget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}