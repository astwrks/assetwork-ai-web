'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings as SettingsIcon,
  Save,
  Loader2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Palette,
  Cpu,
  FileText,
  Sliders,
  Check,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SystemPrompt {
  id: string;
  name: string;
  description: string;
  content?: string;
}

interface AIModel {
  id: string;
  name: string;
  displayName: string;
  enabled: boolean;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

interface AIProvider {
  id: string;
  name: string;
  enabled: boolean;
  apiKeyRequired: boolean;
  models: AIModel[];
}

interface PlaygroundSettings {
  _id: string;
  userId: string;
  systemPrompt: string;
  systemPromptVersion: number;
  providers: AIProvider[];
  defaultProvider: string;
  defaultModel: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
  defaultTopP: number;
  allowCustomPrompts: boolean;
  allowProviderSelection: boolean;
  allowModelSelection: boolean;
  allowParameterOverride: boolean;
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  updatedAt: string;
  lastModifiedBy: string;
}

export default function PlaygroundSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [settings, setSettings] = useState<PlaygroundSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('prompt');

  // System Prompts state
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [activeSystemPromptId, setActiveSystemPromptId] = useState<string>('web-report');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Load settings
  useEffect(() => {
    if (session) {
      loadSettings();
    }
  }, [session]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/playground/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);

