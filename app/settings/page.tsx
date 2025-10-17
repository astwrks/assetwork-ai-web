'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Key,
  Palette,
  Globe,
  Moon,
  Sun,
  Monitor,
  Settings,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Copy,
  Database,
  Brain,
  DollarSign,
  BarChart3,
  Zap,
  Sparkles,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getProviderIcon } from '@/lib/utils/ai-provider-icons';
import { getAllModels, getModelsByProvider, AIModel } from '@/lib/utils/ai-models-config';
import { cn } from '@/lib/utils';

export default function SettingsPageImproved() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Active tab management with URL sync
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');

  // Profile settings
  const [name, setName] = useState(session?.user?.name || '');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [company, setCompany] = useState('');

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);

  // Appearance settings
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  // API Keys state
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [financialDataKeys, setFinancialDataKeys] = useState<any[]>([]);
  const [financialDataSummary, setFinancialDataSummary] = useState<any>(null);
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKey, setNewKey] = useState({
    name: '',
    provider: '',
    category: 'financial_data',
    apiKey: '',
  });

  // AI Models state
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testingModel, setTestingModel] = useState(false);
  const [showAddAiKey, setShowAddAiKey] = useState(false);
  const [newAiKey, setNewAiKey] = useState({
    name: '',
    provider: '',
    apiKey: '',
  });
  const [preferredModel, setPreferredModel] = useState('');
  const [autoSelectModel, setAutoSelectModel] = useState(true);

  // Mock usage statistics
  const [usageStats] = useState({
    totalRequests: 1247,
    totalTokens: 456789,
    totalCost: 23.45,
    thisMonth: {
      requests: 342,
      tokens: 125000,
      cost: 6.78,
    },
    byModel: [
      { model: 'GPT-4', requests: 234, cost: 12.34, avgTokens: 1234 },
      { model: 'Claude-3-Sonnet', requests: 456, cost: 8.90, avgTokens: 980 },
      { model: 'Gemini-Pro', requests: 557, cost: 2.21, avgTokens: 567 },
    ],
  });

  // Tab configuration
  const tabs = [
    { value: 'profile', label: 'Profile', icon: User },
    { value: 'api-keys', label: 'Data Integration', icon: Database },
    { value: 'ai-models', label: 'AI Models', icon: Brain },
    { value: 'notifications', label: 'Notifications', icon: Bell },
    { value: 'security', label: 'Security', icon: Shield },
    { value: 'billing', label: 'Billing', icon: CreditCard },
    { value: 'appearance', label: 'Appearance', icon: Palette },
  ];

  // Get configured AI providers (providers that have API keys)
  const configuredProviders = apiKeys
    .filter(key => key.category === 'ai')
    .map(key => key.provider);

  // Filter models to only show those from configured providers
  const availableModelsFromConfigured: AIModel[] = getAllModels().filter(model =>
    configuredProviders.includes(model.provider)
  );

  // Sync active tab with URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  // Fetch API keys on mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchApiKeys();
      fetchFinancialDataKeys();
      fetchAIModels();
    }
  }, [status]);

  // Handle tab change and update URL
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    router.push(`/settings?tab=${newTab}`, { scroll: false });
  };

  const fetchApiKeys = async () => {
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      if (data.success) {
        setApiKeys(data.keys);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    }
  };

  const fetchFinancialDataKeys = async () => {
    try {
      const res = await fetch('/api/settings/financial-data');
      const data = await res.json();
      if (data.success) {
        setFinancialDataKeys(data.keys);
        setFinancialDataSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch financial data keys:', error);
    }
  };

  const fetchAIModels = async () => {
    try {
      const res = await fetch('/api/ai/models');
      const data = await res.json();
      if (data.success) {
        setAvailableModels(data.available);
        if (data.available.length > 0) {
          setSelectedModel(data.available[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch AI models:', error);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Notification preferences saved');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleAddApiKey = async () => {
    if (!newKey.name || !newKey.apiKey) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKey),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Data integration added successfully');
        setApiKeys([...apiKeys, data.key]);
        setNewKey({ name: '', provider: '', category: 'financial_data', apiKey: '' });
        setShowAddKey(false);
        await fetchAIModels();
        await fetchFinancialDataKeys();
      } else {
        toast.error(data.error || 'Failed to add API key');
      }
    } catch (error) {
      toast.error('Failed to add API key');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return;
    }

    try {
      const res = await fetch(`/api/keys?id=${keyId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('API key deleted');
        setApiKeys(apiKeys.filter(k => k.id !== keyId));
        await fetchAIModels();
      } else {
        toast.error('Failed to delete API key');
      }
    } catch (error) {
      toast.error('Failed to delete API key');
    }
  };

  const handleCopyKey = (keyPreview: string) => {
    navigator.clipboard.writeText(keyPreview);
    toast.success('Key preview copied');
  };

  const handleAddAiKey = async () => {
    if (!newAiKey.name || !newAiKey.provider || !newAiKey.apiKey) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAiKey,
          category: 'ai',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('AI provider added successfully');
        setApiKeys([...apiKeys, data.key]);
        setNewAiKey({ name: '', provider: '', apiKey: '' });
        setShowAddAiKey(false);
        await fetchAIModels();
      } else {
        toast.error(data.error || 'Failed to add AI provider');
      }
    } catch (error) {
      toast.error('Failed to add AI provider');
    } finally {
      setLoading(false);
    }
  };

  // Handle loading and unauthenticated states
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Clean Header like Dashboard */}
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your account settings and preferences
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Improved Tabs - Clean and Manageable Layout */}
        <div className="space-y-6">
          {/* Desktop - 2 rows for better readability */}
          <div className="hidden lg:block">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="w-full h-auto p-1">
                <div className="grid w-full gap-1">
                  {/* First row - 4 columns */}
                  <div className="grid grid-cols-4 gap-1">
                    {tabs.slice(0, 4).map(tab => {
                      const Icon = tab.icon;
                      return (
                        <TabsTrigger key={tab.value} value={tab.value} className="py-2">
                          <Icon className="h-4 w-4 mr-2" />
                          {tab.label}
                        </TabsTrigger>
                      );
                    })}
                  </div>
                  {/* Second row - 3 columns */}
                  <div className="grid grid-cols-3 gap-1">
                    {tabs.slice(4).map(tab => {
                      const Icon = tab.icon;
                      return (
                        <TabsTrigger key={tab.value} value={tab.value} className="py-2">
                          <Icon className="h-4 w-4 mr-2" />
                          {tab.label}
                        </TabsTrigger>
                      );
                    })}
                  </div>
                </div>
              </TabsList>

              {/* Tab Contents */}
              <div className="mt-6">
                {renderTabContent()}
              </div>
            </Tabs>
          </div>

          {/* Tablet - 2 columns grid */}
          <div className="hidden md:block lg:hidden">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2 h-auto">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger key={tab.value} value={tab.value} className="py-2">
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* Tab Contents */}
              <div className="mt-6">
                {renderTabContent()}
              </div>
            </Tabs>
          </div>

          {/* Mobile Dropdown */}
          <div className="md:hidden">
            <Select value={activeTab} onValueChange={handleTabChange}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {tabs.find(t => t.value === activeTab)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <SelectItem key={tab.value} value={tab.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <div className="mt-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Separate function for tab content
  function renderTabContent() {
    switch (activeTab) {
      case 'profile':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Your Company Name"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'api-keys':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Financial Data Integration</CardTitle>
                  <CardDescription>
                    Connect your data sources for stocks and crypto
                  </CardDescription>
                </div>
                <Button onClick={() => setShowAddKey(!showAddKey)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Integration
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Integration Form */}
              {showAddKey && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="keyName">Key Name</Label>
                        <Input
                          id="keyName"
                          placeholder="e.g., My API Key"
                          value={newKey.name}
                          onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="provider">Provider</Label>
                        <Select
                          value={newKey.provider}
                          onValueChange={(value) => setNewKey({ ...newKey, provider: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="alpha_vantage">Alpha Vantage</SelectItem>
                            <SelectItem value="polygon">Polygon.io</SelectItem>
                            <SelectItem value="coingecko">CoinGecko</SelectItem>
                            <SelectItem value="coinmarketcap">CoinMarketCap</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        placeholder="sk-..."
                        value={newKey.apiKey}
                        onChange={(e) => setNewKey({ ...newKey, apiKey: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddKey(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddApiKey} disabled={loading}>
                        {loading ? 'Adding...' : 'Add Key'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Keys List */}
              <div className="space-y-3">
                {financialDataKeys.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No data sources configured</p>
                    <p className="text-sm mt-1">Connect your first data source to get started</p>
                  </div>
                ) : (
                  financialDataKeys.map((key) => (
                    <Card key={key.id}>
                      <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Database className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{key.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {key.provider} • {key.keyPreview}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyKey(key.keyPreview)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteApiKey(key.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'ai-models':
        return (
          <div className="space-y-6">
            {/* Usage Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Requests</p>
                      <p className="text-2xl font-bold">{usageStats.totalRequests.toLocaleString()}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Tokens</p>
                      <p className="text-2xl font-bold">{usageStats.totalTokens.toLocaleString()}</p>
                    </div>
                    <Zap className="w-8 h-8 text-yellow-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Cost</p>
                      <p className="text-2xl font-bold">${usageStats.totalCost.toFixed(2)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Models</p>
                      <p className="text-2xl font-bold">{availableModels.length}</p>
                    </div>
                    <Brain className="w-8 h-8 text-purple-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Provider Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>AI Provider Integration</CardTitle>
                    <CardDescription>
                      Configure API keys for AI providers
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowAddAiKey(!showAddAiKey)} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Provider
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Add AI Key Form */}
                {showAddAiKey && (
                  <Card className="bg-muted/50 mb-4">
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Provider Name</Label>
                          <Input
                            placeholder="e.g., Production OpenAI"
                            value={newAiKey.name}
                            onChange={(e) => setNewAiKey({ ...newAiKey, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>AI Provider</Label>
                          <Select
                            value={newAiKey.provider}
                            onValueChange={(value) => setNewAiKey({ ...newAiKey, provider: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="openai">OpenAI</SelectItem>
                              <SelectItem value="anthropic">Anthropic</SelectItem>
                              <SelectItem value="google">Google</SelectItem>
                              <SelectItem value="groq">Groq</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input
                          type="password"
                          placeholder="Enter your API key"
                          value={newAiKey.apiKey}
                          onChange={(e) => setNewAiKey({ ...newAiKey, apiKey: e.target.value })}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowAddAiKey(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddAiKey} disabled={loading}>
                          {loading ? 'Adding...' : 'Add Provider'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI Keys List */}
                <div className="space-y-3">
                  {apiKeys.filter(key => key.category === 'ai').length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No AI providers configured</p>
                      <p className="text-sm mt-1">Add your first AI provider to get started</p>
                    </div>
                  ) : (
                    apiKeys.filter(key => key.category === 'ai').map((key) => {
                      const providerConfig = getProviderIcon(key.provider);
                      const ProviderIcon = providerConfig.icon;

                      return (
                        <Card key={key.id} className="bg-muted/30">
                          <CardContent className="flex items-center justify-between py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg ${providerConfig.bgColor} flex items-center justify-center`}>
                                <ProviderIcon className={`w-5 h-5 ${providerConfig.color}`} />
                              </div>
                              <div>
                                <p className="font-medium">{key.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {providerConfig.displayName} • {key.keyPreview}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyKey(key.keyPreview)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteApiKey(key.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-medium">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates about your account activity
                    </p>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      emailNotifications ? 'bg-primary' : 'bg-muted'
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-medium">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications on your devices
                    </p>
                  </div>
                  <button
                    onClick={() => setPushNotifications(!pushNotifications)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      pushNotifications ? 'bg-primary' : 'bg-muted'
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        pushNotifications ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-medium">Weekly Report</Label>
                    <p className="text-sm text-muted-foreground">
                      Get a weekly summary of your activity
                    </p>
                  </div>
                  <button
                    onClick={() => setWeeklyReport(!weeklyReport)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      weeklyReport ? 'bg-primary' : 'bg-muted'
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        weeklyReport ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'security':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your password and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Key className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Password</p>
                        <p className="text-sm text-muted-foreground">
                          Last changed 3 months ago
                        </p>
                      </div>
                    </div>
                    <Button variant="outline">Change Password</Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Not Enabled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Delete Account</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'billing':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                You are currently on the Pro plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border-2 border-primary rounded-lg bg-primary/5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-2xl font-bold">Pro Plan</h3>
                      <Badge>Current</Badge>
                    </div>
                    <p className="text-3xl font-bold mb-2">
                      $49<span className="text-lg font-normal text-muted-foreground">/month</span>
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center">
                        <Check className="w-4 h-4 mr-2 text-green-600" />
                        Unlimited AI Credits
                      </li>
                      <li className="flex items-center">
                        <Check className="w-4 h-4 mr-2 text-green-600" />
                        Advanced Analytics
                      </li>
                      <li className="flex items-center">
                        <Check className="w-4 h-4 mr-2 text-green-600" />
                        Priority Support
                      </li>
                    </ul>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-2">Next billing date</p>
                    <p className="font-medium">March 15, 2025</p>
                    <Button variant="outline" className="mt-4">Manage Plan</Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold flex items-center">
                  <CreditCard className="w-4 h-4 mr-2 text-primary" />
                  Payment Method
                </h4>
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">•••• •••• •••• 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/2025</p>
                    </div>
                  </div>
                  <Button variant="outline">Update</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'appearance':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize how AssetWorks looks on your device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-semibold">Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={cn(
                      "p-3 border-2 rounded-lg transition-all",
                      theme === 'light' ? 'border-primary bg-primary/5' : 'border-border'
                    )}
                  >
                    <Sun className="w-6 h-6 mx-auto mb-2" />
                    <p className="font-medium">Light</p>
                  </button>
                  <button
                    disabled
                    className="p-3 border-2 rounded-lg transition-all border-border opacity-60 cursor-not-allowed relative"
                  >
                    <Badge
                      variant="secondary"
                      className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5"
                    >
                      Soon
                    </Badge>
                    <Moon className="w-6 h-6 mx-auto mb-2" />
                    <p className="font-medium">Dark</p>
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={cn(
                      "p-3 border-2 rounded-lg transition-all",
                      theme === 'system' ? 'border-primary bg-primary/5' : 'border-border'
                    )}
                  >
                    <Monitor className="w-6 h-6 mx-auto mb-2" />
                    <p className="font-medium">System</p>
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Dark mode is coming soon! We're working hard to bring you a beautiful dark theme.
                </p>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  }
}