'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
  Moon,
  Sun,
  Monitor,
  Settings,
  Check,
  Plus,
  Trash2,
  Copy,
  Database,
  Brain,
  DollarSign,
  BarChart3,
  Zap,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  ChevronUp,
  ChevronDown,
  Edit,
  BookOpen,
  Save,
  X,
} from 'lucide-react';
import { showToast } from '@/lib/utils/toast';
import { getProviderIcon } from '@/lib/utils/ai-provider-icons';
import { getAllModels, AIModel } from '@/lib/utils/ai-models-config';
import { cn } from '@/lib/utils';
import { ProgressiveLoader } from '@/components/ui/progressive-loader';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Loading states for each data source
  const [loadingStates, setLoadingStates] = useState({
    apiKeys: true,
    financialDataKeys: true,
    aiModels: true,
    systemPrompts: true,
  });

  // Initial page load state
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [initialLoadingStage, setInitialLoadingStage] = useState(0);

  // Progressive loader stages for initial data fetch
  const initialLoadingStages = [
    { name: 'Loading API keys', estimatedDuration: 400, weight: 1 },
    { name: 'Loading financial data sources', estimatedDuration: 400, weight: 1 },
    { name: 'Loading AI models', estimatedDuration: 500, weight: 1 },
    { name: 'Loading system prompts', estimatedDuration: 400, weight: 1 },
  ];

  // Active section management with URL sync
  const [activeSection, setActiveSection] = useState(searchParams.get('section') || 'profile');

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
  const [showAddKey, setShowAddKey] = useState(false);
  const [testingKeys, setTestingKeys] = useState<Set<string>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<Record<string, any>>({});
  const [newKey, setNewKey] = useState({
    name: '',
    provider: '',
    category: 'financial_data',
    apiKey: '',
  });

  // AI Models state
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [showAddAiKey, setShowAddAiKey] = useState(false);
  const [newAiKey, setNewAiKey] = useState({
    name: '',
    provider: '',
    apiKey: '',
  });

  // System Prompts state
  const [systemPrompts, setSystemPrompts] = useState<any[]>([]);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [newPrompt, setNewPrompt] = useState({
    name: '',
    description: '',
    content: '',
    category: 'financial',
  });
  const [editedPromptData, setEditedPromptData] = useState<Record<string, {
    name: string;
    description: string;
    content: string;
  }>>({});

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
  });

  // Navigation items
  const navigationItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'data-integration', label: 'Data Integration', icon: Database },
    { id: 'ai-models', label: 'AI Models', icon: Brain },
    { id: 'system-prompts', label: 'System Prompts', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  // Sync active section with URL parameter
  useEffect(() => {
    const section = searchParams.get('section');
    if (section && section !== activeSection) {
      setActiveSection(section);
    }
  }, [searchParams, activeSection]);

  // Fetch data on mount
  useEffect(() => {
    if (status === 'authenticated') {
      const loadAllData = async () => {
        setIsInitialLoading(true);
        setInitialLoadingStage(0);

        // Load data in parallel for much faster page load!
        // Track completion to update progress
        let completed = 0;
        const updateStage = () => {
          completed++;
          setInitialLoadingStage(completed);
        };

        await Promise.all([
          fetchApiKeys().then(updateStage),
          fetchFinancialDataKeys().then(updateStage),
          fetchAIModels().then(updateStage),
          fetchSystemPrompts().then(updateStage),
        ]);

        // Complete loading
        setIsInitialLoading(false);
      };

      loadAllData();
    }
  }, [status]);

  const fetchApiKeys = async () => {
    setLoadingStates(prev => ({ ...prev, apiKeys: true }));
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      if (data.success) {
        setApiKeys(data.keys);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, apiKeys: false }));
    }
  };

  const fetchFinancialDataKeys = async () => {
    setLoadingStates(prev => ({ ...prev, financialDataKeys: true }));
    try {
      const res = await fetch('/api/settings/financial-data');
      const data = await res.json();
      if (data.success) {
        setFinancialDataKeys(data.keys);
      }
    } catch (error) {
      console.error('Failed to fetch financial data keys:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, financialDataKeys: false }));
    }
  };

  const fetchAIModels = async () => {
    setLoadingStates(prev => ({ ...prev, aiModels: true }));
    try {
      const res = await fetch('/api/ai/models');
      const data = await res.json();
      if (data.success) {
        setAvailableModels(data.available);
      }
    } catch (error) {
      console.error('Failed to fetch AI models:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, aiModels: false }));
    }
  };

  const fetchSystemPrompts = async () => {
    setLoadingStates(prev => ({ ...prev, systemPrompts: true }));
    try {
      const res = await fetch('/api/v2/prompts');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSystemPrompts(data);
      }
    } catch (error) {
      console.error('Failed to fetch system prompts:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, systemPrompts: false }));
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast.success('Profile updated successfully');
    } catch (error) {
      showToast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast.success('Notification preferences saved');
    } catch (error) {
      showToast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleAddApiKey = async () => {
    if (!newKey.name || !newKey.apiKey) {
      showToast.error('Please fill in all fields');
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
        showToast.success('Data integration added successfully');
        setApiKeys([...apiKeys, data.key]);
        setNewKey({ name: '', provider: '', category: 'financial_data', apiKey: '' });
        setShowAddKey(false);
        await fetchAIModels();
        await fetchFinancialDataKeys();
      } else {
        toast.error(data.error || 'Failed to add API key');
      }
    } catch (error) {
      showToast.error('Failed to add API key');
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
        showToast.success('API key deleted');
        setApiKeys(apiKeys.filter(k => k.id !== keyId));
        await fetchAIModels();
      } else {
        showToast.error('Failed to delete API key');
      }
    } catch (error) {
      showToast.error('Failed to delete API key');
    }
  };

  const handleCopyKey = (keyPreview: string) => {
    navigator.clipboard.writeText(keyPreview);
    showToast.success('Key preview copied');
  };

  const testConnection = async (keyId: string) => {
    setTestingKeys(prev => new Set(prev).add(keyId));

    try {
      const res = await fetch('/api/settings/financial-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId, checkAll: false }),
      });

      const data = await res.json();

      if (data.success && data.results?.length > 0) {
        const result = data.results[0];
        setConnectionStatus(prev => ({
          ...prev,
          [keyId]: {
            status: result.status,
            message: result.message,
            lastTested: new Date().toISOString(),
          }
        }));

        if (result.status === 'connected') {
          showToast.success(`✅ ${result.name} connection successful!`);
        } else {
          showToast.error(`❌ ${result.name}: ${result.message || 'Connection failed'}`);
        }
      } else {
        showToast.error('Failed to test connection');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      showToast.error('Failed to test connection');
      setConnectionStatus(prev => ({
        ...prev,
        [keyId]: {
          status: 'error',
          message: 'Test failed',
          lastTested: new Date().toISOString(),
        }
      }));
    } finally {
      setTestingKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(keyId);
        return newSet;
      });
    }
  };

  const handleAddAiKey = async () => {
    if (!newAiKey.name || !newAiKey.provider || !newAiKey.apiKey) {
      showToast.error('Please fill in all fields');
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
        showToast.success('AI provider added successfully');
        setApiKeys([...apiKeys, data.key]);
        setNewAiKey({ name: '', provider: '', apiKey: '' });
        setShowAddAiKey(false);
        await fetchAIModels();
      } else {
        showToast.error(data.error || 'Failed to add AI provider');
      }
    } catch (error) {
      showToast.error('Failed to add AI provider');
    } finally {
      setLoading(false);
    }
  };

  // System Prompts handlers
  const togglePromptExpansion = (promptId: string) => {
    setExpandedPrompts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(promptId)) {
        newSet.delete(promptId);
      } else {
        newSet.add(promptId);
      }
      return newSet;
    });
  };

  const handleAddPrompt = async () => {
    if (!newPrompt.name || !newPrompt.content) {
      showToast.error('Please fill in name and content');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v2/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrompt),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast.success('System prompt added successfully');
        await fetchSystemPrompts();
        setNewPrompt({ name: '', description: '', content: '', category: 'financial' });
        setShowAddPrompt(false);
      } else {
        showToast.error(data.error || 'Failed to add prompt');
      }
    } catch (error) {
      showToast.error('Failed to add prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPrompt = (promptId: string) => {
    const prompt = systemPrompts.find(p => p.id === promptId);
    if (prompt) {
      setEditedPromptData({
        ...editedPromptData,
        [promptId]: {
          name: prompt.name,
          description: prompt.description || '',
          content: prompt.content,
        },
      });
    }
    setEditingPrompt(promptId);
  };

  const handleSavePrompt = async (promptId: string) => {
    const updatedPrompt = editedPromptData[promptId];
    if (!updatedPrompt) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/v2/prompts/${promptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPrompt),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast.success('Prompt updated successfully');
        await fetchSystemPrompts();
        setEditingPrompt(null);
        // Clean up edited data
        const newEditedData = { ...editedPromptData };
        delete newEditedData[promptId];
        setEditedPromptData(newEditedData);
      } else {
        showToast.error(data.error || 'Failed to update prompt');
      }
    } catch (error) {
      showToast.error('Failed to update prompt');
    } finally {
      setLoading(false);
    }
  };

  const updateEditedPromptField = (promptId: string, field: 'name' | 'description' | 'content', value: string) => {
    setEditedPromptData({
      ...editedPromptData,
      [promptId]: {
        ...editedPromptData[promptId],
        [field]: value,
      },
    });
  };

  const cancelEditPrompt = (promptId: string) => {
    setEditingPrompt(null);
    const newEditedData = { ...editedPromptData };
    delete newEditedData[promptId];
    setEditedPromptData(newEditedData);
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) {
      return;
    }

    try {
      const res = await fetch(`/api/v2/prompts/${promptId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast.success('Prompt deleted');
        await fetchSystemPrompts();
      } else {
        showToast.error('Failed to delete prompt');
      }
    } catch (error) {
      showToast.error('Failed to delete prompt');
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

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    router.push(`/settings?section=${sectionId}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Settings className="h-6 w-6 text-gray-500 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Initial Loading Overlay */}
      {isInitialLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <ProgressiveLoader
              isLoading={isInitialLoading}
              stages={initialLoadingStages}
              currentStage={initialLoadingStage}
              variant="detailed"
              showElapsedTime={true}
              showEstimatedTime={true}
              message="Loading settings data..."
            />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700 border-l-4 border-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center">
                      <Icon className={cn(
                        "h-5 w-5 mr-3",
                        isActive ? "text-blue-700" : "text-gray-400"
                      )} />
                      {item.label}
                    </div>
                    {isActive && <ChevronRight className="h-4 w-4" />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {activeSection === 'profile' && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Update your personal information and email address
                  </p>
                </div>
                <div className="px-6 py-4 space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                      Company
                    </Label>
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Your Company Name"
                      className="mt-1"
                    />
                  </div>
                  <div className="pt-4 border-t">
                    <Button onClick={handleSaveProfile} disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'data-integration' && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Data Integration</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Connect your data sources for market data and analytics
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {financialDataKeys.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          showToast.loading('Testing all connections...', { id: 'test-all' });
                          for (const key of financialDataKeys) {
                            await testConnection(key.id);
                          }
                          showToast.dismiss('test-all');
                        }}
                        disabled={testingKeys.size > 0}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Test All
                      </Button>
                    )}
                    <Button size="sm" onClick={() => setShowAddKey(!showAddKey)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Integration
                    </Button>
                  </div>
                </div>
                <div className="px-6 py-4">
                  {showAddKey && (
                    <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Key Name</Label>
                          <Input
                            placeholder="e.g., Production API"
                            value={newKey.name}
                            onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Provider</Label>
                          <Select
                            value={newKey.provider}
                            onValueChange={(value) => setNewKey({ ...newKey, provider: value })}
                          >
                            <SelectTrigger className="mt-1">
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
                      <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700">API Key</Label>
                        <Input
                          type="password"
                          placeholder="Enter your API key"
                          value={newKey.apiKey}
                          onChange={(e) => setNewKey({ ...newKey, apiKey: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowAddKey(false)}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleAddApiKey} disabled={loading}>
                          {loading ? 'Adding...' : 'Add Key'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {loadingStates.financialDataKeys ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center flex-1">
                              <Skeleton className="h-5 w-5 mr-3" />
                              <div className="flex-1">
                                <Skeleton className="h-4 w-32 mb-2" />
                                <Skeleton className="h-3 w-48" />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-8 w-16" />
                              <Skeleton className="h-8 w-8" />
                              <Skeleton className="h-8 w-8" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : financialDataKeys.length === 0 ? (
                    <div className="text-center py-12">
                      <Database className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No integrations</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by adding your first data source
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {financialDataKeys.map((key) => {
                        const isTestingThis = testingKeys.has(key.id);
                        const status = connectionStatus[key.id];

                        return (
                          <div key={key.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <Database className="h-5 w-5 text-gray-400 mr-3" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{key.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {key.provider} • {key.keyPreview}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => testConnection(key.id)}
                                  disabled={isTestingThis}
                                  className="flex items-center gap-2"
                                >
                                  {isTestingThis ? (
                                    <>
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      Testing...
                                    </>
                                  ) : (
                                    <>
                                      <RefreshCw className="h-3 w-3" />
                                      Test
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyKey(key.keyPreview)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteApiKey(key.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>

                            {status && (
                              <div className={cn(
                                "mt-3 p-2 rounded-md flex items-center gap-2 text-sm",
                                status.status === 'connected'
                                  ? "bg-green-50 text-green-700 border border-green-200"
                                  : status.status === 'error'
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                              )}>
                                {status.status === 'connected' ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : status.status === 'error' ? (
                                  <XCircle className="h-4 w-4" />
                                ) : (
                                  <AlertCircle className="h-4 w-4" />
                                )}
                                <span className="font-medium">
                                  {status.status === 'connected' ? 'Connected' :
                                   status.status === 'error' ? 'Connection Failed' :
                                   'Unknown Status'}
                                </span>
                                {status.message && (
                                  <span className="ml-1">• {status.message}</span>
                                )}
                                {status.lastTested && (
                                  <span className="ml-auto text-xs opacity-70">
                                    Tested {new Date(status.lastTested).toLocaleTimeString()}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'ai-models' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Requests</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {usageStats.totalRequests.toLocaleString()}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Tokens</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {usageStats.totalTokens.toLocaleString()}
                        </p>
                      </div>
                      <Zap className="h-8 w-8 text-yellow-500" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Cost</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          ${usageStats.totalCost.toFixed(2)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                </div>

                {/* AI Provider Configuration */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">AI Provider Configuration</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Manage your AI provider API keys
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {apiKeys.filter(key => key.category === 'ai').length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            showToast.loading('Testing all AI connections...', { id: 'test-all-ai' });
                            for (const key of apiKeys.filter(k => k.category === 'ai')) {
                              await testConnection(key.id);
                            }
                            showToast.dismiss('test-all-ai');
                          }}
                          disabled={testingKeys.size > 0}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Test All
                        </Button>
                      )}
                      <Button size="sm" onClick={() => setShowAddAiKey(!showAddAiKey)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Provider
                      </Button>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    {showAddAiKey && (
                      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Provider Name</Label>
                            <Input
                              placeholder="e.g., Production OpenAI"
                              value={newAiKey.name}
                              onChange={(e) => setNewAiKey({ ...newAiKey, name: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">AI Provider</Label>
                            <Select
                              value={newAiKey.provider}
                              onValueChange={(value) => setNewAiKey({ ...newAiKey, provider: value })}
                            >
                              <SelectTrigger className="mt-1">
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
                        <div className="mb-4">
                          <Label className="text-sm font-medium text-gray-700">API Key</Label>
                          <Input
                            type="password"
                            placeholder="Enter your API key"
                            value={newAiKey.apiKey}
                            onChange={(e) => setNewAiKey({ ...newAiKey, apiKey: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setShowAddAiKey(false)}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleAddAiKey} disabled={loading}>
                            {loading ? 'Adding...' : 'Add Provider'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {loadingStates.aiModels ? (
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <div key={i} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center flex-1">
                                <Skeleton className="h-9 w-9 rounded-lg mr-3" />
                                <div className="flex-1">
                                  <Skeleton className="h-4 w-40 mb-2" />
                                  <Skeleton className="h-3 w-56" />
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-8 w-8" />
                                <Skeleton className="h-8 w-8" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : apiKeys.filter(key => key.category === 'ai').length === 0 ? (
                      <div className="text-center py-12">
                        <Brain className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No AI providers</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Add your first AI provider to get started
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {apiKeys.filter(key => key.category === 'ai').map((key) => {
                          const providerConfig = getProviderIcon(key.provider);
                          const ProviderIcon = providerConfig.icon;
                          const isTestingThis = testingKeys.has(key.id);
                          const status = connectionStatus[key.id];

                          return (
                            <div key={key.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <div className={`p-2 rounded-lg ${providerConfig.bgColor} mr-3`}>
                                    <ProviderIcon className={`h-5 w-5 ${providerConfig.color}`} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{key.name}</p>
                                    <p className="text-sm text-gray-500">
                                      {providerConfig.displayName} • {key.keyPreview}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => testConnection(key.id)}
                                    disabled={isTestingThis}
                                    className="flex items-center gap-2"
                                  >
                                    {isTestingThis ? (
                                      <>
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Testing...
                                      </>
                                    ) : (
                                      <>
                                        <RefreshCw className="h-3 w-3" />
                                        Test
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyKey(key.keyPreview)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteApiKey(key.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>

                              {status && (
                                <div className={cn(
                                  "mt-3 p-2 rounded-md flex items-center gap-2 text-sm",
                                  status.status === 'connected'
                                    ? "bg-green-50 text-green-700 border border-green-200"
                                    : status.status === 'error'
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                                )}>
                                  {status.status === 'connected' ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : status.status === 'error' ? (
                                    <XCircle className="h-4 w-4" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4" />
                                  )}
                                  <span className="font-medium">
                                    {status.status === 'connected' ? 'Connected' :
                                     status.status === 'error' ? 'Connection Failed' :
                                     'Unknown Status'}
                                  </span>
                                  {status.message && (
                                    <span className="ml-1">• {status.message}</span>
                                  )}
                                  {status.lastTested && (
                                    <span className="ml-auto text-xs opacity-70">
                                      Tested {new Date(status.lastTested).toLocaleTimeString()}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'system-prompts' && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">System Prompts</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Manage AI system prompts for different financial analysis scenarios
                    </p>
                  </div>
                  <Button size="sm" onClick={() => setShowAddPrompt(!showAddPrompt)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Prompt
                  </Button>
                </div>
                <div className="px-6 py-4">
                  {showAddPrompt && (
                    <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Prompt Name</Label>
                          <Input
                            placeholder="e.g., Financial Analysis"
                            value={newPrompt.name}
                            onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Category</Label>
                          <Select
                            value={newPrompt.category}
                            onValueChange={(value) => setNewPrompt({ ...newPrompt, category: value })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="financial">Financial Analysis</SelectItem>
                              <SelectItem value="market">Market Research</SelectItem>
                              <SelectItem value="general">General</SelectItem>
                              <SelectItem value="technical">Technical Analysis</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700">Description (Optional)</Label>
                        <Input
                          placeholder="Brief description of this prompt"
                          value={newPrompt.description}
                          onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700">Prompt Content</Label>
                        <Textarea
                          placeholder="Enter the system prompt content..."
                          value={newPrompt.content}
                          onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                          className="mt-1 min-h-[200px] font-mono text-sm"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          setShowAddPrompt(false);
                          setNewPrompt({ name: '', description: '', content: '', category: 'financial' });
                        }}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleAddPrompt} disabled={loading}>
                          {loading ? 'Adding...' : 'Add Prompt'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {loadingStates.systemPrompts ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center flex-1">
                              <Skeleton className="h-4 w-4 mr-2" />
                              <div className="flex-1">
                                <Skeleton className="h-4 w-48 mb-2" />
                                <Skeleton className="h-3 w-64" />
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Skeleton className="h-8 w-8" />
                              <Skeleton className="h-8 w-8" />
                              <Skeleton className="h-8 w-8" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : systemPrompts.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No system prompts</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Create your first system prompt to customize AI responses
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {systemPrompts.map((prompt: any) => {
                        const isExpanded = expandedPrompts.has(prompt.id);
                        const isEditing = editingPrompt === prompt.id;
                        const editedData = editedPromptData[prompt.id] || {
                          name: prompt.name,
                          description: prompt.description || '',
                          content: prompt.content,
                        };

                        return (
                          <div key={prompt.id} className="border rounded-lg">
                            <div className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  {isEditing ? (
                                    <div className="space-y-3">
                                      <div>
                                        <Label className="text-xs text-gray-600">Name</Label>
                                        <Input
                                          value={editedData.name}
                                          onChange={(e) => updateEditedPromptField(prompt.id, 'name', e.target.value)}
                                          className="mt-1"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-600">Description</Label>
                                        <Input
                                          value={editedData.description}
                                          onChange={(e) => updateEditedPromptField(prompt.id, 'description', e.target.value)}
                                          className="mt-1"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-center gap-2 mb-1">
                                        <FileText className="h-4 w-4 text-gray-400" />
                                        <h3 className="text-sm font-medium text-gray-900">{prompt.name}</h3>
                                        <Badge variant="secondary" className="text-xs">
                                          {prompt.category}
                                        </Badge>
                                      </div>
                                      {prompt.description && (
                                        <p className="text-sm text-gray-500 ml-6">{prompt.description}</p>
                                      )}
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 ml-4">
                                  {isEditing ? (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSavePrompt(prompt.id)}
                                        disabled={loading}
                                      >
                                        <Save className="h-4 w-4 text-green-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => cancelEditPrompt(prompt.id)}
                                      >
                                        <X className="h-4 w-4 text-gray-600" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => togglePromptExpansion(prompt.id)}
                                      >
                                        {isExpanded ? (
                                          <ChevronUp className="h-4 w-4" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditPrompt(prompt.id)}
                                      >
                                        <Edit className="h-4 w-4 text-blue-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeletePrompt(prompt.id)}
                                      >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="mt-4 pt-4 border-t">
                                  {isEditing ? (
                                    <div>
                                      <Label className="text-xs text-gray-600 mb-2 block">Content</Label>
                                      <Textarea
                                        value={editedData.content}
                                        onChange={(e) => updateEditedPromptField(prompt.id, 'content', e.target.value)}
                                        className="font-mono text-sm min-h-[300px]"
                                      />
                                    </div>
                                  ) : (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <Label className="text-xs font-medium text-gray-600">Prompt Content</Label>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            navigator.clipboard.writeText(prompt.content);
                                            showToast.success('Prompt copied to clipboard');
                                          }}
                                        >
                                          <Copy className="h-3 w-3 mr-1" />
                                          Copy
                                        </Button>
                                      </div>
                                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                                        {prompt.content}
                                      </pre>
                                      {prompt.updatedAt && (
                                        <p className="text-xs text-gray-500 mt-3 pt-3 border-t">
                                          Last updated: {new Date(prompt.updatedAt).toLocaleString()}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-medium text-gray-900">Notification Preferences</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Choose how you want to be notified
                  </p>
                </div>
                <div className="px-6 py-4 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-500">
                        Receive email updates about your account activity
                      </p>
                    </div>
                    <button
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
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
                    <div>
                      <p className="text-sm font-medium text-gray-900">Push Notifications</p>
                      <p className="text-sm text-gray-500">
                        Receive push notifications on your devices
                      </p>
                    </div>
                    <button
                      onClick={() => setPushNotifications(!pushNotifications)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
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
                    <div>
                      <p className="text-sm font-medium text-gray-900">Weekly Report</p>
                      <p className="text-sm text-gray-500">
                        Get a weekly summary of your activity
                      </p>
                    </div>
                    <button
                      onClick={() => setWeeklyReport(!weeklyReport)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        weeklyReport ? 'bg-blue-600' : 'bg-gray-200'
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

                  <div className="pt-4 border-t">
                    <Button onClick={handleSaveNotifications} disabled={loading}>
                      {loading ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b">
                    <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Manage your password and security preferences
                    </p>
                  </div>
                  <div className="px-6 py-4 space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center">
                        <Key className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Password</p>
                          <p className="text-sm text-gray-500">Last changed 3 months ago</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Change Password
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                          <p className="text-sm text-gray-500">Add an extra layer of security</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Not Enabled</Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow border border-red-200">
                  <div className="px-6 py-4 border-b border-red-200">
                    <h2 className="text-lg font-medium text-red-600">Danger Zone</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Irreversible and destructive actions
                    </p>
                  </div>
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Delete Account</p>
                        <p className="text-sm text-gray-500">
                          Permanently delete your account and all data
                        </p>
                      </div>
                      <Button variant="destructive" size="sm">
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'billing' && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-medium text-gray-900">Billing & Subscription</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage your subscription and payment methods
                  </p>
                </div>
                <div className="px-6 py-4 space-y-6">
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-semibold text-gray-900">Pro Plan</h3>
                          <Badge className="bg-blue-600">Current Plan</Badge>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-4">
                          $49<span className="text-base font-normal text-gray-600">/month</span>
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <Check className="h-4 w-4 text-green-600 mr-2" />
                            <span className="text-gray-700">Unlimited AI Credits</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Check className="h-4 w-4 text-green-600 mr-2" />
                            <span className="text-gray-700">Advanced Analytics</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Check className="h-4 w-4 text-green-600 mr-2" />
                            <span className="text-gray-700">Priority Support</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 mb-1">Next billing date</p>
                        <p className="font-medium text-gray-900 mb-4">March 15, 2025</p>
                        <Button variant="outline" size="sm">
                          Manage Plan
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Method</h4>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-lg mr-3">
                          <CreditCard className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">•••• •••• •••• 4242</p>
                          <p className="text-sm text-gray-500">Expires 12/2025</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Update
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-medium text-gray-900">Appearance Settings</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Customize how AssetWorks looks on your device
                  </p>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-700">Theme</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        onClick={() => setTheme('light')}
                        className={cn(
                          "p-4 border-2 rounded-lg transition-all",
                          theme === 'light'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <Sun className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                        <p className="text-sm font-medium text-gray-900">Light</p>
                      </button>

                      <button
                        disabled
                        className="p-4 border-2 border-gray-200 rounded-lg opacity-60 cursor-not-allowed relative"
                      >
                        <Badge
                          variant="secondary"
                          className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5"
                        >
                          Soon
                        </Badge>
                        <Moon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900">Dark</p>
                      </button>

                      <button
                        onClick={() => setTheme('system')}
                        className={cn(
                          "p-4 border-2 rounded-lg transition-all",
                          theme === 'system'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <Monitor className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                        <p className="text-sm font-medium text-gray-900">System</p>
                      </button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Dark mode is coming soon! We're working hard to bring you a beautiful dark theme.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}