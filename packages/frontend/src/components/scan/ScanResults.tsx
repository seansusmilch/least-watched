import { useScanContext } from '@/context/ScanContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Eye, HardDrive, FileText } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export function ScanResults() {
  const { scanStatus, isScanComplete, resetScan } = useScanContext();

  // Don't render if scan is not complete or no results
  if (!isScanComplete || !scanStatus?.results) {
    return null;
  }

  const { results, progress } = scanStatus;
  const { total_count, total_size } = results;
  const { unwatched_found, processed_items } = progress;

  // Format file size in GB
  const formatSize = (sizeInGB: number): string => {
    if (sizeInGB === 0) return '0 GB';
    if (sizeInGB < 1) return `${(sizeInGB * 1024).toFixed(2)} MB`;
    if (sizeInGB > 1024) return `${(sizeInGB / 1024).toFixed(2)} TB`;
    return `${sizeInGB.toFixed(2)} GB`;
  };

  return (
    <Card className='border-green-200 bg-green-50'>
      <CardHeader className='pb-4'>
        <div className='flex items-center gap-3'>
          <div className='flex items-center justify-center w-10 h-10 bg-green-100 rounded-full'>
            <CheckCircle className='w-6 h-6 text-green-600' />
          </div>
          <div>
            <CardTitle className='text-green-800'>Scan Complete!</CardTitle>
            <CardDescription className='text-green-700'>
              Your media library scan has finished successfully
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Summary Statistics */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='bg-white rounded-lg p-4 text-center border border-green-200'>
            <div className='flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-2'>
              <FileText className='w-4 h-4 text-blue-600' />
            </div>
            <div className='text-2xl font-bold text-gray-900'>
              {processed_items}
            </div>
            <div className='text-sm text-gray-600'>Items Scanned</div>
          </div>

          <div className='bg-white rounded-lg p-4 text-center border border-green-200'>
            <div className='flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full mx-auto mb-2'>
              <Eye className='w-4 h-4 text-orange-600' />
            </div>
            <div className='text-2xl font-bold text-orange-600'>
              {unwatched_found}
            </div>
            <div className='text-sm text-gray-600'>Unwatched Found</div>
          </div>

          <div className='bg-white rounded-lg p-4 text-center border border-green-200'>
            <div className='flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full mx-auto mb-2'>
              <FileText className='w-4 h-4 text-purple-600' />
            </div>
            <div className='text-2xl font-bold text-purple-600'>
              {total_count}
            </div>
            <div className='text-sm text-gray-600'>Total Unwatched</div>
          </div>

          <div className='bg-white rounded-lg p-4 text-center border border-green-200'>
            <div className='flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-full mx-auto mb-2'>
              <HardDrive className='w-4 h-4 text-indigo-600' />
            </div>
            <div className='text-2xl font-bold text-indigo-600'>
              {formatSize(total_size)}
            </div>
            <div className='text-sm text-gray-600'>Total Size</div>
          </div>
        </div>

        <Separator />

        {/* Summary Message */}
        <div className='bg-white rounded-lg p-4 border border-green-200'>
          <h4 className='font-semibold text-gray-900 mb-2'>Scan Summary</h4>
          <p className='text-gray-700'>
            Found{' '}
            <span className='font-semibold text-orange-600'>
              {unwatched_found}
            </span>{' '}
            unwatched items out of{' '}
            <span className='font-semibold'>{processed_items}</span> items
            scanned
            {processed_items > 0 && (
              <span className='text-gray-600'>
                {' '}
                ({((unwatched_found / processed_items) * 100).toFixed(1)}%
                unwatched rate)
              </span>
            )}
          </p>
          {total_count > 0 && (
            <p className='text-gray-700 mt-2'>
              Your unwatched media totals{' '}
              <span className='font-semibold text-indigo-600'>
                {formatSize(total_size)}
              </span>
              across{' '}
              <span className='font-semibold text-purple-600'>
                {total_count}
              </span>{' '}
              items.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row gap-3'>
          <Button asChild className='flex-1 bg-green-600 hover:bg-green-700'>
            <Link to='/media'>
              <Eye className='w-4 h-4 mr-2' />
              View Unwatched Media
            </Link>
          </Button>

          <Button
            onClick={resetScan}
            variant='outline'
            className='flex-1 border-green-300 text-green-700 hover:bg-green-50'
          >
            <FileText className='w-4 h-4 mr-2' />
            Start New Scan
          </Button>
        </div>

        {/* Tips */}
        <div className='bg-blue-50 rounded-lg p-4 border border-blue-200'>
          <h5 className='font-medium text-blue-900 mb-2'>💡 Next Steps</h5>
          <ul className='text-sm text-blue-800 space-y-1'>
            <li>• Review your unwatched media in the Media tab</li>
            <li>
              • Consider adjusting scan settings if results don't look right
            </li>
            <li>• Run scans periodically to keep your library up to date</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
