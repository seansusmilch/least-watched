'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Play, Download, AlertCircle } from 'lucide-react';
import { useActionState, useOptimistic, useTransition } from 'react';
import { toast } from 'sonner';
import {
  startMediaProcessing,
  refreshMediaItems,
  exportMediaItems,
  refreshFolderSpaceData,
  getActiveMediaProcess,
} from '@/lib/actions/media-processing';

interface PageActionsEnhancedProps {
  selectedItems?: string[];
  onProcessingStart?: (progressId: string) => void;
  onRefreshComplete?: () => void;
  onExportComplete?: (count: number) => void;
  disabled?: boolean;
}

interface OptimisticState {
  processing: boolean;
  refreshing: boolean;
  exporting: boolean;
  error: string | null;
}

export function PageActionsEnhanced({
  selectedItems = [],
  onProcessingStart,
  onRefreshComplete,
  onExportComplete,
  disabled = false,
}: PageActionsEnhancedProps) {
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [hasActiveProcess, setHasActiveProcess] = useState(false);

  // Check for active processes
  useEffect(() => {
    const checkActiveProcess = async () => {
      try {
        const activeProcess = await getActiveMediaProcess();
        setHasActiveProcess(activeProcess !== null);
      } catch (error) {
        console.error('Failed to check active process:', error);
        setHasActiveProcess(false);
      }
    };

    // Check immediately
    checkActiveProcess();

    // Then check every 2 seconds
    const interval = setInterval(checkActiveProcess, 2000);

    return () => clearInterval(interval);
  }, []);

  // Optimistic state for immediate UI feedback
  const [optimisticState, addOptimisticUpdate] = useOptimistic<
    OptimisticState,
    Partial<OptimisticState>
  >(
    {
      processing: false,
      refreshing: false,
      exporting: false,
      error: null,
    },
    (state, newUpdate) => ({ ...state, ...newUpdate })
  );

  // Server actions with useActionState
  const [processState, processAction, processPending] = useActionState(
    startMediaProcessing,
    undefined
  );

  const [refreshState, refreshAction, refreshPending] = useActionState(
    refreshMediaItems,
    undefined
  );

  const [exportState, exportAction, exportPending] = useActionState(
    exportMediaItems,
    undefined
  );

  const [, folderRefreshAction, folderRefreshPending] = useActionState(
    refreshFolderSpaceData,
    undefined
  );

  // Handle process media action
  const handleProcess = useCallback(() => {
    startTransition(() => {
      setLastAction('process');
      addOptimisticUpdate({ processing: true, error: null });

      const formData = new FormData();
      processAction(formData);
    });
  }, [processAction, addOptimisticUpdate]);

  // Handle refresh action
  const handleRefresh = useCallback(() => {
    startTransition(() => {
      setLastAction('refresh');
      addOptimisticUpdate({ refreshing: true, error: null });

      const formData = new FormData();

      // Call both refresh actions
      refreshAction(formData);
      folderRefreshAction(formData);
    });
  }, [refreshAction, folderRefreshAction, addOptimisticUpdate]);

  // Handle export action
  const handleExport = useCallback(() => {
    if (selectedItems.length === 0) {
      toast.error('No items selected for export');
      return;
    }

    startTransition(() => {
      setLastAction('export');
      addOptimisticUpdate({ exporting: true, error: null });

      const formData = new FormData();
      selectedItems.forEach((id) => formData.append('selectedIds', id));

      exportAction(formData);
    });
  }, [selectedItems, exportAction, addOptimisticUpdate]);

  // Handle server action results
  React.useEffect(() => {
    if (processState?.success && lastAction === 'process') {
      startTransition(() => {
        addOptimisticUpdate({ processing: false });
      });
      toast.success(
        processState.message || 'Media processing started successfully'
      );

      if (processState.data?.progressId && onProcessingStart) {
        onProcessingStart(processState.data.progressId);
      }
    } else if (processState?.success === false && lastAction === 'process') {
      startTransition(() => {
        addOptimisticUpdate({
          processing: false,
          error: processState.message || 'Processing failed',
        });
      });
      toast.error(processState.message || 'Failed to start media processing');
    }
  }, [processState, lastAction, onProcessingStart, addOptimisticUpdate]);

  React.useEffect(() => {
    if (refreshState?.success && lastAction === 'refresh') {
      startTransition(() => {
        addOptimisticUpdate({ refreshing: false });
      });
      toast.success(refreshState.message || 'Data refreshed successfully');

      if (onRefreshComplete) {
        onRefreshComplete();
      }
    } else if (refreshState?.success === false && lastAction === 'refresh') {
      startTransition(() => {
        addOptimisticUpdate({
          refreshing: false,
          error: refreshState.message || 'Refresh failed',
        });
      });
      toast.error(refreshState.message || 'Failed to refresh data');
    }
  }, [refreshState, lastAction, onRefreshComplete, addOptimisticUpdate]);

  React.useEffect(() => {
    if (exportState?.success && lastAction === 'export') {
      startTransition(() => {
        addOptimisticUpdate({ exporting: false });
      });
      toast.success(exportState.message || 'Export completed successfully');

      if (
        exportState.data &&
        typeof exportState.data === 'object' &&
        'count' in exportState.data &&
        onExportComplete
      ) {
        onExportComplete((exportState.data as { count: number }).count);
      }
    } else if (exportState?.success === false && lastAction === 'export') {
      startTransition(() => {
        addOptimisticUpdate({
          exporting: false,
          error: exportState.message || 'Export failed',
        });
      });
      toast.error(exportState.message || 'Failed to export items');
    }
  }, [exportState, lastAction, onExportComplete, addOptimisticUpdate]);

  // Use optimistic state for rendering
  const isProcessing = optimisticState.processing || processPending;
  const isRefreshing =
    optimisticState.refreshing || refreshPending || folderRefreshPending;
  const isExporting = optimisticState.exporting || exportPending;
  const hasError = !!optimisticState.error;

  // Disable actions if there's an active process or if explicitly disabled
  const shouldDisable = disabled || hasActiveProcess;

  return (
    <div className='flex items-center space-x-2'>
      {/* Process Media Button */}
      <Button
        onClick={handleProcess}
        disabled={shouldDisable || isProcessing || isRefreshing || isPending}
        size='sm'
        className='relative'
      >
        {isProcessing ? (
          <>
            <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
            Processing...
          </>
        ) : (
          <>
            <Play className='h-4 w-4 mr-2' />
            Process Media
          </>
        )}
      </Button>

      {/* Refresh Button */}
      <Button
        variant='outline'
        size='sm'
        onClick={handleRefresh}
        disabled={shouldDisable || isRefreshing || isProcessing || isPending}
        className='relative'
      >
        {isRefreshing ? (
          <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
        ) : (
          <RefreshCw className='h-4 w-4 mr-2' />
        )}
        Refresh
      </Button>

      {/* Export Button */}
      <Button
        variant='outline'
        size='sm'
        disabled={
          shouldDisable ||
          selectedItems.length === 0 ||
          isExporting ||
          isPending
        }
        onClick={handleExport}
        className='relative'
      >
        {isExporting ? (
          <>
            <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
            Exporting...
          </>
        ) : (
          <>
            <Download className='h-4 w-4 mr-2' />
            Export ({selectedItems.length})
          </>
        )}
      </Button>

      {/* Error Indicator */}
      {hasError && (
        <div className='flex items-center text-destructive'>
          <AlertCircle className='h-4 w-4 mr-1' />
          <span className='text-xs'>Action failed</span>
        </div>
      )}
    </div>
  );
}
