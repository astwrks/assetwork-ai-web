'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings,
  X,
  Save,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
  FileText,
  Download,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { ENHANCED_RESEARCH_SYSTEM_PROMPT } from '@/lib/ai/report-workflow';
import { REALTIME_RESEARCH_PROMPT } from '@/lib/ai/realtime-research-prompt';
import { AUTO_RESEARCH_SYSTEM_PROMPT } from '@/lib/ai/auto-research-prompt';
import { INSTANT_REPORT_PROMPT } from '@/lib/ai/auto-continue-prompt';
import { ENHANCEMENT_MODE_PROMPT } from '@/lib/ai/enhancement-mode-prompt';
import { NO_QUESTIONS_INSTANT_PROMPT, AGGRESSIVE_ENHANCEMENT_PROMPT } from '@/lib/ai/no-questions-prompt';
import { PLAYGROUND_SYSTEM_PROMPT } from '@/lib/ai/playground-prompt';
import { ONE_SHOT_SYSTEM_PROMPT } from '@/lib/ai/one-shot-report';
import { VISUAL_GENERATION_PROMPT } from '@/lib/ai/visual-prompt';
import { ENHANCED_VISUAL_PROMPT } from '@/lib/ai/enhanced-visual-prompt';
import { FORCE_VISUAL_HTML_PROMPT } from '@/lib/ai/force-visual-html';
import { getAllModels, getModelsByProvider, AIModel } from '@/lib/utils/ai-models-config';
import { getProviderIcon, AI_PROVIDER_CONFIG, AIProvider } from '@/lib/utils/ai-provider-icons';

interface ChatSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  availableModels?: AIModel[]; // Optional prop for filtered models
}

const DEFAULT_PROMPTS = [
  {
    name: 'Visual Analytics',
    description: 'Reports with 10+ interactive charts and visualizations',
    prompt: FORCE_VISUAL_HTML_PROMPT,
    icon: TrendingUp
  },
  {
    name: 'One-Shot Pro',
    description: 'Complete analysis with real web data in one prompt',
    prompt: ONE_SHOT_SYSTEM_PROMPT,
    icon: Sparkles
  },
  {
    name: 'Playground Mode',
    description: 'Super-detailed reports with infinite enhancements',
    prompt: PLAYGROUND_SYSTEM_PROMPT,
    icon: FileText
  },
  {
    name: 'NO QUESTIONS Mode',
    description: 'Ultra-instant HTML - Zero confirmations',
    prompt: NO_QUESTIONS_INSTANT_PROMPT,
    icon: Sparkles
  },
  {
    name: 'Aggressive Enhancement',
    description: 'Instant + Enhancement - No questions ever',
    prompt: AGGRESSIVE_ENHANCEMENT_PROMPT,
    icon: Sparkles
  },
  {
    name: 'Enhancement Mode',
    description: 'Instant reports with incremental enhancements',
    prompt: ENHANCEMENT_MODE_PROMPT,
    icon: TrendingUp
  },
  {
    name: 'Instant Report',
    description: 'Immediate HTML output',
    prompt: 'INSTANT_REPORT_PROMPT: This mode generates instant HTML reports without using Claude API',
    icon: TrendingUp
  },
  {
    name: 'Auto Research',
    description: 'One-shot autonomous reports',
    prompt: AUTO_RESEARCH_SYSTEM_PROMPT,
    icon: FileText
  },
  {
    name: 'Real-Time Research',
    description: 'Aggressive data gathering + report',
    prompt: REALTIME_RESEARCH_PROMPT,
    icon: TrendingUp
  },
  {
    name: 'Research Report',
    description: 'Institutional-grade financial reports',
    prompt: ENHANCED_RESEARCH_SYSTEM_PROMPT,
    icon: FileText
  },
  {
    name: 'HTML Widget Generator',
    description: 'Always generates interactive HTML widgets',
    prompt: `You are an AI assistant that ALWAYS responds with interactive HTML widgets. Every single response must be a complete, self-contained HTML widget that visualizes the information being discussed.

## CRITICAL REQUIREMENT: HTML OUTPUT ONLY

**EVERY RESPONSE MUST BE VALID HTML CODE** that creates a visual widget. Do not provide explanations, markdown, or plain text. Output ONLY the HTML code that will be rendered.`
  },
  {
    name: 'Financial Analyst',
    description: 'Expert in financial markets and analysis',
    prompt: `You are a senior financial analyst with expertise in markets, trading, and investment strategies. Provide detailed analysis with data, charts, and actionable insights. Always include risk assessments and market context.`
  },
  {
    name: 'Code Expert',
    description: 'Programming and technical assistance',
    prompt: `You are an expert programmer proficient in all major languages and frameworks. Provide clean, efficient, well-documented code with best practices and explanations.`
  }
];

