// components/Dashboard.tsx - Main dashboard component
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { API } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  User, 
  Bell, 
  TrendingUp, 
  Settings, 
  LogOut,
  Loader2,
  Layout as WidgetIcon,
  MessageSquare,
  Globe
} from 'lucide-react';

interface Widget {
  id: string;
  title: string;
  description: string;
  type: string;
  [key: string]: any;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function Dashboard() {
  const { user, logout, fetchProfile, updateProfile } = useAuthStore();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'widgets' | 'notifications' | 'profile'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load multiple data sources in parallel
      const [
        profileResponse,
        widgetsResponse, 
        notificationsResponse,
        countriesResponse,
        widgetDataResponse
      ] = await Promise.allSettled([
        fetchProfile(),
        API.widgets.getTrending(),
        API.user.getNotifications(),
        API.data.getCountries(),
        API.data.getWidgetData()
      ]);

      // Handle trending widgets
      if (widgetsResponse.status === 'fulfilled') {
        setWidgets(widgetsResponse.value.data?.widgets || []);
      }

      // Handle notifications
      if (notificationsResponse.status === 'fulfilled') {
        setNotifications(notificationsResponse.value.data?.notifications || []);
      }

      // Handle countries
      if (countriesResponse.status === 'fulfilled') {
        setCountries(countriesResponse.value.data?.countries || []);
      }

      // Dashboard loaded - no need for repeated success messages
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully!');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleWidgetAction = async (widgetId: string, action: 'like' | 'follow' | 'save') => {
    try {
      switch (action) {
        case 'like':
          await API.widgets.like(widgetId);
          break;
        case 'follow':
          await API.widgets.follow(widgetId);
          break;
        case 'save':
          await API.widgets.save(widgetId);
          break;
      }
      toast.success(`Widget ${action}d successfully!`);
      // Note: In production, you might want to update the UI optimistically or refetch
    } catch (error) {
      toast.error(`Failed to ${action} widget`);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      await API.user.readNotifications();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark notifications as read');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">AssetWorks Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {user?.name || user?.email || user?.phone || 'User'}
                </span>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'widgets', label: 'Widgets', icon: WidgetIcon },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'profile', label: 'Profile', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.id === 'notifications' && notifications.filter(n => !n.read).length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <WidgetIcon className="h-5 w-5 mr-2" />
                    Total Widgets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{widgets.length}</div>
                  <p className="text-xs text-muted-foreground">Available trending widgets</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {notifications.filter(n => !n.read).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Unread out of {notifications.length} total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    Countries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{countries.length}</div>
                  <p className="text-xs text-muted-foreground">Supported countries</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Widgets Tab */}
        {activeTab === 'widgets' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Trending Widgets</h2>
              <Button onClick={() => {
                loadDashboardData();
                toast.success('Widgets refreshed');
              }} variant="outline" size="sm">
                Refresh
              </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {widgets.map((widget) => (
                <Card key={widget.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{widget.title}</CardTitle>
                    <CardDescription>{widget.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleWidgetAction(widget.id, 'like')}
                      >
                        Like
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleWidgetAction(widget.id, 'follow')}
                      >
                        Follow
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleWidgetAction(widget.id, 'save')}
                      >
                        Save
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {widgets.length === 0 && (
              <div className="text-center py-12">
                <WidgetIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No widgets found</h3>
                <p className="text-gray-500">Try refreshing or check back later.</p>
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
              {notifications.filter(n => !n.read).length > 0 && (
                <Button onClick={markNotificationsAsRead} variant="outline" size="sm">
                  Mark all as read
                </Button>
              )}
            </div>
            
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card key={notification.id} className={!notification.read ? 'border-blue-200 bg-blue-50' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{notification.title}</CardTitle>
                      {!notification.read && (
                        <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {notifications.length === 0 && (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
                <p className="text-gray-500">You're all caught up!</p>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="px-4 py-6 sm:px-0">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your account details from AssetWorks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User ID</label>
                    <p className="mt-1 text-sm text-gray-900">{user?.id}</p>
                  </div>
                  
                  {user?.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                    </div>
                  )}
                  
                  {user?.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{user.phone}</p>
                    </div>
                  )}
                  
                  {user?.name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="mt-1 text-sm text-gray-900">{user.name}</p>
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Raw User Data</h4>
                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                      {JSON.stringify(user, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}