'use client';

import { useState, useEffect } from 'react';

export interface PlaygroundSettings {
  defaultProvider: string;
  defaultModel: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
  defaultTopP: number;
  systemPrompt: string;
  allowCustomPrompts: boolean;
  allowProviderSelection: boolean;
  allowModelSelection: boolean;
  allowParameterOverride: boolean;
}

const DEFAULT_SETTINGS: PlaygroundSettings = {
  defaultProvider: 'anthropic',
  defaultModel: 'claude-3-5-sonnet-20241022',
  defaultTemperature: 0.7,
  defaultMaxTokens: 4096,
  defaultTopP: 1,
  systemPrompt: '',
  allowCustomPrompts: true,
  allowProviderSelection: true,
  allowModelSelection: true,
  allowParameterOverride: true,
};

const SETTINGS_STORAGE_KEY = 'assetworks-playground-settings';

export function usePlaygroundSettings() {
  const [settings, setSettings] = useState<PlaygroundSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load playground settings:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save settings to localStorage whenever they change
  const updateSettings = (newSettings: Partial<PlaygroundSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save playground settings:', error);
      }

      return updated;
    });
  };

  // Reset to defaults
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset playground settings:', error);
    }
  };

  // Sync with server settings
  const syncWithServer = async () => {
    try {
      const response = await fetch('/api/settings/playground');
      if (response.ok) {
        const serverSettings = await response.json();
        updateSettings(serverSettings);
        return true;
      }
    } catch (error) {
      console.error('Failed to sync with server:', error);
    }
    return false;
  };

  // Save to server
  const saveToServer = async () => {
    try {
      const response = await fetch('/api/settings/playground', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to save to server:', error);
      return false;
    }
  };

  return {
    settings,
    isLoaded,
    updateSettings,
    resetSettings,
    syncWithServer,
    saveToServer,
  };
}
