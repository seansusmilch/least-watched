'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, Save, Trash2, Info, RotateCcw } from 'lucide-react';
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

const getDefaultSettings = (): DeletionScoreSettings => ({
  enabled: true,

  // Days Unwatched - Most important factor (30 points)
  daysUnwatchedEnabled: true,
  daysUnwatchedMaxPoints: 30,
  daysUnwatched30Days: 0,
  daysUnwatched90Days: 8,
  daysUnwatched180Days: 15,
  daysUnwatched365Days: 22,
  daysUnwatchedOver365: 30,

  // Never Watched - Good bonus (20 points)
  neverWatchedEnabled: true,
  neverWatchedPoints: 20,

  // Size on Disk - Important for space saving (25 points)
  sizeOnDiskEnabled: true,
  sizeOnDiskMaxPoints: 25,
  sizeOnDisk1GB: 0,
  sizeOnDisk5GB: 8,
  sizeOnDisk10GB: 12,
  sizeOnDisk20GB: 16,
  sizeOnDisk50GB: 20,
  sizeOnDiskOver50GB: 25,

  // Age Since Added - Moderate importance (15 points)
  ageSinceAddedEnabled: true,
  ageSinceAddedMaxPoints: 15,
  ageSinceAdded180Days: 5,
  ageSinceAdded365Days: 10,
  ageSinceAddedOver730: 15,

  // Folder Space - Tiebreaker factor (10 points)
  folderSpaceEnabled: true,
  folderSpaceMaxPoints: 10,
  folderSpace10Percent: 10,
  folderSpace20Percent: 8,
  folderSpace30Percent: 6,
  folderSpace50Percent: 3,
});

