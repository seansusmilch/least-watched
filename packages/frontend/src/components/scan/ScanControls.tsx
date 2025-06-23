import { useState } from 'react';
import { useScanContext } from '@/context/ScanContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle, Play, Square, RotateCcw, Loader2 } from 'lucide-react';
import type { ScanSettings } from '@/types/scan';

interface ScanControlsProps {
  onStartScan?: (settings: ScanSettings) => void;
}

export function ScanControls({ onStartScan }: ScanControlsProps) {
  const {
    isScanning,
    isScanComplete,
    scanStatus,
    startScan,
    resetScan,
    error,
    isLoading,
  } = useScanContext();

  const [isStarting, setIsStarting] = useState(false);

  const handleStartScan = async (settings: ScanSettings) => {
    try {
      setIsStarting(true);
      await startScan(settings);
      onStartScan?.(settings);
    } catch (err) {
      console.error('Failed to start scan:', err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleResetScan = () => {
    resetScan();
  };

  // Determine current state
  const getStatusInfo = () => {
    if (error) {
      return {
        status: 'error' as const,
        title: 'Scan Error',
        description: 'There was an error with the scan operation',
        color: 'red',
      };
    }

    if (isScanning) {
      return {
        status: 'running' as const,
        title: 'Scan Running',
        description: 'Media library scan is currently in progress',
        color: 'blue',
      };
    }

    if (isScanComplete) {
      return {
        status: 'complete' as const,
        title: 'Scan Complete',
        description: 'Media library scan has finished successfully',
        color: 'green',
      };
    }

    return {
      status: 'idle' as const,
      title: 'Ready to Scan',
      description: 'Configure your scan settings and start scanning',
      color: 'gray',
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              {statusInfo.status === 'running' && (
                <Loader2 className='w-5 h-5 animate-spin text-blue-500' />
              )}
              {statusInfo.status === 'complete' && (
                <div className='w-2 h-2 bg-green-500 rounded-full'></div>
              )}
              {statusInfo.status === 'error' && (
                <AlertCircle className='w-5 h-5 text-red-500' />
              )}
              {statusInfo.status === 'idle' && (
                <div className='w-2 h-2 bg-gray-400 rounded-full'></div>
              )}
              {statusInfo.title}
            </CardTitle>
            <CardDescription>{statusInfo.description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className='space-y-4'>
          {/* Error Display */}
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
              <div className='flex items-start gap-3'>
                <AlertCircle className='w-5 h-5 text-red-500 mt-0.5 flex-shrink-0' />
                <div>
                  <h4 className='font-medium text-red-800'>Error</h4>
                  <p className='text-red-700 text-sm mt-1'>
                    {error.message ||
                      'An unexpected error occurred during the scan operation.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Summary for Running Scans */}
          {isScanning && scanStatus?.progress && (
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <div className='font-medium text-blue-800'>
                    {Math.round(scanStatus.progress.percent_complete)}% Complete
                  </div>
                  <div className='text-blue-600 text-sm'>
                    {scanStatus.progress.processed_items} /{' '}
                    {scanStatus.progress.total_items} items processed
                  </div>
                </div>
                <div className='text-right'>
                  <div className='font-medium text-green-600'>
                    {scanStatus.progress.unwatched_found}
                  </div>
                  <div className='text-green-600 text-sm'>unwatched found</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex gap-3'>
            {statusInfo.status === 'idle' && (
              <div className='text-center w-full'>
                <p className='text-sm text-gray-600 mb-3'>
                  Configure your scan settings above and click start when ready
                </p>
                <div className='flex items-center justify-center gap-2 text-gray-500'>
                  <Play className='w-4 h-4' />
                  <span className='text-sm'>Ready to scan</span>
                </div>
              </div>
            )}

            {statusInfo.status === 'running' && (
              <Button
                disabled
                className='flex-1 bg-blue-600 cursor-not-allowed opacity-60'
              >
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Scan in Progress...
              </Button>
            )}

            {(statusInfo.status === 'complete' ||
              statusInfo.status === 'error') && (
              <Button
                onClick={handleResetScan}
                variant='outline'
                className='flex-1 border-gray-300'
              >
                <RotateCcw className='w-4 h-4 mr-2' />
                Start New Scan
              </Button>
            )}
          </div>

          {/* Status Indicators */}
          <div className='flex items-center justify-center gap-6 pt-2 border-t border-gray-200'>
            <div className='flex items-center gap-2 text-sm'>
              <div
                className={`w-2 h-2 rounded-full ${
                  isLoading ? 'bg-yellow-400' : 'bg-gray-300'
                }`}
              ></div>
              <span className='text-gray-600'>
                {isLoading ? 'Loading...' : 'Ready'}
              </span>
            </div>

            <div className='flex items-center gap-2 text-sm'>
              <div
                className={`w-2 h-2 rounded-full ${
                  isScanning ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                }`}
              ></div>
              <span className='text-gray-600'>
                {isScanning ? 'Scanning' : 'Idle'}
              </span>
            </div>

            <div className='flex items-center gap-2 text-sm'>
              <div
                className={`w-2 h-2 rounded-full ${
                  isScanComplete ? 'bg-green-500' : 'bg-gray-300'
                }`}
              ></div>
              <span className='text-gray-600'>
                {isScanComplete ? 'Complete' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
