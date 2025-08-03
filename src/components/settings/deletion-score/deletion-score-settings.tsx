'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Loader2,
  Save,
  Trash2,
  Info,
  RotateCcw,
  Download,
  Upload,
  Plus,
} from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  getDeletionScoreSettings,
  setDeletionScoreSettings,
} from '@/lib/actions/settings';
import { toast } from 'sonner';
import { FileInput } from '@/components/ui/file-input';
import { Input } from '@/components/ui/input';

import { Breakpoint } from '@/lib/actions/settings/types';

// This is a local definition for the component's state.
// The actual type from the API might differ during migration.
interface DeletionScoreSettings {
  enabled: boolean;
  daysUnwatchedEnabled: boolean;
  daysUnwatchedMaxPoints: number;
  daysUnwatchedBreakpoints: Breakpoint[];
  neverWatchedEnabled: boolean;
  neverWatchedPoints: number;
  sizeOnDiskEnabled: boolean;
  sizeOnDiskMaxPoints: number;
  sizeOnDiskBreakpoints: Breakpoint[];
  ageSinceAddedEnabled: boolean;
  ageSinceAddedMaxPoints: number;
  ageSinceAddedBreakpoints: Breakpoint[];
  folderSpaceEnabled: boolean;
  folderSpaceMaxPoints: number;
  folderSpaceBreakpoints: Breakpoint[];
}

interface ScoringFactor {
  key: string;
  title: string;
  description: string;
  enabledKey: keyof DeletionScoreSettings;
  maxPointsKey: keyof DeletionScoreSettings;
  maxPoints: number;
  color: string;
  breakdownsKey?: keyof DeletionScoreSettings;
  breakdownUnit?: string;
}

// Scoring factor configurations
const SCORING_FACTORS: ScoringFactor[] = [
  {
    key: 'daysUnwatched',
    title: 'Days Unwatched',
    description:
      "Media that hasn't been watched recently gets higher scores. The longer since last watched (or added if never watched), the higher the deletion score.",
    enabledKey: 'daysUnwatchedEnabled',
    maxPointsKey: 'daysUnwatchedMaxPoints',
    maxPoints: 30,
    color: 'bg-blue-500',
    breakdownsKey: 'daysUnwatchedBreakpoints',
    breakdownUnit: 'days',
  },
  {
    key: 'neverWatched',
    title: 'Never Watched Bonus',
    description:
      'Media that has never been watched receives additional points, making it more likely to be suggested for deletion.',
    enabledKey: 'neverWatchedEnabled',
    maxPointsKey: 'neverWatchedPoints',
    maxPoints: 20,
    color: 'bg-orange-500',
  },
  {
    key: 'sizeOnDisk',
    title: 'Size on Disk',
    description:
      'Larger media files receive higher scores. Deleting high-scoring items will free up more storage space.',
    enabledKey: 'sizeOnDiskEnabled',
    maxPointsKey: 'sizeOnDiskMaxPoints',
    maxPoints: 35,
    color: 'bg-green-500',
    breakdownsKey: 'sizeOnDiskBreakpoints',
    breakdownUnit: 'GB',
  },
  {
    key: 'ageSinceAdded',
    title: 'Age Since Added',
    description:
      'Media that was added to your library long ago receives higher scores. Recently added media is protected with lower scores.',
    enabledKey: 'ageSinceAddedEnabled',
    maxPointsKey: 'ageSinceAddedMaxPoints',
    maxPoints: 15,
    color: 'bg-purple-500',
    breakdownsKey: 'ageSinceAddedBreakpoints',
    breakdownUnit: 'days',
  },
  {
    key: 'folderSpace',
    title: 'Folder Space',
    description:
      'Media stored in folders with limited remaining space receives higher scores, helping to free up space in critical locations.',
    enabledKey: 'folderSpaceEnabled',
    maxPointsKey: 'folderSpaceMaxPoints',
    maxPoints: 10,
    color: 'bg-red-500',
    breakdownsKey: 'folderSpaceBreakpoints',
    breakdownUnit: '%',
  },
];