export function DeletionScoreSettings() {
  const [settings, setSettings] = useState<DeletionScoreSettings>(
    getDefaultSettings()
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await getDeletionScoreSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load deletion score settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClick = () => {
    // Show confirmation dialog if deletion scoring is enabled
    if (settings.enabled) {
      setShowSaveConfirmDialog(true);
    } else {
      // If disabled, save directly without confirmation
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

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  const calculateTotalMaxPoints = () => {
    let total = 0;
    if (settings.daysUnwatchedEnabled) total += settings.daysUnwatchedMaxPoints;
    if (settings.neverWatchedEnabled) total += settings.neverWatchedPoints;
    if (settings.sizeOnDiskEnabled) total += settings.sizeOnDiskMaxPoints;
    if (settings.ageSinceAddedEnabled) total += settings.ageSinceAddedMaxPoints;
    if (settings.folderSpaceEnabled) total += settings.folderSpaceMaxPoints;
    return total;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center space-x-2'>
          <Trash2 className='h-5 w-5' />
          <span>Deletion Score Configuration</span>
        </CardTitle>
        <CardDescription>
          Configure how deletion scores are calculated for media items. Higher
          scores indicate items that are better candidates for deletion. Total
          possible score: {calculateTotalMaxPoints()}/100
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

        {/* Days Unwatched Factor */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold'>Days Unwatched</h3>
              <p className='text-sm text-muted-foreground'>
                Media that hasn&apos;t been watched recently gets higher scores.
                The longer since last watched (or added if never watched), the
                higher the deletion score.
              </p>
            </div>
            <Switch
              checked={settings.daysUnwatchedEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, daysUnwatchedEnabled: checked })
              }
            />
          </div>

          {settings.daysUnwatchedEnabled && (
            <div className='space-y-3 pl-4'>
              <div className='space-y-2'>
                <Label>Max Points: {settings.daysUnwatchedMaxPoints}</Label>
                <Slider
                  value={[settings.daysUnwatchedMaxPoints]}
                  onValueChange={([value]) =>
                    setSettings({ ...settings, daysUnwatchedMaxPoints: value })
                  }
                  max={50}
                  step={1}
                  data-testid='last-watched-weight'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <Label>≤30 days: {settings.daysUnwatched30Days} pts</Label>
                  <Slider
                    value={[settings.daysUnwatched30Days]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, daysUnwatched30Days: value })
                    }
                    max={settings.daysUnwatchedMaxPoints}
                    step={1}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>31-90 days: {settings.daysUnwatched90Days} pts</Label>
                  <Slider
                    value={[settings.daysUnwatched90Days]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, daysUnwatched90Days: value })
                    }
                    max={settings.daysUnwatchedMaxPoints}
                    step={1}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>
                    91-180 days: {settings.daysUnwatched180Days} pts
                  </Label>
                  <Slider
                    value={[settings.daysUnwatched180Days]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, daysUnwatched180Days: value })
                    }
                    max={settings.daysUnwatchedMaxPoints}
                    step={1}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>
                    181-365 days: {settings.daysUnwatched365Days} pts
                  </Label>
                  <Slider
                    value={[settings.daysUnwatched365Days]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, daysUnwatched365Days: value })
                    }
                    max={settings.daysUnwatchedMaxPoints}
                    step={1}
                  />
                </div>
                <div className='space-y-1 col-span-2'>
                  <Label>
                    &gt;365 days: {settings.daysUnwatchedOver365} pts
                  </Label>
                  <Slider
                    value={[settings.daysUnwatchedOver365]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, daysUnwatchedOver365: value })
                    }
                    max={settings.daysUnwatchedMaxPoints}
                    step={1}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Never Watched Bonus */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold'>Never Watched Bonus</h3>
              <p className='text-sm text-muted-foreground'>
                Media that has never been watched receives additional points,
                making it more likely to be suggested for deletion.
              </p>
            </div>
            <Switch
              checked={settings.neverWatchedEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, neverWatchedEnabled: checked })
              }
            />
          </div>

          {settings.neverWatchedEnabled && (
            <div className='space-y-2 pl-4'>
              <Label>Bonus Points: {settings.neverWatchedPoints}</Label>
              <Slider
                value={[settings.neverWatchedPoints]}
                onValueChange={([value]) =>
                  setSettings({ ...settings, neverWatchedPoints: value })
                }
                max={30}
                step={1}
                data-testid='play-count-weight'
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Size on Disk Factor */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold'>Size on Disk</h3>
              <p className='text-sm text-muted-foreground'>
                Larger media files receive higher scores. Deleting high-scoring
                items will free up more storage space.
              </p>
            </div>
            <Switch
              checked={settings.sizeOnDiskEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, sizeOnDiskEnabled: checked })
              }
            />
          </div>

          {settings.sizeOnDiskEnabled && (
            <div className='space-y-3 pl-4'>
              <div className='space-y-2'>
                <Label>Max Points: {settings.sizeOnDiskMaxPoints}</Label>
                <Slider
                  value={[settings.sizeOnDiskMaxPoints]}
                  onValueChange={([value]) =>
                    setSettings({ ...settings, sizeOnDiskMaxPoints: value })
                  }
                  max={50}
                  step={1}
                  data-testid='file-size-weight'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <Label>&lt;1GB: {settings.sizeOnDisk1GB} pts</Label>
                  <Slider
                    value={[settings.sizeOnDisk1GB]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, sizeOnDisk1GB: value })
                    }
                    max={settings.sizeOnDiskMaxPoints}
                    step={1}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>1-5GB: {settings.sizeOnDisk5GB} pts</Label>
                  <Slider
                    value={[settings.sizeOnDisk5GB]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, sizeOnDisk5GB: value })
                    }
                    max={settings.sizeOnDiskMaxPoints}
                    step={1}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>5-10GB: {settings.sizeOnDisk10GB} pts</Label>
                  <Slider
                    value={[settings.sizeOnDisk10GB]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, sizeOnDisk10GB: value })
                    }
                    max={settings.sizeOnDiskMaxPoints}
                    step={1}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>10-20GB: {settings.sizeOnDisk20GB} pts</Label>
                  <Slider
                    value={[settings.sizeOnDisk20GB]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, sizeOnDisk20GB: value })
                    }
                    max={settings.sizeOnDiskMaxPoints}
                    step={1}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>20-50GB: {settings.sizeOnDisk50GB} pts</Label>
                  <Slider
                    value={[settings.sizeOnDisk50GB]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, sizeOnDisk50GB: value })
                    }
                    max={settings.sizeOnDiskMaxPoints}
                    step={1}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>≥50GB: {settings.sizeOnDiskOver50GB} pts</Label>
                  <Slider
                    value={[settings.sizeOnDiskOver50GB]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, sizeOnDiskOver50GB: value })
                    }
                    max={settings.sizeOnDiskMaxPoints}
                    step={1}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Age Since Added Factor */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold'>Age Since Added</h3>
              <p className='text-sm text-muted-foreground'>
                Media that was added to your library long ago receives higher
                scores. Recently added media is protected with lower scores.
              </p>
            </div>
            <Switch
              checked={settings.ageSinceAddedEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, ageSinceAddedEnabled: checked })
              }
            />
          </div>

          {settings.ageSinceAddedEnabled && (
            <div className='space-y-3 pl-4'>
              <div className='space-y-2'>
                <Label>Max Points: {settings.ageSinceAddedMaxPoints}</Label>
                <Slider
                  value={[settings.ageSinceAddedMaxPoints]}
                  onValueChange={([value]) =>
                    setSettings({ ...settings, ageSinceAddedMaxPoints: value })
                  }
                  max={30}
                  step={1}
                  data-testid='rating-weight'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <Label>
                    180-365 days: {settings.ageSinceAdded180Days} pts
                  </Label>
                  <Slider
                    value={[settings.ageSinceAdded180Days]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, ageSinceAdded180Days: value })
                    }
                    max={settings.ageSinceAddedMaxPoints}
                    step={1}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>
                    365-730 days: {settings.ageSinceAdded365Days} pts
                  </Label>
                  <Slider
                    value={[settings.ageSinceAdded365Days]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, ageSinceAdded365Days: value })
                    }
                    max={settings.ageSinceAddedMaxPoints}
                    step={1}
                  />
                </div>
                <div className='space-y-1 col-span-2'>
                  <Label>
                    &gt;730 days: {settings.ageSinceAddedOver730} pts
                  </Label>
                  <Slider
                    value={[settings.ageSinceAddedOver730]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, ageSinceAddedOver730: value })
                    }
                    max={settings.ageSinceAddedMaxPoints}
                    step={1}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Folder Space Factor */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold'>Folder Space</h3>
              <p className='text-sm text-muted-foreground'>
                Media stored in folders with limited remaining space receives
                higher scores, helping to free up space in critical locations.
              </p>
            </div>
            <Switch
              checked={settings.folderSpaceEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, folderSpaceEnabled: checked })
              }
            />
          </div>

          {settings.folderSpaceEnabled && (
            <div className='space-y-3 pl-4'>
              <div className='space-y-2'>
                <Label>Max Points: {settings.folderSpaceMaxPoints}</Label>
                <Slider
                  value={[settings.folderSpaceMaxPoints]}
                  onValueChange={([value]) =>
                    setSettings({ ...settings, folderSpaceMaxPoints: value })
                  }
                  max={30}
                  step={1}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <Label>
                    &lt;10% remaining: {settings.folderSpace10Percent} pts
                  </Label>
                  <Slider
                    value={[settings.folderSpace10Percent]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, folderSpace10Percent: value })
                    }
                    max={settings.folderSpaceMaxPoints}
                    step={1}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>
                    10-20% remaining: {settings.folderSpace20Percent} pts
                  </Label>
                  <Slider
                    value={[settings.folderSpace20Percent]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, folderSpace20Percent: value })
                    }
                    max={settings.folderSpaceMaxPoints}
                    step={1}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>
                    20-30% remaining: {settings.folderSpace30Percent} pts
                  </Label>
                  <Slider
                    value={[settings.folderSpace30Percent]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, folderSpace30Percent: value })
                    }
                    max={settings.folderSpaceMaxPoints}
                    step={1}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>
                    30-50% remaining: {settings.folderSpace50Percent} pts
                  </Label>
                  <Slider
                    value={[settings.folderSpace50Percent]}
                    onValueChange={([value]) =>
                      setSettings({ ...settings, folderSpace50Percent: value })
                    }
                    max={settings.folderSpaceMaxPoints}
                    step={1}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

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

        {/* Action Buttons */}
        <div className='flex justify-between pt-4'>
          <div className='flex space-x-2'>
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
            disabled={saving}
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
              <Button onClick={handleSave}>Save & Recalculate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
