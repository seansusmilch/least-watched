import React, {
  createContext,
  useContext,
  useCallback,
  ReactNode,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, queryKeys } from '../lib/api';
import type { ScanSettings, ScanStatus } from '../types/scan';

interface ScanContextType {
  // State
  scanStatus: ScanStatus | undefined;
  isLoading: boolean;
  isPolling: boolean;
  error: Error | null;

  // Actions
  startScan: (settings: ScanSettings) => Promise<void>;
  resetScan: () => void;

  // Utilities
  isScanning: boolean;
  isScanComplete: boolean;
}

const ScanContext = createContext<ScanContextType | undefined>(undefined);

interface ScanProviderProps {
  children: ReactNode;
}

export function ScanProvider({ children }: ScanProviderProps) {
  const queryClient = useQueryClient();

  // Query for scan progress with conditional polling
  const {
    data: scanStatus,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.scan.progress(),
    queryFn: api.getScanProgress,
    refetchInterval: (query) => {
      // Poll every 1 second if scan is in progress, otherwise don't poll
      return query.state.data?.scan_in_progress ? 1000 : false;
    },
    refetchIntervalInBackground: true,
    staleTime: 0, // Always consider stale for real-time updates
  });

  // Mutation for starting scans
  const startScanMutation = useMutation({
    mutationFn: api.startScan,
    onSuccess: () => {
      // Invalidate and refetch scan progress after starting
      queryClient.invalidateQueries({ queryKey: queryKeys.scan.all });
      refetch();
    },
    onError: (error) => {
      console.error('Failed to start scan:', error);
    },
  });

  // Actions
  const startScan = useCallback(
    async (settings: ScanSettings) => {
      await startScanMutation.mutateAsync(settings);
    },
    [startScanMutation]
  );

  const resetScan = useCallback(() => {
    // Invalidate scan queries to reset state
    queryClient.invalidateQueries({ queryKey: queryKeys.scan.all });
  }, [queryClient]);

  // Computed values
  const isScanning = scanStatus?.scan_in_progress ?? false;
  const isScanComplete = scanStatus?.scan_complete ?? false;
  const isPolling = isScanning;

  const contextValue: ScanContextType = {
    // State
    scanStatus,
    isLoading,
    isPolling,
    error: error as Error | null,

    // Actions
    startScan,
    resetScan,

    // Utilities
    isScanning,
    isScanComplete,
  };

  return (
    <ScanContext.Provider value={contextValue}>{children}</ScanContext.Provider>
  );
}

// Custom hook to use scan context
export function useScanContext() {
  const context = useContext(ScanContext);
  if (context === undefined) {
    throw new Error('useScanContext must be used within a ScanProvider');
  }
  return context;
}