const getDefaultSettings = (): DeletionScoreSettings => ({
  enabled: true,
  daysUnwatchedEnabled: true,
  daysUnwatchedMaxPoints: 30,
  daysUnwatchedBreakpoints: [
    { value: 30, percent: 0 },
    { value: 90, percent: 17 },
    { value: 180, percent: 50 },
    { value: 365, percent: 73 },
    { value: 366, percent: 100 },
  ],
  neverWatchedEnabled: true,
  neverWatchedPoints: 20,
  sizeOnDiskEnabled: true,
  sizeOnDiskMaxPoints: 35,
  sizeOnDiskBreakpoints: [
    { value: 1, percent: 0 },
    { value: 5, percent: 0 },
    { value: 10, percent: 29 },
    { value: 20, percent: 43 },
    { value: 50, percent: 71 },
    { value: 51, percent: 100 },
  ],
  ageSinceAddedEnabled: true,
  ageSinceAddedMaxPoints: 15,
  ageSinceAddedBreakpoints: [
    { value: 180, percent: 33 },
    { value: 365, percent: 67 },
    { value: 730, percent: 100 },
  ],
  folderSpaceEnabled: false,
  folderSpaceMaxPoints: 10,
  folderSpaceBreakpoints: [
    { value: 10, percent: 100 },
    { value: 20, percent: 80 },
    { value: 30, percent: 60 },
    { value: 50, percent: 30 },
  ],
});

// Helper function to convert percentage to actual points
const getActualPoints = (
  percentage: number | undefined | null,
  maxPoints: number
) => {
  if (
    percentage === undefined ||
    percentage === null ||
    typeof percentage !== 'number' ||
    typeof maxPoints !== 'number' ||
    isNaN(percentage) ||
    isNaN(maxPoints)
  ) {
    return 0;
  }
  return Math.round((percentage / 100) * maxPoints);
};

function BreakpointEditor({
  breakpoints,
  onChange,
  maxPoints,
  unit,
}: {
  breakpoints: Breakpoint[];
  onChange: (newBreakpoints: Breakpoint[]) => void;
  maxPoints: number;
  unit: string;
}) {
  const handleBreakpointChange = (
    index: number,
    field: keyof Breakpoint,
    value: number | string
  ) => {
    const newBreakpoints = [...breakpoints];
    newBreakpoints[index] = { ...newBreakpoints[index], [field]: value };
    onChange(newBreakpoints);
  };

  const handleBlur = () => {
    const newBreakpoints = [...breakpoints].sort((a, b) => a.value - b.value);

    const values = newBreakpoints.map((bp) => bp.value);
    const hasDuplicates = new Set(values).size !== values.length;
    if (hasDuplicates) {
      toast.error('Breakpoint values must be unique.');
      return;
    }

    const currentValues = breakpoints.map((bp) => bp.value);
    const newValues = newBreakpoints.map((bp) => bp.value);
    if (JSON.stringify(currentValues) !== JSON.stringify(newValues)) {
      onChange(newBreakpoints);
    }
  };

  const addBreakpoint = () => {
    const lastValue =
      breakpoints.length > 0 ? breakpoints[breakpoints.length - 1].value : 0;
    onChange([...breakpoints, { value: lastValue + 1, percent: 100 }]);
  };

  const removeBreakpoint = (index: number) => {
    const newBreakpoints = breakpoints.filter((_, i) => i !== index);
    onChange(newBreakpoints);
  };

  return (
    <div className='space-y-3'>
      {breakpoints.map((bp, index) => {
        return (
          <div
            key={index}
            className='flex items-center space-x-2 p-2 bg-muted/50 rounded-lg'
          >
            <div className='flex-1'>
              <div className='flex items-center space-x-2'>
                <Input
                  type='number'
                  value={bp.value}
                  onBlur={handleBlur}
                  onChange={(e) =>
                    handleBreakpointChange(
                      index,
                      'value',
                      parseInt(e.target.value, 10) || 0
                    )
                  }
                  className='w-24'
                />
                <span className='text-sm text-muted-foreground'>{unit}</span>
                <Slider
                  value={[bp.percent]}
                  onValueChange={([newValue]) =>
                    handleBreakpointChange(index, 'percent', newValue)
                  }
                  max={100}
                  step={1}
                  className='flex-1'
                />
                <div className='w-16 text-sm font-medium text-center'>
                  {getActualPoints(bp.percent, maxPoints)} pts
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => removeBreakpoint(index)}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
              <div className='text-xs text-muted-foreground mt-1 pl-1'>
                {(() => {
                  // All breakpoints apply to values greater than the breakpoint value
                  return `Applies to values > ${bp.value} ${unit}`;
                })()}
              </div>
            </div>
          </div>
        );
      })}
      <Button variant='outline' onClick={addBreakpoint}>
        <Plus className='h-4 w-4 mr-2' />
        Add Breakpoint
      </Button>
    </div>
  );
}

