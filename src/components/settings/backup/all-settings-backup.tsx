'use client';

import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
import { Download, Upload, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { exportAllSettings, importAllSettings } from '@/lib/actions/settings';

export function AllSettingsBackup() {
  const [importing, setImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleExport = async () => {
    try {
      const data = await exportAllSettings();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `least-watched-settings-${
        new Date().toISOString().split('T')[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Exported all settings');
    } catch {
      toast.error('Failed to export settings');
    }
  };

  const handleFileImport = async (file: File | null) => {
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await importAllSettings(json);
      if (res.success) {
        toast.success('Imported all settings');
        // Invalidate common settings queries
        queryClient.invalidateQueries({ queryKey: ['settings'] });
        queryClient.invalidateQueries({ queryKey: ['app-settings'] });
        queryClient.invalidateQueries({
          queryKey: ['deletion-score-settings'],
        });
        queryClient.invalidateQueries({ queryKey: ['sonarr-settings'] });
        queryClient.invalidateQueries({ queryKey: ['radarr-settings'] });
        queryClient.invalidateQueries({ queryKey: ['emby-settings'] });
        setShowImportDialog(false);
      } else {
        toast.error(res.message || 'Failed to import settings');
      }
    } catch {
      toast.error('Invalid settings file');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <ShieldAlert className='h-5 w-5' /> Backup & Restore
        </CardTitle>
        <CardDescription>
          Export all settings to a JSON file or import from a previous backup.
          Importing will overwrite existing settings, including API keys.
        </CardDescription>
      </CardHeader>
      <CardContent className='flex gap-2 justify-between flex-col sm:flex-row'>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={handleExport} disabled={importing}>
            <Download className='h-4 w-4 mr-2' /> Export Settings
          </Button>

          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant='outline' disabled={importing}>
                <Upload className='h-4 w-4 mr-2' /> Import Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import All Settings</DialogTitle>
                <DialogDescription>
                  Select a JSON file exported from this app. Importing will
                  overwrite existing settings, including API keys.
                </DialogDescription>
              </DialogHeader>
              <div className='py-4'>
                <FileInput
                  ref={fileInputRef}
                  accept='.json'
                  onFileSelect={handleFileImport}
                  buttonText='Choose JSON file'
                  placeholder='Drag and drop a JSON file here, or click to browse'
                  maxSize={1024 * 1024}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant='outline'>Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className='flex items-center text-xs text-muted-foreground'>
          {importing && (
            <>
              <Loader2 className='h-4 w-4 mr-1 animate-spin' /> Importing...
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