        // Load system prompts if available
        if (data.settings?.systemPrompts) {
          setSystemPrompts(data.settings.systemPrompts);
          setActiveSystemPromptId(data.settings.activeSystemPromptId || 'web-report');
        }
      } else {
        toast.error('Failed to load settings');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setIsSaving(true);
      const response = await fetch('/api/playground/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setHasChanges(false);
        toast.success('Settings saved successfully');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = (updates: Partial<PlaygroundSettings>) => {
    if (settings) {
      setSettings({ ...settings, ...updates });
      setHasChanges(true);
    }
  };

  const toggleProviderEnabled = (providerId: string) => {
    if (!settings) return;
    const updatedProviders = settings.providers.map((p) =>
      p.id === providerId ? { ...p, enabled: !p.enabled } : p
    );
    updateSettings({ providers: updatedProviders });
  };

  const toggleModelEnabled = (providerId: string, modelId: string) => {
    if (!settings) return;
    const updatedProviders = settings.providers.map((p) =>
      p.id === providerId
        ? {
            ...p,
            models: p.models.map((m) =>
              m.id === modelId ? { ...m, enabled: !m.enabled } : m
            ),
          }
        : p
    );
    updateSettings({ providers: updatedProviders });
  };

  const updateModelParameters = (
    providerId: string,
    modelId: string,
    params: Partial<AIModel>
  ) => {
    if (!settings) return;
    const updatedProviders = settings.providers.map((p) =>
      p.id === providerId
        ? {
            ...p,
            models: p.models.map((m) =>
              m.id === modelId ? { ...m, ...params } : m
            ),
          }
        : p
    );
    updateSettings({ providers: updatedProviders });
  };

  // Switch system prompt
  const switchSystemPrompt = async (promptId: string) => {
    try {
      const response = await fetch('/api/playground/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeSystemPromptId: promptId }),
      });

      if (response.ok) {
        setActiveSystemPromptId(promptId);
        const selectedPrompt = systemPrompts.find(p => p.id === promptId);
        toast.success(`Switched to ${selectedPrompt?.name || 'new prompt'}`);
        // Reload settings to get the new system prompt content
        await loadSettings();
      } else {
        toast.error('Failed to switch system prompt');
      }
    } catch (error) {
      console.error('Error switching system prompt:', error);
      toast.error('Failed to switch system prompt');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to Load Settings</h2>
        <Button onClick={loadSettings} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/financial-playground')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Playground
              </Button>
              <div className="flex items-center gap-3">
                <SettingsIcon className="w-6 h-6 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-primary">
                    Playground Settings
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Configure AI providers, models, and system prompts
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <span className="text-sm text-amber-600 font-medium">
                  Unsaved changes
                </span>
              )}
              <Button
                onClick={saveSettings}
                disabled={!hasChanges || isSaving}
                className="bg-primary hover:bg-primary/90"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="prompt" className="gap-2">
              <FileText className="w-4 h-4" />
              System Prompt
            </TabsTrigger>
            <TabsTrigger value="providers" className="gap-2">
              <Cpu className="w-4 h-4" />
              AI Providers
            </TabsTrigger>
            <TabsTrigger value="parameters" className="gap-2">
              <Sliders className="w-4 h-4" />
              Parameters
            </TabsTrigger>
            <TabsTrigger value="branding" className="gap-2">
              <Palette className="w-4 h-4" />
              Branding
            </TabsTrigger>
          </TabsList>

          {/* System Prompt Tab */}
          <TabsContent value="prompt" className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-primary mb-2">
                  System Prompt Configuration
                </h3>
                <p className="text-sm text-muted-foreground">
                  The system prompt defines how the AI generates financial reports.
                  This prompt is sent with every request.
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Version: {settings.systemPromptVersion}</span>
                  <span>·</span>
                  <span>
                    Last modified: {new Date(settings.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {/* System Prompt Selector */}
                {systemPrompts.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Active System Prompt
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {systemPrompts.map((prompt) => {
                        const isActive = activeSystemPromptId === prompt.id;
                        return (
                          <button
                            key={prompt.id}
                            onClick={() => switchSystemPrompt(prompt.id)}
                            className={`p-4 border-2 rounded-lg text-left transition-all ${
                              isActive
                                ? 'border-primary bg-primary/5 shadow-md'
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-foreground">{prompt.name}</h4>
                                {isActive && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                                    <Check className="w-3 h-3" />
                                    Active
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{prompt.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    System Prompt Content
                  </label>
                  <textarea
                    value={settings.systemPrompt}
                    onChange={(e) =>
                      updateSettings({ systemPrompt: e.target.value })
                    }
                    className="w-full h-96 p-4 border border-border rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter your system prompt..."
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {settings.systemPrompt.length} characters
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">Prompt Best Practices:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-800">
                        <li>Be specific about output format (HTML, JSON, etc.)</li>
                        <li>Define section types and structure requirements</li>
                        <li>Include brand color specifications</li>
                        <li>Specify data visualization preferences</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* AI Providers Tab */}
          <TabsContent value="providers" className="space-y-4">
            <div className="space-y-4">
              {settings.providers.map((provider) => (
                <div key={provider.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Cpu className="w-6 h-6 text-primary" />
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {provider.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {provider.models.length} models available
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={provider.enabled ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleProviderEnabled(provider.id)}
                      className={
                        provider.enabled
                          ? 'bg-primary hover:bg-primary/90'
                          : ''
                      }
                    >
                      {provider.enabled ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Enabled
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Disabled
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {provider.models.map((model) => (
                      <div
                        key={model.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {model.displayName}
                            </span>
                            {settings.defaultProvider === provider.id &&
                              settings.defaultModel === model.id && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                  Default
                                </span>
                              )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {model.name}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-muted-foreground">
                            {model.maxTokens?.toLocaleString()} tokens
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleModelEnabled(provider.id, model.id)
                            }
                          >
                            {model.enabled ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <X className="w-4 h-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Parameters Tab */}
          <TabsContent value="parameters" className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-4">
                  Default Generation Parameters
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Default Provider
                    </label>
                    <select
                      value={settings.defaultProvider}
                      onChange={(e) =>
                        updateSettings({ defaultProvider: e.target.value })
                      }
                      className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                    >
                      {settings.providers
                        .filter((p) => p.enabled)
                        .map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Default Model
                    </label>
                    <select
                      value={settings.defaultModel}
                      onChange={(e) =>
                        updateSettings({ defaultModel: e.target.value })
                      }
                      className="w-full p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                    >
                      {settings.providers
                        .find((p) => p.id === settings.defaultProvider)
                        ?.models.filter((m) => m.enabled)
                        .map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.displayName}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Temperature: {settings.defaultTemperature}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={settings.defaultTemperature}
                      onChange={(e) =>
                        updateSettings({
                          defaultTemperature: parseFloat(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Controls randomness. Lower = more focused, Higher = more creative
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Max Tokens
                    </label>
                    <Input
                      type="number"
                      value={settings.defaultMaxTokens}
                      onChange={(e) =>
                        updateSettings({
                          defaultMaxTokens: parseInt(e.target.value),
                        })
                      }
                      min="256"
                      max="32000"
                      step="256"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum length of generated response
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Top P: {settings.defaultTopP}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.defaultTopP}
                      onChange={(e) =>
                        updateSettings({ defaultTopP: parseFloat(e.target.value) })
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Nucleus sampling parameter
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h4 className="text-md font-semibold text-foreground mb-4">
                  Feature Permissions
                </h4>
                <div className="space-y-3">
                  {[
                    {
                      key: 'allowProviderSelection',
                      label: 'Allow Provider Selection',
                      description: 'Users can choose different AI providers',
                    },
                    {
                      key: 'allowModelSelection',
                      label: 'Allow Model Selection',
                      description: 'Users can choose different models',
                    },
                    {
                      key: 'allowParameterOverride',
                      label: 'Allow Parameter Override',
                      description: 'Users can adjust temperature and other parameters',
                    },
                    {
                      key: 'allowCustomPrompts',
                      label: 'Allow Custom Prompts',
                      description: 'Users can modify the system prompt',
                    },
                  ].map((feature) => (
                    <label
                      key={feature.key}
                      className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        checked={settings[feature.key as keyof PlaygroundSettings] as boolean}
                        onChange={(e) =>
                          updateSettings({ [feature.key]: e.target.checked })
                        }
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-sm">{feature.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {feature.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-primary mb-4">
                Brand Colors
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Customize the color scheme used in generated reports
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(settings.brandColors).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-foreground mb-2 capitalize">
                      {key} Color
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={value}
                        onChange={(e) =>
                          updateSettings({
                            brandColors: {
                              ...settings.brandColors,
                              [key]: e.target.value,
                            },
                          })
                        }
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={value}
                        onChange={(e) =>
                          updateSettings({
                            brandColors: {
                              ...settings.brandColors,
                              [key]: e.target.value,
                            },
                          })
                        }
                        className="flex-1 font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 border border-border rounded-lg">
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  Preview
                </h4>
                <div className="grid grid-cols-5 gap-3">
                  {Object.entries(settings.brandColors).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div
                        className="w-full h-16 rounded-lg border border-border mb-2"
                        style={{ backgroundColor: value }}
                      />
                      <div className="text-xs text-muted-foreground capitalize">
                        {key}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
