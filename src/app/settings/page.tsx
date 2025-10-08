'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { 
  Settings, 
  User, 
  Bot, 
  Database, 
  FileText, 
  Bell,
  Shield,
  Palette,
  Save,
  Download,
  Upload
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    // General settings
    name: 'John Doe',
    email: 'john.doe@company.com',
    company: 'Financial Corp',
    timezone: 'UTC-8',
    language: 'en',
    
    // AI settings
    defaultModel: 'gpt-4',
    temperature: 0.7,
    maxTokens: 4000,
    systemPrompt: 'You are a financial analysis AI assistant.',
    
    // Data settings
    autoSync: true,
    syncInterval: 300, // 5 minutes
    cacheSize: 1000,
    
    // Notification settings
    emailNotifications: true,
    pushNotifications: true,
    reportUpdates: true,
    systemAlerts: true,
    
    // Security settings
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
  });

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'ai', label: 'AI Models', icon: Bot },
    { id: 'data', label: 'Data Sources', icon: Database },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Settings saved:', settings);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting settings...');
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log('Importing settings...');
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={settings.name}
            onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={settings.email}
            onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            value={settings.company}
            onChange={(e) => setSettings(prev => ({ ...prev, company: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <select
            id="timezone"
            value={settings.timezone}
            onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
          >
            <option value="UTC-12">UTC-12</option>
            <option value="UTC-8">UTC-8 (PST)</option>
            <option value="UTC-5">UTC-5 (EST)</option>
            <option value="UTC+0">UTC+0 (GMT)</option>
            <option value="UTC+1">UTC+1 (CET)</option>
            <option value="UTC+8">UTC+8 (CST)</option>
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="language">Language</Label>
        <select
          id="language"
          value={settings.language}
          onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="zh">Chinese</option>
        </select>
      </div>
    </div>
  );

  const renderAISettings = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="defaultModel">Default AI Model</Label>
        <select
          id="defaultModel"
          value={settings.defaultModel}
          onChange={(e) => setSettings(prev => ({ ...prev, defaultModel: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
        >
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          <option value="claude-3">Claude 3</option>
          <option value="claude-2">Claude 2</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="temperature">Temperature: {settings.temperature}</Label>
          <input
            id="temperature"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.temperature}
            onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>More Focused</span>
            <span>More Creative</span>
          </div>
        </div>
        <div>
          <Label htmlFor="maxTokens">Max Tokens: {settings.maxTokens}</Label>
          <input
            id="maxTokens"
            type="range"
            min="1000"
            max="8000"
            step="500"
            value={settings.maxTokens}
            onChange={(e) => setSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Shorter</span>
            <span>Longer</span>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="systemPrompt">System Prompt</Label>
        <Textarea
          id="systemPrompt"
          value={settings.systemPrompt}
          onChange={(e) => setSettings(prev => ({ ...prev, systemPrompt: e.target.value }))}
          rows={4}
          placeholder="Enter the system prompt for AI agents..."
        />
      </div>
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="autoSync"
          checked={settings.autoSync}
          onChange={(e) => setSettings(prev => ({ ...prev, autoSync: e.target.checked }))}
          className="rounded"
        />
        <Label htmlFor="autoSync">Enable Auto Sync</Label>
      </div>

      {settings.autoSync && (
        <div>
          <Label htmlFor="syncInterval">Sync Interval (seconds): {settings.syncInterval}</Label>
          <input
            id="syncInterval"
            type="range"
            min="60"
            max="3600"
            step="60"
            value={settings.syncInterval}
            onChange={(e) => setSettings(prev => ({ ...prev, syncInterval: parseInt(e.target.value) }))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 min</span>
            <span>1 hour</span>
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="cacheSize">Cache Size (MB): {settings.cacheSize}</Label>
        <input
          id="cacheSize"
          type="range"
          min="100"
          max="5000"
          step="100"
          value={settings.cacheSize}
          onChange={(e) => setSettings(prev => ({ ...prev, cacheSize: parseInt(e.target.value) }))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>100 MB</span>
          <span>5 GB</span>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="emailNotifications">Email Notifications</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Receive notifications via email
            </p>
          </div>
          <input
            type="checkbox"
            id="emailNotifications"
            checked={settings.emailNotifications}
            onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
            className="rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="pushNotifications">Push Notifications</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Receive push notifications in browser
            </p>
          </div>
          <input
            type="checkbox"
            id="pushNotifications"
            checked={settings.pushNotifications}
            onChange={(e) => setSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
            className="rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="reportUpdates">Report Updates</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Notify when reports are updated
            </p>
          </div>
          <input
            type="checkbox"
            id="reportUpdates"
            checked={settings.reportUpdates}
            onChange={(e) => setSettings(prev => ({ ...prev, reportUpdates: e.target.checked }))}
            className="rounded"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="systemAlerts">System Alerts</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Receive system maintenance alerts
            </p>
          </div>
          <input
            type="checkbox"
            id="systemAlerts"
            checked={settings.systemAlerts}
            onChange={(e) => setSettings(prev => ({ ...prev, systemAlerts: e.target.checked }))}
            className="rounded"
          />
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add an extra layer of security to your account
          </p>
        </div>
        <input
          type="checkbox"
          id="twoFactorAuth"
          checked={settings.twoFactorAuth}
          onChange={(e) => setSettings(prev => ({ ...prev, twoFactorAuth: e.target.checked }))}
          className="rounded"
        />
      </div>

      <div>
        <Label htmlFor="sessionTimeout">Session Timeout (minutes): {settings.sessionTimeout}</Label>
        <input
          id="sessionTimeout"
          type="range"
          min="5"
          max="120"
          step="5"
          value={settings.sessionTimeout}
          onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>5 min</span>
          <span>2 hours</span>
        </div>
      </div>

      <div>
        <Label htmlFor="passwordExpiry">Password Expiry (days): {settings.passwordExpiry}</Label>
        <input
          id="passwordExpiry"
          type="range"
          min="30"
          max="365"
          step="30"
          value={settings.passwordExpiry}
          onChange={(e) => setSettings(prev => ({ ...prev, passwordExpiry: parseInt(e.target.value) }))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>30 days</span>
          <span>1 year</span>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <Label>Theme</Label>
        <div className="mt-2">
          <ThemeToggle />
        </div>
      </div>

      <div>
        <Label htmlFor="fontSize">Font Size</Label>
        <select
          id="fontSize"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
        >
          <option value="small">Small</option>
          <option value="medium" selected>Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      <div>
        <Label htmlFor="density">Information Density</Label>
        <select
          id="density"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
        >
          <option value="compact">Compact</option>
          <option value="comfortable" selected>Comfortable</option>
          <option value="spacious">Spacious</option>
        </select>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'ai':
        return renderAISettings();
      case 'data':
        return renderDataSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'appearance':
        return renderAppearanceSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account preferences and application settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    {(() => {
                      const tab = tabs.find(t => t.id === activeTab);
                      const Icon = tab?.icon || Settings;
                      return (
                        <>
                          <Icon className="h-5 w-5" />
                          <span>{tab?.label}</span>
                        </>
                      );
                    })()}
                  </CardTitle>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleImport}>
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {renderContent()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
