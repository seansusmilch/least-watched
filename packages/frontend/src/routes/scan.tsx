import { createFileRoute } from '@tanstack/react-router';
import { ScanProvider, useScanContext } from '@/context/ScanContext';
import { ScanSettingsForm } from '@/components/scan/ScanSettingsForm';
import { ScanProgressDisplay } from '@/components/scan/ScanProgressDisplay';
import { ScanResults } from '@/components/scan/ScanResults';
import { ScanControls } from '@/components/scan/ScanControls';
import type { ScanSettings } from '@/types/scan';
import { toast } from 'sonner';

export const Route = createFileRoute('/scan')({
  component: ScanPageWrapper,
});

// Wrapper component to provide ScanContext
function ScanPageWrapper() {
  return (
    <ScanProvider>
      <ScanPage />
    </ScanProvider>
  );
}

function ScanPage() {
  const { startScan, isScanning, error } = useScanContext();

  const handleStartScan = async (settings: ScanSettings) => {
    try {
      await startScan(settings);
      toast.success('Scan started successfully!');
    } catch (err) {
      toast.error('Failed to start scan. Please try again.');
      console.error('Failed to start scan:', err);
    }
  };

  return (
    <main className='flex min-h-screen flex-col p-8'>
      <div className='max-w-4xl mx-auto w-full space-y-8'>
        {/* Page Header */}
        <div className='text-center'>
          <h1 className='text-4xl font-bold mb-4'>Media Library Scan</h1>
          <p className='text-gray-600 text-lg'>
            Find unwatched media in your library by configuring and running a
            scan
          </p>
        </div>

        {/* Scan Results (only shows when complete) */}
        <ScanResults />

        {/* Scan Progress (only shows when running) */}
        <ScanProgressDisplay />

        {/* Main Content Grid */}
        <div className='grid gap-8 lg:grid-cols-2'>
          {/* Left Column - Scan Settings */}
          <div>
            <ScanSettingsForm
              onSubmit={handleStartScan}
              disabled={isScanning}
              submitLabel={isScanning ? 'Scan in Progress...' : 'Start Scan'}
            />
          </div>

          {/* Right Column - Scan Controls */}
          <div>
            <ScanControls
              onStartScan={(settings) => {
                console.log('Scan started with settings:', settings);
              }}
            />
          </div>
        </div>

        {/* Error Boundary Info */}
        {error && (
          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
            <h3 className='font-semibold text-red-800 mb-2'>Scan Error</h3>
            <p className='text-red-700'>
              {error.message || 'An error occurred during the scan operation.'}
            </p>
          </div>
        )}

        {/* Help Section */}
        <div className='bg-gray-50 rounded-lg p-6 border border-gray-200'>
          <h3 className='font-semibold text-gray-900 mb-3'>
            How Scanning Works
          </h3>
          <div className='grid gap-4 md:grid-cols-2'>
            <div>
              <h4 className='font-medium text-gray-800 mb-2'>
                📋 Scan Process
              </h4>
              <ul className='text-sm text-gray-600 space-y-1'>
                <li>• Connects to your media servers (Sonarr/Radarr)</li>
                <li>• Checks playback history from Emby/Jellyfin</li>
                <li>• Identifies unwatched content based on your criteria</li>
                <li>• Calculates total size and provides detailed results</li>
              </ul>
            </div>
            <div>
              <h4 className='font-medium text-gray-800 mb-2'>
                ⚙️ Settings Guide
              </h4>
              <ul className='text-sm text-gray-600 space-y-1'>
                <li>
                  • <strong>Days Threshold:</strong> Minimum days since last
                  watched
                </li>
                <li>
                  • <strong>Ignore Newer:</strong> Skip recently added content
                </li>
                <li>
                  • <strong>Concurrent Limit:</strong> Processing speed vs.
                  server load
                </li>
                <li>
                  • <strong>Batch Size:</strong> Items processed per batch
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
