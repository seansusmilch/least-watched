'use client';

import { useState, useEffect, useRef } from 'react';
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
  Loader2,
  Save,
  Trash2,
  Info,
  RotateCcw,
  Download,
  Upload,
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
  type DeletionScoreSettings,
} from '@/lib/actions/settings';
import { toast } from 'sonner';
import { FileInput } from '@/components/ui/file-input';

// Types for scoring factors
interface ScoringFactor {
  key: string;
  title: string;
  description: string;
  enabledKey: keyof DeletionScoreSettings;
  maxPointsKey: keyof DeletionScoreSettings;
  maxPoints: number;
  color: string;
  breakdowns?: ScoringBreakdown[];
}

interface ScoringBreakdown {
  key: keyof DeletionScoreSettings;
  label: string;
  maxValue: number;
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
    breakdowns: [
      { key: 'daysUnwatched30DaysPercent', label: '≤30 days', maxValue: 100 },
      { key: 'daysUnwatched90DaysPercent', label: '31-90 days', maxValue: 100 },
      {
        key: 'daysUnwatched180DaysPercent',
        label: '91-180 days',
        maxValue: 100,
      },
      {
        key: 'daysUnwatched365DaysPercent',
        label: '181-365 days',
        maxValue: 100,
      },
      { key: 'daysUnwatchedOver365Percent', label: '>365 days', maxValue: 100 },
    ],
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
    breakdowns: [
      { key: 'sizeOnDisk1GBPercent', label: '<1GB', maxValue: 100 },
      { key: 'sizeOnDisk5GBPercent', label: '1-5GB', maxValue: 100 },
      { key: 'sizeOnDisk10GBPercent', label: '5-10GB', maxValue: 100 },
      { key: 'sizeOnDisk20GBPercent', label: '10-20GB', maxValue: 100 },
      { key: 'sizeOnDisk50GBPercent', label: '20-50GB', maxValue: 100 },
      { key: 'sizeOnDiskOver50GBPercent', label: '≥50GB', maxValue: 100 },
    ],
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
    breakdowns: [
      {
        key: 'ageSinceAdded180DaysPercent',
        label: '180-365 days',
        maxValue: 100,
      },
      {
        key: 'ageSinceAdded365DaysPercent',
        label: '365-730 days',
        maxValue: 100,
      },
      { key: 'ageSinceAddedOver730Percent', label: '>730 days', maxValue: 100 },
    ],
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
    breakdowns: [
      {
        key: 'folderSpace10PercentPercent',
        label: '<10% remaining',
        maxValue: 100,
      },
      {
        key: 'folderSpace20PercentPercent',
        label: '10-20% remaining',
        maxValue: 100,
      },
      {
        key: 'folderSpace30PercentPercent',
        label: '20-30% remaining',
        maxValue: 100,
      },
      {
        key: 'folderSpace50PercentPercent',
        label: '30-50% remaining',
        maxValue: 100,
      },
    ],
  },
];

const getDefaultSettings = (): DeletionScoreSettings => ({
  enabled: true,
  daysUnwatchedEnabled: true,
  daysUnwatchedMaxPoints: 30,
  daysUnwatched30DaysPercent: 0,
  daysUnwatched90DaysPercent: 16.67,
  daysUnwatched180DaysPercent: 50,
  daysUnwatched365DaysPercent: 73.33,
  daysUnwatchedOver365Percent: 100,
  neverWatchedEnabled: true,
  neverWatchedPoints: 20,
  sizeOnDiskEnabled: true,
  sizeOnDiskMaxPoints: 35,
  sizeOnDisk1GBPercent: 0,
  sizeOnDisk5GBPercent: 0,
  sizeOnDisk10GBPercent: 28.57,
  sizeOnDisk20GBPercent: 42.86,
  sizeOnDisk50GBPercent: 71.43,
  sizeOnDiskOver50GBPercent: 100,
  ageSinceAddedEnabled: true,
  ageSinceAddedMaxPoints: 15,
  ageSinceAdded180DaysPercent: 33.33,
  ageSinceAdded365DaysPercent: 66.67,
  ageSinceAddedOver730Percent: 100,
  folderSpaceEnabled: false,
  folderSpaceMaxPoints: 10,
  folderSpace10PercentPercent: 100,
  folderSpace20PercentPercent: 80,
  folderSpace30PercentPercent: 60,
  folderSpace50PercentPercent: 30,
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

// Reusable component for scoring breakdown sliders
function ScoringBreakdownSlider({
  label,
  value,
  onChange,
  maxValue,
  maxPoints,
}: {
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
  maxValue: number;
  maxPoints: number;
}) {
  const safeValue = value ?? 0;

  return (
    <div className='flex items-center space-x-3 p-3 bg-muted/50 rounded-lg'>
      <div className='w-20 text-xs text-muted-foreground'>{label}</div>
      <div className='flex-1'>
        <Slider
          value={[safeValue]}
          onValueChange={([newValue]) => onChange(newValue)}
          max={maxValue}
          step={1}
          className='w-full'
        />
      </div>
      <div className='w-12 text-sm font-medium text-center'>
        {getActualPoints(safeValue, maxPoints)} pts
      </div>
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
              max={50}
              step={1}
              className='w-full'
            />
          </div>

          {factor.breakdowns && (
            <div className='space-y-3'>
              <Label className='text-sm font-medium text-muted-foreground'>
                {factor.title}-based scoring breakdown:
              </Label>
              <div className='grid grid-cols-1 gap-3'>
                {factor.breakdowns.map((breakdown) => (
                  <ScoringBreakdownSlider
                    key={breakdown.key}
                    label={breakdown.label}
                    value={settings[breakdown.key] as number | undefined}
                    onChange={(value) =>
                      setSettings({ ...settings, [breakdown.key]: value })
                    }
                    maxValue={breakdown.maxValue}
                    maxPoints={maxPoints}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DeletionScoreSettings() {
  const [settings, setSettings] =
    useState<DeletionScoreSettings>(getDefaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await getDeletionScoreSettings();

      // Ensure all percentage properties exist with fallback values
      const validatedSettings = {
        ...getDefaultSettings(), // Start with defaults
        ...loadedSettings, // Override with loaded settings
      };

      setSettings(validatedSettings);
    } catch (error) {
      console.error('Failed to load deletion score settings:', error);
      setSettings(getDefaultSettings());
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalMaxPoints = () => {
    return SCORING_FACTORS.reduce((total, factor) => {
      if (settings[factor.enabledKey] as boolean) {
        total += settings[factor.maxPointsKey] as number;
      }
      return total;
    }, 0);
  };

  const validateSettings = () => {
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
    return { isValid: true, message: '' };
  };

  const handleSaveClick = () => {
    const validation = validateSettings();
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }

    if (settings.enabled) {
      setShowSaveConfirmDialog(true);
    } else {
      handleSave();
    }
  };

  const handleSave = async () => {
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
    try {
      const exportData = {
        version: '1.0',
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
                            (factor) => [
                              factor.enabledKey,
                              factor.maxPointsKey,
                              ...(factor.breakdowns?.map((b) => b.key) || []),
                            ]
                          );

                          for (const field of requiredFields) {
                            if (!(field in importedSettings)) {
                              throw new Error(
                                `Invalid file format: missing required field '${field}'`
                              );
                            }
                          }

                          setSettings(importedSettings);
                          setShowImportDialog(false);
                          toast.success('Settings imported successfully!');
                        } catch (error) {
                          console.error('Failed to import settings:', error);
                          toast.error(
                            'Failed to import settings. Please check the file format and try again.'
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
