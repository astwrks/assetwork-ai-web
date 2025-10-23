/**
 * Playground Settings Component
 * Manages user preferences and configuration for Financial Playground
 * Uses existing /api/playground/settings API
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Brain,
  FileText,
  Palette,
  Bell,
  Shield,
  Database,
  RefreshCw,
  Save,
  RotateCcw,
  Info,
  Zap,
  Globe,
  Key,
  Download,
  Upload,
  Check,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface PlaygroundSettingsData {
  // AI Settings
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  streamResponses: boolean;
  autoGenerateReports: boolean;
  reportGenerationDelay: number;

  // Report Settings
  reportFormat: 'markdown' | 'html' | 'pdf';
  includeCharts: boolean;
  includeEntityExtraction: boolean;
  sectionAutoExpand: boolean;
  defaultReportSections: string[];

  // UI Preferences
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  showTokenUsage: boolean;
  showCostEstimates: boolean;
  enableAnimations: boolean;

  // Notification Settings
  enableNotifications: boolean;
  notifyOnReportComplete: boolean;
  notifyOnErrors: boolean;
  soundEnabled: boolean;

  // Data & Privacy
  saveHistory: boolean;
  shareCrashReports: boolean;
  allowTelemetry: boolean;
  dataRetentionDays: number;
}

interface PlaygroundSettingsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

export function PlaygroundSettings({ isOpen, onOpenChange, className }: PlaygroundSettingsProps) {
  const [settings, setSettings] = useState<PlaygroundSettingsData>({
    // AI Settings defaults
    defaultModel: 'claude-3.5-sonnet',
    temperature: 0.7,
    maxTokens: 4096,
    streamResponses: true,
    autoGenerateReports: false,
    reportGenerationDelay: 3,

    // Report Settings defaults
    reportFormat: 'html',
    includeCharts: true,
    includeEntityExtraction: true,
    sectionAutoExpand: true,
    defaultReportSections: ['summary', 'analysis', 'recommendations'],

    // UI Preferences defaults
    theme: 'system',
    compactMode: false,
    showTokenUsage: true,
    showCostEstimates: true,
    enableAnimations: true,

    // Notification Settings defaults
    enableNotifications: true,
    notifyOnReportComplete: true,
    notifyOnErrors: true,
    soundEnabled: false,

    // Data & Privacy defaults
    saveHistory: true,
    shareCrashReports: false,
    allowTelemetry: false,
    dataRetentionDays: 30,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<PlaygroundSettingsData | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/playground/settings', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const loadedSettings = data.settings || data;
        setSettings(loadedSettings);
        setOriginalSettings(loadedSettings);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Could not load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/playground/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setOriginalSettings(settings);
      setHasChanges(false);
      toast.success('Settings saved successfully');

      // Apply some settings immediately
      if (settings.theme !== 'system') {
        document.documentElement.classList.toggle('dark', settings.theme === 'dark');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Could not save settings');

      // Fallback: Save to localStorage
      localStorage.setItem('playground_settings', JSON.stringify(settings));
      toast.info('Settings saved locally');
    } finally {
      setIsSaving(false);
    }
  };

  const resetSettings = () => {
    if (originalSettings) {
      setSettings(originalSettings);
      setHasChanges(false);
      toast.info('Settings reset to last saved state');
    }
  };

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'playground-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Settings exported');
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setSettings(imported);
        setHasChanges(true);
        toast.success('Settings imported successfully');
      } catch (error) {
        toast.error('Invalid settings file');
      }
    };
    reader.readAsText(file);
  };

  const updateSetting = <K extends keyof PlaygroundSettingsData>(
    key: K,
    value: PlaygroundSettingsData[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const modelOptions = [
    { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', badge: 'Recommended' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus', badge: 'Most Capable' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4o', label: 'GPT-4o', badge: 'Fast' },
    { value: 'gemini-pro', label: 'Gemini Pro' },
  ];

  const sectionOptions = [
    'summary',
    'analysis',
    'fundamentals',
    'technicals',
    'sentiment',
    'recommendations',
    'risks',
    'opportunities'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Playground Settings
          </DialogTitle>
          <DialogDescription>
            Customize your Financial Playground experience
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="ai" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="ai"><Brain className="w-4 h-4 mr-1" />AI</TabsTrigger>
              <TabsTrigger value="reports"><FileText className="w-4 h-4 mr-1" />Reports</TabsTrigger>
              <TabsTrigger value="ui"><Palette className="w-4 h-4 mr-1" />UI</TabsTrigger>
              <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-1" />Alerts</TabsTrigger>
              <TabsTrigger value="privacy"><Shield className="w-4 h-4 mr-1" />Privacy</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-1">
              {/* AI Settings */}
              <TabsContent value="ai" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="model">Default AI Model</Label>
                    <Select value={settings.defaultModel} onValueChange={(value) => updateSetting('defaultModel', value)}>
                      <SelectTrigger id="model">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {modelOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center justify-between w-full">
                              <span>{option.label}</span>
                              {option.badge && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  {option.badge}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="temperature">Temperature: {settings.temperature}</Label>
                      <Badge variant="outline">{settings.temperature}</Badge>
                    </div>
                    <Slider
                      id="temperature"
                      value={[settings.temperature]}
                      onValueChange={([value]) => updateSetting('temperature', value)}
                      min={0}
                      max={1}
                      step={0.1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Higher values make responses more creative
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="maxTokens">Max Tokens</Label>
                      <Badge variant="outline">{settings.maxTokens}</Badge>
                    </div>
                    <Slider
                      id="maxTokens"
                      value={[settings.maxTokens]}
                      onValueChange={([value]) => updateSetting('maxTokens', value)}
                      min={1024}
                      max={8192}
                      step={512}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Stream Responses</Label>
                      <p className="text-xs text-muted-foreground">
                        Show AI responses as they're generated
                      </p>
                    </div>
                    <Switch
                      checked={settings.streamResponses}
                      onCheckedChange={(checked) => updateSetting('streamResponses', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-Generate Reports</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically create reports after AI responses
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoGenerateReports}
                      onCheckedChange={(checked) => updateSetting('autoGenerateReports', checked)}
                    />
                  </div>

                  {settings.autoGenerateReports && (
                    <div className="space-y-2 pl-4 border-l-2">
                      <Label>Generation Delay (seconds)</Label>
                      <Input
                        type="number"
                        value={settings.reportGenerationDelay}
                        onChange={(e) => updateSetting('reportGenerationDelay', parseInt(e.target.value))}
                        min={1}
                        max={10}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Report Settings */}
              <TabsContent value="reports" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default Report Format</Label>
                    <Select value={settings.reportFormat} onValueChange={(value: any) => updateSetting('reportFormat', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="markdown">Markdown</SelectItem>
                        <SelectItem value="html">HTML</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Include Charts</Label>
                      <p className="text-xs text-muted-foreground">
                        Add visualizations to reports
                      </p>
                    </div>
                    <Switch
                      checked={settings.includeCharts}
                      onCheckedChange={(checked) => updateSetting('includeCharts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Entity Extraction</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically identify companies and entities
                      </p>
                    </div>
                    <Switch
                      checked={settings.includeEntityExtraction}
                      onCheckedChange={(checked) => updateSetting('includeEntityExtraction', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-Expand Sections</Label>
                      <p className="text-xs text-muted-foreground">
                        Expand report sections by default
                      </p>
                    </div>
                    <Switch
                      checked={settings.sectionAutoExpand}
                      onCheckedChange={(checked) => updateSetting('sectionAutoExpand', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Default Report Sections</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {sectionOptions.map(section => (
                        <div key={section} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={settings.defaultReportSections.includes(section)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                updateSetting('defaultReportSections', [...settings.defaultReportSections, section]);
                              } else {
                                updateSetting('defaultReportSections', settings.defaultReportSections.filter(s => s !== section));
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <Label className="text-sm capitalize">{section}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* UI Preferences */}
              <TabsContent value="ui" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select value={settings.theme} onValueChange={(value: any) => updateSetting('theme', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Compact Mode</Label>
                      <p className="text-xs text-muted-foreground">
                        Reduce spacing and padding
                      </p>
                    </div>
                    <Switch
                      checked={settings.compactMode}
                      onCheckedChange={(checked) => updateSetting('compactMode', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Token Usage</Label>
                      <p className="text-xs text-muted-foreground">
                        Display token counts for messages
                      </p>
                    </div>
                    <Switch
                      checked={settings.showTokenUsage}
                      onCheckedChange={(checked) => updateSetting('showTokenUsage', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Cost Estimates</Label>
                      <p className="text-xs text-muted-foreground">
                        Display estimated costs for AI operations
                      </p>
                    </div>
                    <Switch
                      checked={settings.showCostEstimates}
                      onCheckedChange={(checked) => updateSetting('showCostEstimates', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Animations</Label>
                      <p className="text-xs text-muted-foreground">
                        Use smooth transitions and effects
                      </p>
                    </div>
                    <Switch
                      checked={settings.enableAnimations}
                      onCheckedChange={(checked) => updateSetting('enableAnimations', checked)}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Notification Settings */}
              <TabsContent value="notifications" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        Show system notifications
                      </p>
                    </div>
                    <Switch
                      checked={settings.enableNotifications}
                      onCheckedChange={(checked) => updateSetting('enableNotifications', checked)}
                    />
                  </div>

                  {settings.enableNotifications && (
                    <>
                      <div className="flex items-center justify-between pl-4 border-l-2">
                        <div className="space-y-0.5">
                          <Label>Report Completion</Label>
                          <p className="text-xs text-muted-foreground">
                            Notify when reports are ready
                          </p>
                        </div>
                        <Switch
                          checked={settings.notifyOnReportComplete}
                          onCheckedChange={(checked) => updateSetting('notifyOnReportComplete', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between pl-4 border-l-2">
                        <div className="space-y-0.5">
                          <Label>Error Notifications</Label>
                          <p className="text-xs text-muted-foreground">
                            Alert on errors and failures
                          </p>
                        </div>
                        <Switch
                          checked={settings.notifyOnErrors}
                          onCheckedChange={(checked) => updateSetting('notifyOnErrors', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between pl-4 border-l-2">
                        <div className="space-y-0.5">
                          <Label>Sound Effects</Label>
                          <p className="text-xs text-muted-foreground">
                            Play sounds with notifications
                          </p>
                        </div>
                        <Switch
                          checked={settings.soundEnabled}
                          onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
                        />
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              {/* Privacy Settings */}
              <TabsContent value="privacy" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Save Conversation History</Label>
                      <p className="text-xs text-muted-foreground">
                        Keep records of your conversations
                      </p>
                    </div>
                    <Switch
                      checked={settings.saveHistory}
                      onCheckedChange={(checked) => updateSetting('saveHistory', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Share Crash Reports</Label>
                      <p className="text-xs text-muted-foreground">
                        Help improve the app by sharing errors
                      </p>
                    </div>
                    <Switch
                      checked={settings.shareCrashReports}
                      onCheckedChange={(checked) => updateSetting('shareCrashReports', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Usage Analytics</Label>
                      <p className="text-xs text-muted-foreground">
                        Anonymous usage statistics
                      </p>
                    </div>
                    <Switch
                      checked={settings.allowTelemetry}
                      onCheckedChange={(checked) => updateSetting('allowTelemetry', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Data Retention (days)</Label>
                    <Input
                      type="number"
                      value={settings.dataRetentionDays}
                      onChange={(e) => updateSetting('dataRetentionDays', parseInt(e.target.value))}
                      min={7}
                      max={365}
                    />
                    <p className="text-xs text-muted-foreground">
                      How long to keep your data before automatic deletion
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Data Management</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={exportSettings}>
                        <Download className="w-3 h-3 mr-1" />
                        Export Settings
                      </Button>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".json"
                          onChange={importSettings}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Button variant="outline" size="sm">
                          <Upload className="w-3 h-3 mr-1" />
                          Import Settings
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}

        <DialogFooter className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="outline" className="text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                Unsaved changes
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            {hasChanges && (
              <Button variant="outline" onClick={resetSettings}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveSettings}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}