export function ChatSettings({
  isOpen,
  onClose,
  systemPrompt,
  onSystemPromptChange,
  selectedModel,
  onModelChange,
  availableModels
}: ChatSettingsProps) {
  const [localPrompt, setLocalPrompt] = useState(systemPrompt);
  const [localModel, setLocalModel] = useState(selectedModel);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number | null>(null);

  // Use provided filtered models or fall back to all models
  const modelsToDisplay = availableModels && availableModels.length > 0
    ? availableModels
    : getAllModels();

  useEffect(() => {
    setLocalPrompt(systemPrompt);
    setLocalModel(selectedModel);
    
    // Check if current prompt matches any preset
    const matchingPresetIndex = DEFAULT_PROMPTS.findIndex(
      preset => preset.prompt === systemPrompt
    );
    setSelectedPresetIndex(matchingPresetIndex >= 0 ? matchingPresetIndex : null);
  }, [systemPrompt, selectedModel]);

  const handleSave = () => {
    onSystemPromptChange(localPrompt);
    onModelChange(localModel);
    setSaved(true);
    toast.success('Settings saved successfully!');
    setTimeout(() => setSaved(false), 2000);
    
    // Save to localStorage
    localStorage.setItem('chatSettings', JSON.stringify({
      systemPrompt: localPrompt,
      model: localModel
    }));
  };

  const handleReset = () => {
    const defaultPrompt = DEFAULT_PROMPTS[0].prompt;
    setLocalPrompt(defaultPrompt);
    setLocalModel('claude-3-5-sonnet-20241022');
    toast.success('Reset to defaults');
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(localPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Prompt copied to clipboard');
  };

  const handleLoadPreset = (preset: typeof DEFAULT_PROMPTS[0], index: number) => {
    setLocalPrompt(preset.prompt);
    setSelectedPresetIndex(index);
    toast.success(`Loaded ${preset.name} preset`);
  };

  const handleExportSettings = () => {
    const settings = {
      systemPrompt: localPrompt,
      model: localModel,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Settings exported');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Settings Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-background dark:bg-background shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-background dark:bg-background border-b border-border dark:border-border p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Chat Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted dark:hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Currently Active Mode */}
              {selectedPresetIndex !== null && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        {(() => {
                          const Icon = DEFAULT_PROMPTS[selectedPresetIndex].icon;
                          return Icon ? <Icon className="w-6 h-6 text-primary-foreground" /> : null;
                        })()}
                      </div>
                      <div>
                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Currently Active</div>
                        <div className="text-lg font-semibold text-foreground dark:text-primary-foreground">
                          {DEFAULT_PROMPTS[selectedPresetIndex].name}
                        </div>
                      </div>
                    </div>
                    <Check className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              )}
              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-2">
                  AI Model
                </label>
                <div className="relative">
                  <button
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    className="w-full px-4 py-3 bg-muted dark:bg-secondary border border-border dark:border-border rounded-lg flex items-center justify-between hover:bg-muted dark:hover:bg-accent transition-colors"
                  >
                    <div className="text-left flex items-center gap-3 flex-1">
                      {(() => {
                        const selectedModel = modelsToDisplay.find(m => m.id === localModel);
                        const providerConfig = selectedModel ? getProviderIcon(selectedModel.provider) : null;
                        const ProviderIcon = providerConfig?.icon;

                        return (
                          <>
                            {ProviderIcon && (
                              <div className={`w-8 h-8 rounded-lg ${providerConfig.bgColor} flex items-center justify-center flex-shrink-0`}>
                                <ProviderIcon className={`w-4 h-4 ${providerConfig.color}`} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {selectedModel?.name || 'Select Model'}
                              </div>
                              <div className="text-xs text-muted-foreground dark:text-muted-foreground truncate">
                                {selectedModel?.description || 'Choose an AI model'}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <ChevronDown className={`w-5 h-5 transition-transform flex-shrink-0 ml-2 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isModelDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full mt-2 w-full bg-background dark:bg-secondary border border-border dark:border-border rounded-lg shadow-lg z-10 max-h-[400px] overflow-y-auto"
                    >
                      {modelsToDisplay.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                          No AI providers configured. Please add API keys in Settings.
                        </div>
                      ) : (
                        <>
                          {/* Group models by provider */}
                          {(Object.keys(AI_PROVIDER_CONFIG) as AIProvider[]).map((provider) => {
                            const models = modelsToDisplay.filter(m => m.provider === provider);
                            if (models.length === 0) return null;

                            const providerConfig = getProviderIcon(provider);
                            const ProviderIcon = providerConfig.icon;

                        return (
                          <div key={provider} className="border-b border-border dark:border-border last:border-b-0">
                            {/* Provider Header */}
                            <div className="px-4 py-2 bg-muted/50 dark:bg-accent/50 flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-md ${providerConfig.bgColor} flex items-center justify-center`}>
                                <ProviderIcon className={`w-3.5 h-3.5 ${providerConfig.color}`} />
                              </div>
                              <span className="text-xs font-semibold text-muted-foreground">
                                {providerConfig.displayName}
                              </span>
                            </div>

                            {/* Provider Models */}
                            {models.map((model) => (
                              <button
                                key={model.id}
                                onClick={() => {
                                  setLocalModel(model.id);
                                  setIsModelDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-muted dark:hover:bg-accent transition-colors ${
                                  localModel === model.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium">{model.name}</div>
                                    <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                                      {model.description}
                                    </div>
                                  </div>
                                  {localModel === model.id && (
                                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                        </>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Preset Prompts */}
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-2">
                  Preset Prompts
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DEFAULT_PROMPTS.map((preset, index) => {
                    const isSelected = selectedPresetIndex === index;
                    return (
                      <button
                        key={preset.name}
                        onClick={() => handleLoadPreset(preset, index)}
                        className={`p-3 border rounded-lg transition-all text-left relative ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500 ring-opacity-50' 
                            : 'border-border dark:border-border bg-muted dark:bg-secondary hover:bg-muted dark:hover:bg-accent'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <Check className="w-4 h-4 text-blue-600" />
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {preset.icon && <preset.icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-muted-foreground'}`} />}
                          <div className={`text-sm font-medium ${isSelected ? 'text-blue-900 dark:text-blue-100' : ''}`}>
                            {preset.name}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                          {preset.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* System Prompt */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground dark:text-muted-foreground">
                    System Prompt
                  </label>
                  <div className="flex gap-1">
                    <button
                      onClick={handleCopyPrompt}
                      className="p-1.5 hover:bg-muted dark:hover:bg-secondary rounded transition-colors"
                      title="Copy prompt"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
                <textarea
                  value={localPrompt}
                  onChange={(e) => {
                    setLocalPrompt(e.target.value);
                    // Clear preset selection if manually edited
                    const matchingPreset = DEFAULT_PROMPTS.findIndex(p => p.prompt === e.target.value);
                    setSelectedPresetIndex(matchingPreset >= 0 ? matchingPreset : null);
                  }}
                  className="w-full h-64 px-4 py-3 bg-muted dark:bg-secondary border border-border dark:border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Enter your system prompt..."
                />
                <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-2">
                  {localPrompt.length} characters
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  className="flex-1"
                  variant="default"
                >
                  {saved ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={handleExportSettings}
                  variant="outline"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>

              {/* Info */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100">
                      Pro Tip
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">
                      For HTML widget generation, keep the system prompt focused on outputting pure HTML. 
                      The model will follow your instructions precisely.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}