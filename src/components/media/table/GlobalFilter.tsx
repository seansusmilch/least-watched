import { Table as TanStackTable } from '@tanstack/react-table';
import { MediaItem } from '@/lib/types/media';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface GlobalFilterProps {
  table: TanStackTable<MediaItem>;
  placeholder?: string;
  className?: string;
}

export function GlobalFilter({
  table,
  placeholder = 'Search all columns...',
  className = 'pl-8 w-64',
}: GlobalFilterProps) {
  return (
    <div className='relative'>
      <Search className='h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground' />
      <Input
        placeholder={placeholder}
        value={table.getState().globalFilter ?? ''}
        onChange={(event) => table.setGlobalFilter(String(event.target.value))}
        className={className}
      />
    </div>
  );
}