// Reusable component for scoring factors
function ScoringFactorSection({
  factor,
  settings,
  setSettings,
}: {
  factor: ScoringFactor;
  settings: DeletionScoreSettings;
  setSettings: (settings: DeletionScoreSettings) => void;
}) {
  const isEnabled = settings[factor.enabledKey] as boolean;
  const maxPoints = settings[factor.maxPointsKey] as number;

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold'>{factor.title}</h3>
          <p className='text-sm text-muted-foreground'>{factor.description}</p>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={(checked) =>
            setSettings({ ...settings, [factor.enabledKey]: checked })
          }
        />
      </div>

      {isEnabled && (
        <div className='space-y-4 pl-4'>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label className='text-base font-medium'>Weight</Label>
              <div className='text-sm text-muted-foreground'>
                {maxPoints} pts ({((maxPoints / 100) * 100).toFixed(0)}% of
                total score)
              </div>
            </div>
            <Slider
              value={[maxPoints]}
              onValueChange={([value]) =>
                setSettings({ ...settings, [factor.maxPointsKey]: value })
              }
              max={100}
              step={1}
              className='w-full'
            />
          </div>

          {factor.breakdownsKey && (
            <Accordion
              type='single'
              collapsible
              className='w-full'
              data-testid={`${factor.key}-breakdown-accordion`}
            >
              <AccordionItem value='breakdown' className='border-none'>
                <AccordionTrigger
                  className='py-2 hover:no-underline text-sm font-medium text-muted-foreground justify-end'
                  data-testid={`${factor.key}-breakdown-trigger`}
                >
                  Fine-grained scoring breakdown
                </AccordionTrigger>
                <AccordionContent
                  className='space-y-3 pt-2'
                  data-testid={`${factor.key}-breakdown-content`}
                >
                  <div className='text-xs text-muted-foreground mb-2 space-y-1'>
                    <p>
                      Each breakpoint defines a score tier. An item&apos;s value
                      (e.g., days unwatched) is checked against the breakpoints
                      in descending order.
                    </p>
                    <p>
                      The <strong>first</strong> breakpoint where the
                      item&apos;s value is <strong>greater than</strong> the
                      breakpoint value determines the score. Values that
                      don&apos;t exceed any breakpoint get 0 points.
                    </p>
                    <p className='text-xs text-blue-600 font-medium'>
                      💡 Tip: Values that don&apos;t exceed any breakpoint will
                      get 0 points for this factor.
                    </p>
                  </div>
                  <BreakpointEditor
                    breakpoints={
                      (settings[factor.breakdownsKey] as
                        | Breakpoint[]
                        | undefined) || []
                    }
                    onChange={(newBreakpoints) =>
                      setSettings({
                        ...settings,
                        [factor.breakdownsKey as string]: newBreakpoints,
                      })
                    }
                    maxPoints={maxPoints}
                    unit={factor.breakdownUnit || ''}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      )}
    </div>
  );
}

export function DeletionScoreSettings() {
  const [settings, setSettings] = useState<DeletionScoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  type OldSettings = Omit<
    DeletionScoreSettings,
    | 'daysUnwatchedBreakpoints'
    | 'sizeOnDiskBreakpoints'
    | 'ageSinceAddedBreakpoints'
    | 'folderSpaceBreakpoints'
  > & { [key: string]: number };

  const migrateSettings = useCallback(
    (settings: OldSettings | undefined): DeletionScoreSettings | undefined => {
      if (!settings) return undefined;
      if (settings.daysUnwatchedBreakpoints) {
        return settings as DeletionScoreSettings;
      }

      const newSettings: Partial<DeletionScoreSettings> = {
        ...getDefaultSettings(),
        ...settings,
      };

      const migrateFactor = (
        baseKey: string,
        breakdownKey: keyof DeletionScoreSettings,
        breakdowns: { key: string; value: number }[]
      ) => {
        newSettings[breakdownKey] = breakdowns
          .map((b) => {
            const percent = settings[`${baseKey}${b.key}`];
            return percent !== undefined ? { value: b.value, percent } : null;
          })
          .filter(Boolean) as Breakpoint[];

        breakdowns.forEach((b) => delete newSettings[`${baseKey}${b.key}`]);
      };

      migrateFactor('daysUnwatched', 'daysUnwatchedBreakpoints', [
        { key: '30DaysPercent', value: 30 },
        { key: '90DaysPercent', value: 90 },
        { key: '180DaysPercent', value: 180 },
        { key: '365DaysPercent', value: 365 },
        { key: 'Over365Percent', value: 366 },
      ]);

      migrateFactor('sizeOnDisk', 'sizeOnDiskBreakpoints', [
        { key: '1GBPercent', value: 1 },
        { key: '5GBPercent', value: 5 },
        { key: '10GBPercent', value: 10 },
        { key: '20GBPercent', value: 20 },
        { key: '50GBPercent', value: 50 },
        { key: 'Over50GBPercent', value: 51 },
      ]);

      migrateFactor('ageSinceAdded', 'ageSinceAddedBreakpoints', [
        { key: '180DaysPercent', value: 180 },
        { key: '365DaysPercent', value: 365 },
        { key: 'Over730Percent', value: 730 },
      ]);

      migrateFactor('folderSpace', 'folderSpaceBreakpoints', [
        { key: '10PercentPercent', value: 10 },
        { key: '20PercentPercent', value: 20 },
        { key: '30PercentPercent', value: 30 },
        { key: '50PercentPercent', value: 50 },
      ]);

      return newSettings as DeletionScoreSettings;
    },
    []
  );

  const loadSettings = useCallback(async () => {
    try {
      const loadedSettings = await getDeletionScoreSettings();
      const migratedSettings = migrateSettings(loadedSettings);
      const validatedSettings = {
        ...getDefaultSettings(),
        ...migratedSettings,
      };
      setSettings(validatedSettings);
    } catch (error) {
      console.error('Failed to load deletion score settings:', error);
      setSettings(getDefaultSettings());
    } finally {
      setLoading(false);
    }
  }, [migrateSettings]);

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
        const breakpoints = settings[factor.breakdownsKey] as Breakpoint[];
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
          <div className='p-4 bg-muted/30 rounded-lg border'>
            <div className='flex items-center justify-between mb-3'>
              <h4 className='font-semibold'>Score Distribution</h4>
              <div
                className={`text-sm font-medium ${
                  validation.isValid ? 'text-green-600' : 'text-destructive'
                }`}
              >
                {calculateTotalMaxPoints()}/100 pts
              </div>
            </div>

            <div className='space-y-2'>
              {SCORING_FACTORS.map((factor) => {
                const isEnabled = settings[factor.enabledKey] as boolean;
                const maxPoints = settings[factor.maxPointsKey] as number;

                if (!isEnabled) return null;

                return (
                  <div key={factor.key} className='flex items-center space-x-3'>
                    <div className='w-24 text-sm text-muted-foreground'>
                      {factor.title}
                    </div>
                    <div className='flex-1 bg-muted rounded-full h-2'>
                      <div
                        className={`${factor.color} h-2 rounded-full transition-all duration-200`}
                        style={{ width: `${(maxPoints / 100) * 100}%` }}
                      />
                    </div>
                    <div className='w-12 text-sm font-medium text-center'>
                      {maxPoints} pts
                    </div>
                  </div>
                );
              })}
            </div>

            {!validation.isValid && (
              <div className='mt-3 text-destructive font-medium whitespace-pre-line text-sm'>
                {validation.message}
              </div>
            )}
            {validation.isValid && (
              <div className='mt-3 text-green-600 font-medium text-sm'>
                ✓ Settings are valid and ready to save
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex justify-between pt-4'>
          <div className='flex space-x-2'>
            <Button
              variant='outline'
              onClick={handleExportSettings}
              disabled={saving}
              data-testid='export-settings'
            >
              <Download className='h-4 w-4 mr-2' />
              Export Settings
            </Button>

            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button
                  variant='outline'
                  disabled={saving}
                  data-testid='import-settings'
                >
                  <Upload className='h-4 w-4 mr-2' />
                  Import Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Deletion Score Settings</DialogTitle>
                  <DialogDescription>
                    Select a JSON file containing deletion score settings to
                    import. This will replace your current settings.
                  </DialogDescription>
                </DialogHeader>
                <div className='py-4'>
                  <FileInput
                    ref={fileInputRef}
                    accept='.json'
                    onFileSelect={async (file) => {
                      if (file) {
                        try {
                          const text = await file.text();
                          const importData = JSON.parse(text);

                          if (
                            !importData.settings ||
                            typeof importData.settings !== 'object'
                          ) {
                            throw new Error(
                              'Invalid file format: missing settings object'
                            );
                          }

                          const importedSettings =
                            importData.settings as DeletionScoreSettings;

                          // Basic validation of required fields
                          const requiredFields = SCORING_FACTORS.flatMap(
                            (factor) => {
                              const keys = [
                                factor.enabledKey,
                                factor.maxPointsKey,
                              ];
                              if (factor.breakdownsKey) {
                                keys.push(factor.breakdownsKey);
                              }
                              return keys;
                            }
                          );

                          for (const field of requiredFields) {
                            if (!(field in importedSettings)) {
                              throw new Error(
                                `Invalid file format: missing required field '${field}'`
                              );
                            }
                          }

                          for (const factor of SCORING_FACTORS) {
                            if (factor.breakdownsKey) {
                              const breakpoints =
                                importedSettings[factor.breakdownsKey];
                              if (!Array.isArray(breakpoints)) {
                                throw new Error(
                                  `Invalid file format: '${factor.breakdownsKey}' must be an array.`
                                );
                              }
                              for (const bp of breakpoints) {
                                if (
                                  typeof bp.value !== 'number' ||
                                  typeof bp.percent !== 'number'
                                ) {
                                  throw new Error(
                                    `Invalid breakpoint in '${factor.breakdownsKey}'. Each breakpoint must have a 'value' and 'percent' as numbers.`
                                  );
                                }
                              }
                            }
                          }

                          setSettings(importedSettings);
                          setShowImportDialog(false);
                          toast.success('Settings imported successfully!');
                        } catch (error) {
                          console.error('Failed to import settings:', error);
                          toast.error(
                            `Failed to import settings: ${
                              error instanceof Error
                                ? error.message
                                : String(error)
                            }`
                          );
                        }
                      }
                    }}
                    buttonText='Choose JSON file'
                    placeholder='Drag and drop a JSON file here, or click to browse'
                    maxSize={1024 * 1024}
                    data-testid='import-file-input'
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant='outline'>Cancel</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
              <DialogTrigger asChild>
                <Button
                  variant='outline'
                  disabled={saving}
                  data-testid='reset-to-defaults'
                >
                  <RotateCcw className='h-4 w-4 mr-2' />
                  Reset to Defaults
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset to Default Settings</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to reset all settings to their default
                    values? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant='outline'>Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleResetToDefaults}>
                    Reset to Defaults
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Button
            onClick={handleSaveClick}
            disabled={saving || !validation.isValid}
            data-testid='save-score-settings'
          >
            {saving ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                Saving...
              </>
            ) : (
              <>
                <Save className='h-4 w-4 mr-2' />
                Save Settings
              </>
            )}
          </Button>
        </div>

        {/* Save Confirmation Dialog */}
        <Dialog
          open={showSaveConfirmDialog}
          onOpenChange={setShowSaveConfirmDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Settings Save</DialogTitle>
              <DialogDescription>
                Saving these deletion score settings will trigger a
                recalculation of all deletion scores in your media library. This
                process may take several minutes for large libraries and will
                run in the background.
                <br />
                <br />
                Are you sure you want to continue?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant='outline'>Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={!validation.isValid}>
                Save & Recalculate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
