import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { formatFileSize } from '@/lib/utils/formatters';

interface MediaTableSelectionControlsProps {
  selectedCount: number;
  selectedSize: number;
  onDeleteClick: () => void;
}

export function MediaTableSelectionControls({
  selectedCount,
  selectedSize,
  onDeleteClick,
}: MediaTableSelectionControlsProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className='flex items-center justify-between md:justify-start gap-2 p-1 md:p-0'>
      <Badge variant='secondary' className='whitespace-nowrap'>
        {selectedCount} selected ({formatFileSize(selectedSize)})
      </Badge>
      <Button
        variant='destructive'
        size='sm'
        onClick={onDeleteClick}
        className='h-7'
      >
        <Trash2 className='h-3 w-3 mr-1' />
        Delete
      </Button>
    </div>
  );
}
