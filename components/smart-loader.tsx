'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Globe, 
  Code, 
  Sparkles, 
  Database,
  Zap,
  Palette,
  Layout,
  ChartBar,
  CheckCircle
} from 'lucide-react';

interface LoaderStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  duration: number;
}

const LOADER_STEPS: LoaderStep[] = [
  {
    id: 'init',
    label: 'Initializing Request',
    description: 'Processing your financial query...',
    icon: <Globe className="w-5 h-5" />,
    duration: 800,
  },
  {
    id: 'auth',
    label: 'Data Access',
    description: 'Accessing market data and financial metrics...',
    icon: <Database className="w-5 h-5" />,
    duration: 600,
  },
  {
    id: 'context',
    label: 'Loading Context',
    description: 'Preparing system prompt and conversation history...',
    icon: <Cpu className="w-5 h-5" />,
    duration: 1000,
  },
  {
    id: 'processing',
    label: 'AI Processing',
    description: 'Claude is analyzing your request and generating HTML...',
    icon: <Sparkles className="w-5 h-5" />,
    duration: 2000,
  },
  {
    id: 'structure',
    label: 'Building Structure',
    description: 'Creating DOM elements and widget framework...',
    icon: <Layout className="w-5 h-5" />,
    duration: 800,
  },
  {
    id: 'styling',
    label: 'Applying Styles',
    description: 'Adding Tailwind CSS and custom styling...',
    icon: <Palette className="w-5 h-5" />,
    duration: 600,
  },
  {
    id: 'charts',
    label: 'Generating Visualizations',
    description: 'Creating charts, graphs, and interactive elements...',
    icon: <ChartBar className="w-5 h-5" />,
    duration: 1000,
  },
  {
    id: 'optimize',
    label: 'Optimizing',
    description: 'Compressing and finalizing widget code...',
    icon: <Zap className="w-5 h-5" />,
    duration: 500,
  },
  {
    id: 'render',
    label: 'Rendering Widget',
    description: 'Preparing iframe and injecting HTML...',
    icon: <Code className="w-5 h-5" />,
    duration: 400,
  },
  {
    id: 'complete',
    label: 'Complete',
    description: 'Widget ready for display!',
    icon: <CheckCircle className="w-5 h-5" />,
    duration: 200,
  },
];

interface SmartLoaderProps {
  isLoading: boolean;
  userPrompt?: string;
}

export function SmartLoader({ isLoading, userPrompt }: SmartLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (isLoading && !startTime) {
      setStartTime(Date.now());
      setCurrentStep(0);
      setProgress(0);
    } else if (!isLoading) {
      setStartTime(null);
      setElapsedTime(0);
    }
  }, [isLoading, startTime]);

  useEffect(() => {
    if (!isLoading || currentStep >= LOADER_STEPS.length) return;

    const step = LOADER_STEPS[currentStep];
    const timer = setTimeout(() => {
      if (currentStep < LOADER_STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
        setProgress(((currentStep + 1) / LOADER_STEPS.length) * 100);
      }
    }, step.duration);

    return () => clearTimeout(timer);
  }, [currentStep, isLoading]);

  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [startTime]);

  if (!isLoading) return null;

  const activeStep = LOADER_STEPS[Math.min(currentStep, LOADER_STEPS.length - 1)];
  const formatTime = (ms: number) => (ms / 1000).toFixed(1) + 's';

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-xl shadow-lg">
      {/* Main loader animation */}
      <div className="relative mb-6">
        <div className="w-24 h-24 relative">
          {/* Rotating ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400"
          />
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              key={activeStep.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-blue-600 dark:text-blue-400"
            >
              {activeStep.icon}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Status text */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-center mb-4"
        >
          <h3 className="text-lg font-semibold text-foreground dark:text-primary-foreground mb-1">
            {activeStep.label}
          </h3>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            {activeStep.description}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="w-full max-w-xs mb-4">
        <div className="h-2 bg-accent dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground dark:text-muted-foreground">
          <span>Step {currentStep + 1} of {LOADER_STEPS.length}</span>
          <span>{formatTime(elapsedTime)}</span>
        </div>
      </div>

      {/* User prompt preview */}
      {userPrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-background dark:bg-secondary rounded-lg shadow-sm max-w-md"
        >
          <p className="text-xs text-muted-foreground dark:text-muted-foreground mb-1">Processing your request:</p>
          <p className="text-sm text-foreground dark:text-muted-foreground line-clamp-2">
            "{userPrompt}"
          </p>
        </motion.div>
      )}

      {/* Technical details */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-4 grid grid-cols-3 gap-4 text-xs text-muted-foreground dark:text-muted-foreground"
      >
        <div className="text-center">
          <div className="font-semibold">Model</div>
          <div>Claude 3.5</div>
        </div>
        <div className="text-center">
          <div className="font-semibold">Tokens</div>
          <div>~{Math.floor(elapsedTime / 10)}</div>
        </div>
        <div className="text-center">
          <div className="font-semibold">Latency</div>
          <div>{Math.floor(Math.random() * 50 + 20)}ms</div>
        </div>
      </motion.div>
    </div>
  );
}