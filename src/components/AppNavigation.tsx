// components/AppNavigation.tsx - Main navigation for the app
'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import AssetWorksLogo from '@/components/AssetWorksLogo';
import { 
  Home, 
  Search, 
  Bell, 
  User, 
  LogOut,
  Settings,
  Bookmark,
  TrendingUp,
  Menu,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface AppNavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function AppNavigation({ activeTab = 'home', onTabChange }: AppNavigationProps) {
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully!');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      {/* Desktop/Tablet Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand - Official AssetWorks AI logo */}
            <div className="flex items-center">
              <AssetWorksLogo className="h-6 w-auto" />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange?.(item.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === item.id
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-700">
                <User className="h-4 w-4" />
                <span>{user?.name || user?.email || 'User'}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="hidden sm:flex"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>

              {/* Mobile Menu Button */}
              <Button
                variant="outline"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onTabChange?.(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors ${
                        activeTab === item.id
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
                
                {/* Mobile User Section */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center px-3 py-2">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-base font-medium text-gray-800">
                        {user?.name || 'User'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user?.email || 'No email'}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="mx-3 mt-2 w-[calc(100%-1.5rem)]"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange?.(item.id)}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'text-black bg-gray-100'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
                {item.id === 'notifications' && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}