'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Trash2, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getDeletionScoreSettings,
  setDeletionScoreSettings,
} from '@/lib/actions/settings';
import type { DeletionScoreSettings } from '@/lib/actions/settings/types';
import { SCORING_FACTORS, getDefaultSettings } from './types';
import { ScoringFactorSection } from './scoring-factor-section';
import { ScoreDistribution } from './score-distribution';
import { ActionButtons } from './action-buttons';
import { SaveConfirmationDialog } from './save-confirmation-dialog';

export function DeletionScoreSettings() {
  const [settings, setSettings] = useState<DeletionScoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const loadedSettings = await getDeletionScoreSettings();
      const validatedSettings = {
        ...getDefaultSettings(),
        ...loadedSettings,
      };
      setSettings(validatedSettings);
    } catch (error) {
      console.error('Failed to load deletion score settings:', error);
      setSettings(getDefaultSettings());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const calculateTotalMaxPoints = () => {
    if (!settings) return 0;
    return SCORING_FACTORS.reduce((total, factor) => {
      if (settings[factor.enabledKey] as boolean) {
        total += settings[factor.maxPointsKey] as number;
      }
      return total;
    }, 0);
  };

  const validateSettings = () => {
    if (!settings) return { isValid: false, message: 'Settings not loaded.' };
    if (!settings.enabled) return { isValid: true, message: '' };

    const totalPoints = calculateTotalMaxPoints();
    if (totalPoints !== 100) {
      const breakdown = SCORING_FACTORS.filter(
        (factor) => settings[factor.enabledKey] as boolean
      )
        .map(
          (factor) => `• ${factor.title}: ${settings[factor.maxPointsKey]} pts`
        )
        .join('\n');

      return {
        isValid: false,
        message: `Deletion score factors must add up to exactly 100 points. Current total: ${totalPoints} points.\n\nBreakdown:\n${breakdown}\n\nPlease adjust your settings.`,
      };
    }

    for (const factor of SCORING_FACTORS) {
      if (factor.breakdownsKey) {
        const breakpoints = settings[factor.breakdownsKey] as Array<{
          value: number;
          percent: number;
        }>;
        if (breakpoints && breakpoints.length > 0) {
          const values = breakpoints.map((bp) => bp.value);
          if (new Set(values).size !== values.length) {
            return {
              isValid: false,
              message: `Breakpoints for ${factor.title} must have unique values.`,
            };
          }

          // Check that breakpoints are in ascending order
          const sortedValues = [...values].sort((a, b) => a - b);
          if (JSON.stringify(values) !== JSON.stringify(sortedValues)) {
            return {
              isValid: false,
              message: `Breakpoints for ${factor.title} must be in ascending order.`,
            };
          }
        }
      }
    }

    return { isValid: true, message: '' };
  };

  const handleSaveClick = () => {
    const validation = validateSettings();
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }

    if (settings?.enabled) {
      setShowSaveConfirmDialog(true);
    } else {
      handleSave();
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setShowSaveConfirmDialog(false);
    setSaving(true);
    try {
      const result = await setDeletionScoreSettings(settings);
      if (result.success) {
        toast.success('Deletion score settings saved successfully!');
      } else {
        toast.error(result.message || 'Error saving settings');
      }
    } catch (error) {
      console.error('Failed to save deletion score settings:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    setSettings(getDefaultSettings());
    setShowResetDialog(false);
  };

  const handleExportSettings = () => {
    if (!settings) return;
    try {
      const exportData = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        settings: settings,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deletion-score-settings-${
        new Date().toISOString().split('T')[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Settings exported successfully!');
    } catch (error) {
      console.error('Failed to export settings:', error);
      toast.error('Failed to export settings. Please try again.');
    }
  };

  const handleImportSettings = (importedSettings: DeletionScoreSettings) => {
    setSettings(importedSettings);
  };

  if (loading || !settings) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  const validation = validateSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center space-x-2'>
          <Trash2 className='h-5 w-5' />
          <span>Deletion Score Configuration</span>
        </CardTitle>
        <CardDescription>
          Configure how deletion scores are calculated for media items. Higher
          scores indicate items that are better candidates for deletion.
          <br />
          <span className='text-xs text-muted-foreground'>
            Breakpoints are checked from highest to lowest value. The first
            breakpoint where an item&apos;s value exceeds the breakpoint value
            determines the score.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Master Enable Switch */}
        <div className='flex items-center justify-between space-x-2'>
          <div className='space-y-1'>
            <Label htmlFor='enabled'>Enable Deletion Scoring</Label>
            <p className='text-sm text-muted-foreground'>
              Turn deletion scoring on or off
            </p>
          </div>
          <Switch
            id='enabled'
            checked={settings.enabled}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, enabled: checked })
            }
          />
        </div>

        <Separator />

        {/* Scoring Factors */}
        {SCORING_FACTORS.map((factor, index) => (
          <div key={factor.key}>
            <ScoringFactorSection
              factor={factor}
              settings={settings}
              setSettings={setSettings}
            />
            {factor.key === 'neverWatched' && <div className='pb-8' />}
            {index < SCORING_FACTORS.length - 1 && <Separator />}
          </div>
        ))}

        {/* Info Box */}
        <div className='rounded-lg bg-muted p-4'>
          <div className='flex items-start space-x-2'>
            <Info className='h-5 w-5 mt-0.5 text-muted-foreground' />
            <div className='space-y-1'>
              <p className='text-sm font-medium'>How Deletion Scoring Works</p>
              <p className='text-sm text-muted-foreground'>
                Each factor contributes points to a media item&apos;s deletion
                score. Items with higher scores are better candidates for
                deletion. The total score is capped at 100 points. Adjust the
                weights of each factor to match your priorities.
              </p>
            </div>
          </div>
        </div>

        {/* Visual Score Summary */}
        {settings.enabled && (
          <ScoreDistribution
            settings={settings}
            validation={validation}
            calculateTotalMaxPoints={calculateTotalMaxPoints}
          />
        )}

        {/* Action Buttons */}
        <ActionButtons
          settings={settings}
          saving={saving}
          validation={validation}
          onSaveClick={handleSaveClick}
          onExportSettings={handleExportSettings}
          onResetToDefaults={handleResetToDefaults}
          onImportSettings={handleImportSettings}
          showResetDialog={showResetDialog}
          setShowResetDialog={setShowResetDialog}
          showImportDialog={showImportDialog}
          setShowImportDialog={setShowImportDialog}
        />

        {/* Save Confirmation Dialog */}
        <SaveConfirmationDialog
          open={showSaveConfirmDialog}
          onOpenChange={setShowSaveConfirmDialog}
          onSave={handleSave}
          validation={validation}
        />
      </CardContent>
    </Card>
  );
}
