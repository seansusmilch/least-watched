import { useScanContext } from '@/context/ScanContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function ScanProgressDisplay() {
  const { scanStatus, isScanning, isPolling } = useScanContext();

  // Don't render if no scan data or not scanning
  if (!scanStatus || !isScanning) {
    return null;
  }

  const { progress } = scanStatus;
  const {
    total_items,
    processed_items,
    percent_complete,
    current_item,
    unwatched_found,
  } = progress;

  return (
    <Card>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              Scan in Progress
              {isPolling && (
                <div className='flex items-center gap-1'>
                  <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                  <span className='text-sm text-green-500 font-normal'>
                    Live
                  </span>
                </div>
              )}
            </CardTitle>
            <CardDescription>
              Processing your media library for unwatched content
            </CardDescription>
          </div>
          <div className='bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium'>
            {Math.round(percent_complete)}% Complete
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Main Progress Bar */}
        <div className='space-y-2'>
          <div className='flex justify-between text-sm text-gray-600'>
            <span>Progress</span>
            <span>
              {processed_items} / {total_items} items
            </span>
          </div>
          <Progress value={percent_complete} className='w-full' />
        </div>

        {/* Current Item Being Processed */}
        {current_item && (
          <div className='space-y-2'>
            <h4 className='text-sm font-medium text-gray-700'>
              Currently Processing
            </h4>
            <div className='bg-gray-50 rounded-lg p-3'>
              <p
                className='text-sm text-gray-800 font-mono truncate'
                title={current_item}
              >
                {current_item}
              </p>
            </div>
          </div>
        )}

        {/* Statistics Grid */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='bg-gray-50 rounded-lg p-4 text-center'>
            <div className='text-2xl font-bold text-gray-900'>
              {processed_items}
            </div>
            <div className='text-sm text-gray-500'>Items Processed</div>
          </div>
          <div className='bg-green-50 rounded-lg p-4 text-center'>
            <div className='text-2xl font-bold text-green-600'>
              {unwatched_found}
            </div>
            <div className='text-sm text-green-600'>Unwatched Found</div>
          </div>
        </div>

        {/* Processing Rate */}
        {total_items > 0 && (
          <div className='text-center'>
            <div className='text-xs text-gray-500'>
              {processed_items > 0 && (
                <>
                  {((unwatched_found / processed_items) * 100).toFixed(1)}%
                  unwatched rate
                  {total_items - processed_items > 0 && (
                    <> • {total_items - processed_items} items remaining</>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
