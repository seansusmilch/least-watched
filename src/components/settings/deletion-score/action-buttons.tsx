'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
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
import { FileInput } from '@/components/ui/file-input';
import { Save, Download, Upload, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Breakpoint,
  DeletionScoreSettings,
} from '@/lib/actions/settings/types';

interface ActionButtonsProps {
  settings: DeletionScoreSettings;
  saving: boolean;
  validation: { isValid: boolean; message: string };
  onSaveClick: () => void;
  onExportSettings: () => void;
  onResetToDefaults: () => void;
  onImportSettings: (settings: DeletionScoreSettings) => void;
  showResetDialog: boolean;
  setShowResetDialog: (show: boolean) => void;
  showImportDialog: boolean;
  setShowImportDialog: (show: boolean) => void;
}

export function ActionButtons({
  saving,
  validation,
  onSaveClick,
  onExportSettings,
  onResetToDefaults,
  onImportSettings,
  showResetDialog,
  setShowResetDialog,
  showImportDialog,
  setShowImportDialog,
}: ActionButtonsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className='flex justify-between pt-4'>
      <div className='flex space-x-2'>
        <Button
          variant='outline'
          onClick={onExportSettings}
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
                Select a JSON file containing deletion score settings to import.
                This will replace your current settings.
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
                      const requiredFields = [
                        'enabled',
                        'daysUnwatchedEnabled',
                        'daysUnwatchedMaxPoints',
                        'neverWatchedEnabled',
                        'neverWatchedPoints',
                        'sizeOnDiskEnabled',
                        'sizeOnDiskMaxPoints',
                        'ageSinceAddedEnabled',
                        'ageSinceAddedMaxPoints',
                        'folderSpaceEnabled',
                        'folderSpaceMaxPoints',
                      ];

                      for (const field of requiredFields) {
                        if (!(field in importedSettings)) {
                          throw new Error(
                            `Invalid file format: missing required field '${field}'`
                          );
                        }
                      }

                      // Validate breakpoints
                      const breakpointFields = [
                        'daysUnwatchedBreakpoints',
                        'sizeOnDiskBreakpoints',
                        'ageSinceAddedBreakpoints',
                        'folderSpaceBreakpoints',
                      ];

                      for (const field of breakpointFields) {
                        const breakpoints = importedSettings[
                          field as keyof DeletionScoreSettings
                        ] as Breakpoint[] | undefined;

                        if (!Array.isArray(breakpoints)) {
                          throw new Error(
                            `Invalid file format: '${field}' must be an array.`
                          );
                        }
                        for (const bp of breakpoints) {
                          if (
                            typeof bp.value !== 'number' ||
                            typeof bp.percent !== 'number'
                          ) {
                            throw new Error(
                              `Invalid breakpoint in '${field}'. Each breakpoint must have a 'value' and 'percent' as numbers.`
                            );
                          }
                        }
                      }

                      onImportSettings(importedSettings);
                      setShowImportDialog(false);
                      toast.success('Settings imported successfully!');
                    } catch (error) {
                      console.error('Failed to import settings:', error);
                      toast.error(
                        `Failed to import settings: ${
                          error instanceof Error ? error.message : String(error)
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
              <Button onClick={onResetToDefaults}>Reset to Defaults</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Button
        onClick={onSaveClick}
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
  );
}
