'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
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
  LogOut,
  ChevronRight,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Database,
  Brain,
  DollarSign,
  BarChart3,
  Zap,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getProviderIcon } from '@/lib/utils/ai-provider-icons';
import { getAllModels, getModelsByProvider, AIModel } from '@/lib/utils/ai-models-config';

export default function SettingsPage() {
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

  // Handlers must be defined after all hooks
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // API call to save profile
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

  const handleCheckConnection = async (keyId?: string) => {
    setCheckingConnection(true);
    try {
      const res = await fetch('/api/settings/financial-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyId: keyId || undefined,
          checkAll: !keyId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Connection check complete: ${data.summary.connected} connected, ${data.summary.error} errors`);
        // Refresh the financial data keys
        await fetchFinancialDataKeys();
      } else {
        toast.error(data.error || 'Failed to check connection');
      }
    } catch (error) {
      toast.error('Failed to check connection');
    } finally {
      setCheckingConnection(false);
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
        // Refresh AI models and financial data keys
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
        // Refresh AI models
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

  const handleTestModel = async () => {
    if (!testMessage) {
      toast.error('Please enter a test message');
      return;
    }

    setTestingModel(true);
    try {
      const res = await fetch('/api/ai/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelKey: selectedModel,
          message: testMessage,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setTestResult(data.response);
        toast.success('Model test successful');
      } else {
        toast.error(data.error || 'Failed to test model');
      }
    } catch (error) {
      toast.error('Failed to test model');
    } finally {
      setTestingModel(false);
    }
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
        // Refresh AI models
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

  const handleSetPreferredModel = async (modelId: string) => {
    setLoading(true);
    try {
      // API call to save preferred model
      await new Promise(resolve => setTimeout(resolve, 500));
      setPreferredModel(modelId);
      toast.success('Preferred model updated');
    } catch (error) {
      toast.error('Failed to update preferred model');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoSelect = async () => {
    setLoading(true);
    try {
      // API call to save auto-select preference
      await new Promise(resolve => setTimeout(resolve, 500));
      setAutoSelectModel(!autoSelectModel);
      toast.success(`Auto-select ${!autoSelectModel ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update auto-select');
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
    <div className="min-h-screen bg-muted dark:bg-background">
      {/* Header */}
      <header className="bg-background dark:bg-background border-b border-border dark:border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-primary">AssetWorks</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/financial-playground">
                <Button variant="ghost">AI Chat</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-primary-foreground flex items-center">
            <Settings className="w-7 h-7 mr-2 text-primary" />
            Settings
          </h1>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="api-keys">Data Integration</TabsTrigger>
            <TabsTrigger value="ai-models">
              <span className="flex items-center gap-2">
                AI Models
                {availableModels.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    {availableModels.length}
                  </Badge>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and email address
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                      <User className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div>
                      <Button variant="outline" size="sm">Change Avatar</Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, GIF or PNG. Max size of 2MB
                      </p>
                    </div>
                  </div>

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
            </motion.div>
          </TabsContent>

          {/* Data Integration Tab */}
          <TabsContent value="api-keys" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Database className="w-5 h-5 mr-2 text-primary" />
                        Financial Data Integration
                      </CardTitle>
                      <CardDescription>
                        Connect your data sources for stocks, crypto, and AI-powered analysis
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowAddKey(!showAddKey)} variant="default">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Integration
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add New Integration Form */}
                  {showAddKey && (
                    <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5 space-y-4">
                      <h4 className="font-semibold text-lg">Add New Data Integration</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="keyName">Key Name</Label>
                          <Input
                            id="keyName"
                            placeholder="e.g., My OpenAI Key"
                            value={newKey.name}
                            onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category">Data Source Category</Label>
                          <select
                            id="category"
                            value={newKey.category}
                            onChange={(e) => {
                              setNewKey({ ...newKey, category: e.target.value, provider: '' });
                            }}
                            className="w-full px-3 py-2 border border-input rounded-md bg-background"
                          >
                            <option value="financial_data">Stock Market Data</option>
                            <option value="crypto">Cryptocurrency Data</option>
                            <option value="other">Other Data Sources</option>
                          </select>
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="provider">Provider</Label>
                          <select
                            id="provider"
                            value={newKey.provider}
                            onChange={(e) => setNewKey({ ...newKey, provider: e.target.value })}
                            className="w-full px-3 py-2 border border-input rounded-md bg-background"
                          >
                            <option value="">Select a provider...</option>
                            {newKey.category === 'financial_data' && (
                              <>
                                <option value="alpha_vantage">Alpha Vantage - Stock Market Data</option>
                                <option value="polygon">Polygon.io - Real-time Market Data</option>
                                <option value="finnhub">Finnhub - Financial Data Platform</option>
                              </>
                            )}
                            {newKey.category === 'crypto' && (
                              <>
                                <option value="coinmarketcap">CoinMarketCap - Crypto Market Data</option>
                                <option value="coingecko">CoinGecko - Crypto Analytics (Free)</option>
                                <option value="binance">Binance - Exchange Data</option>
                              </>
                            )}
                            {newKey.category === 'other' && (
                              <option value="custom">Custom Data Source</option>
                            )}
                          </select>
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="apiKey">API Key</Label>
                          <Input
                            id="apiKey"
                            type="password"
                            placeholder="sk-..."
                            value={newKey.apiKey}
                            onChange={(e) => setNewKey({ ...newKey, apiKey: e.target.value })}
                          />
                          <p className="text-xs text-muted-foreground">
                            Your API key will be encrypted before storage. We never store plain-text keys.
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowAddKey(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddApiKey} disabled={loading}>
                          {loading ? 'Adding...' : 'Add Key'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Connection Status Summary */}
                  {financialDataSummary && financialDataSummary.total > 0 && (
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Connected</p>
                              <p className="text-2xl font-bold text-green-600">{financialDataSummary.connected}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                              <Check className="w-5 h-5 text-green-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Errors</p>
                              <p className="text-2xl font-bold text-red-600">{financialDataSummary.error}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                              <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Unknown</p>
                              <p className="text-2xl font-bold text-orange-600">{financialDataSummary.unknown}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                              <AlertCircle className="w-5 h-5 text-orange-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Check All Connections Button */}
                  {financialDataKeys.length > 0 && (
                    <div className="flex justify-end mb-4">
                      <Button
                        onClick={() => handleCheckConnection()}
                        disabled={checkingConnection}
                        variant="outline"
                        size="sm"
                      >
                        {checkingConnection ? 'Checking...' : 'Check All Connections'}
                      </Button>
                    </div>
                  )}

                  {/* Integrations List */}
                  <div className="space-y-3">
                    {financialDataKeys.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Database className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-semibold mb-2">No data sources configured</p>
                        <p className="text-sm max-w-md mx-auto">
                          Connect stock market data providers and cryptocurrency APIs to power your financial analysis
                        </p>
                      </div>
                    ) : (
                      financialDataKeys.map((key) => (
                        <div
                          key={key.id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              {key.category === 'financial_data' && <Database className="w-5 h-5 text-primary" />}
                              {key.category === 'crypto' && <DollarSign className="w-5 h-5 text-primary" />}
                              {key.category === 'other' && <Key className="w-5 h-5 text-primary" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{key.name}</p>
                                <Badge variant="secondary" className="text-xs">
                                  {key.provider}
                                </Badge>
                                {key.connectionStatus === 'connected' && (
                                  <Badge className="text-xs bg-green-600">
                                    <Check className="w-3 h-3 mr-1" />
                                    Connected
                                  </Badge>
                                )}
                                {key.connectionStatus === 'error' && (
                                  <Badge className="text-xs bg-red-600">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Error
                                  </Badge>
                                )}
                                {key.connectionStatus === 'unknown' && (
                                  <Badge variant="outline" className="text-xs">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Not Checked
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <p className="text-sm text-muted-foreground font-mono">
                                  {key.keyPreview}
                                </p>
                                <button
                                  onClick={() => handleCopyKey(key.keyPreview)}
                                  className="text-muted-foreground hover:text-primary"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <BarChart3 className="w-3 h-3" />
                                  Used {key.usageCount} times
                                </span>
                                {key.lastUsed && (
                                  <span>
                                    • Last used: {new Date(key.lastUsed).toLocaleDateString()}
                                  </span>
                                )}
                                {key.lastChecked && (
                                  <span>
                                    • Last checked: {new Date(key.lastChecked).toLocaleDateString()} at {new Date(key.lastChecked).toLocaleTimeString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCheckConnection(key.id)}
                              disabled={checkingConnection}
                              title="Check connection"
                            >
                              <AlertCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteApiKey(key.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Security Info */}
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        Your API keys are encrypted
                      </p>
                      <p className="text-blue-700 dark:text-blue-300 mt-1">
                        All API keys are encrypted using AES-256-GCM before storage. We never store or
                        display plain-text keys.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* AI Models Tab */}
          <TabsContent value="ai-models" className="space-y-4">
            {/* Usage Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Requests</p>
                        <p className="text-2xl font-bold">{usageStats.totalRequests.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {usageStats.thisMonth.requests} this month
                        </p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-blue-500 opacity-70" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Tokens</p>
                        <p className="text-2xl font-bold">{usageStats.totalTokens.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {usageStats.thisMonth.tokens.toLocaleString()} this month
                        </p>
                      </div>
                      <Zap className="w-8 h-8 text-yellow-500 opacity-70" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Cost</p>
                        <p className="text-2xl font-bold">${usageStats.totalCost.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ${usageStats.thisMonth.cost.toFixed(2)} this month
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-500 opacity-70" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Models</p>
                        <p className="text-2xl font-bold">{availableModels.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {apiKeys.filter(k => k.category === 'ai').length} providers configured
                        </p>
                      </div>
                      <Brain className="w-8 h-8 text-purple-500 opacity-70" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* AI Provider Integration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Key className="w-5 h-5 mr-2 text-primary" />
                        AI Provider Integration
                      </CardTitle>
                      <CardDescription>
                        Configure API keys for AI providers (OpenAI, Anthropic, Google, Groq)
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowAddAiKey(!showAddAiKey)} variant="default" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add AI Provider
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add AI Key Form */}
                  {showAddAiKey && (
                    <div className="p-4 border border-border rounded-lg bg-muted/30 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="aiKeyName">Provider Name</Label>
                          <Input
                            id="aiKeyName"
                            placeholder="e.g., Production OpenAI"
                            value={newAiKey.name}
                            onChange={(e) => setNewAiKey({ ...newAiKey, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="aiProvider">AI Provider</Label>
                          <select
                            id="aiProvider"
                            value={newAiKey.provider}
                            onChange={(e) => setNewAiKey({ ...newAiKey, provider: e.target.value })}
                            className="w-full px-3 py-2 border border-input rounded-md bg-background"
                          >
                            <option value="">Select provider...</option>
                            <option value="openai">OpenAI (GPT-4, GPT-3.5)</option>
                            <option value="anthropic">Anthropic (Claude)</option>
                            <option value="google">Google (Gemini)</option>
                            <option value="groq">Groq (Fast Inference)</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="aiApiKey">API Key</Label>
                        <Input
                          id="aiApiKey"
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
                    </div>
                  )}

                  {/* AI Keys List */}
                  {apiKeys.filter(key => key.category === 'ai').length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No AI providers configured yet</p>
                      <p className="text-xs mt-1">Add your first AI provider to unlock AI-powered features</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {apiKeys.filter(key => key.category === 'ai').map((key) => {
                        const providerConfig = getProviderIcon(key.provider);
                        const ProviderIcon = providerConfig.icon;

                        return (
                          <div
                            key={key.id}
                            className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg ${providerConfig.bgColor} flex items-center justify-center`}>
                                <ProviderIcon className={`w-5 h-5 ${providerConfig.color}`} />
                              </div>
                              <div>
                                <p className="font-medium">{key.name}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {providerConfig.displayName}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    •••• {key.keyPreview}
                                  </span>
                                  {key.metadata?.quotaRemaining && (
                                    <>
                                      <span className="text-xs text-muted-foreground">•</span>
                                      <span className="text-xs text-green-600 dark:text-green-400">
                                        ${key.metadata.quotaRemaining} remaining
                                      </span>
                                    </>
                                  )}
                                </div>
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
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Model Configuration & Preferences */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-primary" />
                    Model Configuration & Preferences
                  </CardTitle>
                  <CardDescription>
                    Configure preferred models and automatic selection
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {availableModels.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm mb-2">No AI models available</p>
                      <p className="text-xs max-w-md mx-auto mb-4">
                        Add API keys for AI providers above to unlock available models
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Auto Model Selection */}
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" />
                            <Label className="font-medium">Auto Model Selection</Label>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Automatically select the best model based on context and cost
                          </p>
                        </div>
                        <button
                          onClick={handleToggleAutoSelect}
                          disabled={loading}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            autoSelectModel ? 'bg-primary' : 'bg-muted'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              autoSelectModel ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Preferred Model */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">Preferred Model</Label>
                        <p className="text-sm text-muted-foreground -mt-2">
                          Choose your default model from your configured AI providers
                        </p>
                        {availableModelsFromConfigured.length === 0 ? (
                          <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                            <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-medium mb-1">No AI models available</p>
                            <p className="text-xs text-muted-foreground max-w-md mx-auto">
                              Add API keys for AI providers above to unlock available models
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Group models by provider */}
                            {configuredProviders.map((provider) => {
                              const providerModels = availableModelsFromConfigured.filter(
                                m => m.provider === provider
                              );
                              if (providerModels.length === 0) return null;

                              const providerConfig = getProviderIcon(provider);
                              const ProviderIcon = providerConfig.icon;

                              return (
                                <div key={provider} className="space-y-2">
                                  {/* Provider Header */}
                                  <div className="flex items-center gap-2 pb-2 border-b">
                                    <div className={`w-6 h-6 rounded-md ${providerConfig.bgColor} flex items-center justify-center`}>
                                      <ProviderIcon className={`w-3.5 h-3.5 ${providerConfig.color}`} />
                                    </div>
                                    <h4 className="font-semibold text-sm">{providerConfig.displayName}</h4>
                                    <Badge variant="outline" className="text-xs ml-auto">
                                      {providerModels.length} {providerModels.length === 1 ? 'model' : 'models'}
                                    </Badge>
                                  </div>

                                  {/* Provider Models */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {providerModels.map((model) => (
                                      <button
                                        key={model.id}
                                        onClick={() => handleSetPreferredModel(model.id)}
                                        disabled={loading}
                                        className={`p-3 border-2 rounded-lg text-left transition-all ${
                                          preferredModel === model.id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary/50'
                                        }`}
                                      >
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                              <p className="font-medium text-sm">{model.name}</p>
                                              {preferredModel === model.id && (
                                                <Check className="w-4 h-4 text-primary ml-auto" />
                                              )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-1">
                                              {model.description}
                                            </p>
                                            <div className="text-xs text-muted-foreground space-y-0.5">
                                              {model.contextWindow && (
                                                <p>Context: {(model.contextWindow / 1000).toFixed(0)}K tokens</p>
                                              )}
                                              {model.pricing && (
                                                <p className="text-[10px]">
                                                  ${model.pricing.input}/1M in • ${model.pricing.output}/1M out
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Usage by Model */}
                      <div className="space-y-3 pt-4 border-t">
                        <Label className="text-base font-semibold flex items-center">
                          <BarChart3 className="w-4 h-4 mr-2 text-primary" />
                          Usage Insights by Model
                        </Label>
                        <div className="space-y-2">
                          {usageStats.byModel.map((stat, index) => (
                            <div
                              key={index}
                              className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm">{stat.model}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {stat.requests} requests
                                  </Badge>
                                </div>
                                <p className="text-sm font-semibold">${stat.cost.toFixed(2)}</p>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Avg: {stat.avgTokens} tokens</span>
                                <span>•</span>
                                <span>Cost per request: ${(stat.cost / stat.requests).toFixed(4)}</span>
                              </div>
                              {/* Progress bar */}
                              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{
                                    width: `${(stat.requests / usageStats.totalRequests) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Model Testing */}
                      <div className="space-y-3 pt-4 border-t">
                        <Label className="text-base font-semibold flex items-center">
                          <Zap className="w-4 h-4 mr-2 text-primary" />
                          Test Selected Model
                        </Label>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="testModel">Select Model</Label>
                            <select
                              id="testModel"
                              value={selectedModel}
                              onChange={(e) => setSelectedModel(e.target.value)}
                              className="w-full px-3 py-2 border border-input rounded-md bg-background mt-2"
                            >
                              {availableModels.map((model) => (
                                <option key={model.id} value={model.id}>
                                  {model.name} ({model.provider})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="testMessage">Test Message</Label>
                            <textarea
                              id="testMessage"
                              value={testMessage}
                              onChange={(e) => setTestMessage(e.target.value)}
                              placeholder="Enter a test message for the AI model..."
                              className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-[100px] mt-2"
                            />
                          </div>
                          <Button onClick={handleTestModel} disabled={testingModel} className="w-full">
                            {testingModel ? 'Testing...' : 'Test Model'}
                          </Button>
                        </div>

                        {/* Test Results */}
                        {testResult && (
                          <div className="p-4 bg-muted rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold">Response:</p>
                              <Badge variant="secondary">{testResult.model}</Badge>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{testResult.content}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t">
                              <span>
                                Tokens: {testResult.usage.totalTokens} (
                                {testResult.usage.inputTokens} in, {testResult.usage.outputTokens} out)
                              </span>
                              <span>Cost: ${testResult.cost.toFixed(4)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
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
                        <div className="flex items-center">
                          <Bell className="w-4 h-4 mr-2 text-primary" />
                          <Label className="font-medium">Email Notifications</Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Receive email updates about your account activity
                        </p>
                      </div>
                      <button
                        onClick={() => setEmailNotifications(!emailNotifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          emailNotifications ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            emailNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
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
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          pushNotifications ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            pushNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
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
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          weeklyReport ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            weeklyReport ? 'translate-x-6' : 'translate-x-1'
                          }`}
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
            </motion.div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
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

                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Key className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">API Keys</p>
                          <p className="text-sm text-muted-foreground">
                            Manage your API access keys
                          </p>
                        </div>
                      </div>
                      <Button variant="outline">Manage Keys</Button>
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
            </motion.div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>
                    You are currently on the Pro plan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border-2 border-primary rounded-lg bg-primary/5">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-2xl font-bold">Pro Plan</h3>
                        <Badge className="bg-primary">Current</Badge>
                      </div>
                      <p className="text-3xl font-bold mb-2">$49<span className="text-lg font-normal text-muted-foreground">/month</span></p>
                      <ul className="space-y-2">
                        <li className="flex items-center text-sm">
                          <Check className="w-4 h-4 mr-2 text-green-600" />
                          Unlimited AI Credits
                        </li>
                        <li className="flex items-center text-sm">
                          <Check className="w-4 h-4 mr-2 text-green-600" />
                          Advanced Analytics
                        </li>
                        <li className="flex items-center text-sm">
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

              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>
                    View and download your invoices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { date: 'Feb 15, 2025', amount: '$49.00', status: 'Paid' },
                      { date: 'Jan 15, 2025', amount: '$49.00', status: 'Paid' },
                      { date: 'Dec 15, 2024', amount: '$49.00', status: 'Paid' },
                    ].map((invoice, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium">{invoice.date}</p>
                          <p className="text-sm text-muted-foreground">{invoice.amount}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{invoice.status}</Badge>
                          <Button variant="ghost" size="sm">Download</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Appearance Settings</CardTitle>
                  <CardDescription>
                    Customize how AssetWorks looks on your device
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Theme Selection */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold mb-4 block">Theme</Label>
                      <div className="grid grid-cols-3 gap-4">
                        <button
                          onClick={() => setTheme('light')}
                          className={`p-3 border-2 rounded-lg transition-all ${
                            theme === 'light' ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
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
                            Coming Soon
                          </Badge>
                          <Moon className="w-6 h-6 mx-auto mb-2" />
                          <p className="font-medium">Dark</p>
                        </button>
                        <button
                          onClick={() => setTheme('system')}
                          className={`p-3 border-2 rounded-lg transition-all ${
                            theme === 'system' ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                        >
                          <Monitor className="w-6 h-6 mx-auto mb-2" />
                          <p className="font-medium">System</p>
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">
                        Dark mode is coming soon! We're working hard to bring you a beautiful dark theme.
                      </p>
                    </div>
                  </div>

                  {/* Brand Colors */}
                  <div className="pt-4 border-t">
                    <Label className="text-base font-semibold mb-4 block flex items-center">
                      <Palette className="w-4 h-4 mr-2 text-primary" />
                      Brand Colors
                    </Label>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="space-y-2">
                        <div className="h-16 rounded-lg bg-primary"></div>
                        <p className="text-xs text-center">Primary Navy</p>
                      </div>
                      <div className="space-y-2">
                        <div className="h-16 rounded-lg bg-secondary"></div>
                        <p className="text-xs text-center">Selection Blue</p>
                      </div>
                      <div className="space-y-2">
                        <div className="h-16 rounded-lg bg-green-600"></div>
                        <p className="text-xs text-center">Success</p>
                      </div>
                      <div className="space-y-2">
                        <div className="h-16 rounded-lg bg-destructive"></div>
                        <p className="text-xs text-center">Danger</p>
                      </div>
                    </div>
                  </div>

                  {/* Custom Branding - Coming Soon */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-semibold flex items-center">
                        <Sparkles className="w-4 h-4 mr-2 text-primary" />
                        Custom Branding
                      </Label>
                      <Badge variant="secondary" className="text-xs">
                        Coming Soon
                      </Badge>
                    </div>
                    <div className="p-6 bg-muted/30 rounded-lg border-2 border-dashed border-border">
                      <div className="text-center space-y-3">
                        <div className="flex justify-center">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-primary" />
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground mb-2">
                            Personalize Your Experience
                          </p>
                          <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Soon you'll be able to customize your logo, brand colors, and create a fully personalized AssetWorks experience for your team.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 max-w-2xl mx-auto">
                          <div className="p-3 bg-background rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                <Settings className="w-4 h-4 text-primary" />
                              </div>
                              <p className="font-medium text-sm">Custom Logo</p>
                            </div>
                            <p className="text-xs text-muted-foreground">Upload your company logo</p>
                          </div>
                          <div className="p-3 bg-background rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                <Palette className="w-4 h-4 text-primary" />
                              </div>
                              <p className="font-medium text-sm">Brand Colors</p>
                            </div>
                            <p className="text-xs text-muted-foreground">Match your brand identity</p>
                          </div>
                          <div className="p-3 bg-background rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                <Globe className="w-4 h-4 text-primary" />
                              </div>
                              <p className="font-medium text-sm">Custom Domain</p>
                            </div>
                            <p className="text-xs text-muted-foreground">Use your own domain</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
