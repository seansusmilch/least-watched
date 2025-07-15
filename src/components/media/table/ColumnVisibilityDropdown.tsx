import { Table as TanStackTable } from '@tanstack/react-table';
import { MediaItem } from '@/lib/types/media';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Columns } from 'lucide-react';
import { availableColumns } from '@/lib/utils/columnConfig';

interface ColumnVisibilityDropdownProps {
  table: TanStackTable<MediaItem>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ColumnVisibilityDropdown({
  table,
  open,
  onOpenChange,
}: ColumnVisibilityDropdownProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm'>
          <Columns className='h-4 w-4 mr-2' />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-48'>
        <div className='mb-3'>
          <h4 className='font-medium text-sm'>Column Visibility</h4>
          <p className='text-xs text-muted-foreground'>
            Select which columns to display in the table
          </p>
        </div>
        <div className='grid gap-2'>
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => {
              const columnConfig = availableColumns.find(
                (c) => c.id === column.id
              );
              return (
                <div key={column.id} className='flex items-center'>
                  <Checkbox
                    id={`column-${column.id}`}
                    checked={column.getIsVisible()}
                    onCheckedChange={(checked) =>
                      column.toggleVisibility(!!checked)
                    }
                  />
                  <Label htmlFor={`column-${column.id}`} className='ml-2'>
                    {columnConfig?.label || column.id}
                  </Label>
                </div>
              );
            })}
        </div>
        <div className='flex justify-end space-x-2 mt-4'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.resetColumnVisibility()}
          >
            Reset
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
