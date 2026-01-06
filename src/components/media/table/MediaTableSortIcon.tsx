import { SortAsc, SortDesc } from 'lucide-react';

interface MediaTableSortIconProps {
  sortState: false | 'asc' | 'desc';
}

export function MediaTableSortIcon({ sortState }: MediaTableSortIconProps) {
  if (sortState === 'asc') {
    return <SortAsc className='h-4 w-4 ml-1' />;
  }

  if (sortState === 'desc') {
    return <SortDesc className='h-4 w-4 ml-1' />;
  }

  return null;
}
