import { Button } from '@/components/ui/button';
import { RefreshCw, Play, Download } from 'lucide-react';

interface PageActionsProps {
  processing: boolean;
  loading: boolean;
  selectedCount: number;
  onProcess: () => void;
  onRefresh: () => void;
  onExport?: () => void;
}

export const PageActions = ({
  processing,
  loading,
  selectedCount,
  onProcess,
  onRefresh,
  onExport,
}: PageActionsProps) => {
  return (
    <div className='flex items-center space-x-2'>
      <Button onClick={onProcess} disabled={processing} size='sm'>
        {processing ? (
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
      <Button
        variant='outline'
        size='sm'
        onClick={onRefresh}
        disabled={loading}
      >
        {loading ? (
          <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
        ) : (
          <RefreshCw className='h-4 w-4 mr-2' />
        )}
        Refresh
      </Button>
      <Button
        variant='outline'
        size='sm'
        disabled={selectedCount === 0}
        onClick={onExport}
      >
        <Download className='h-4 w-4 mr-2' />
        Export ({selectedCount})
      </Button>
    </div>
  );
};
