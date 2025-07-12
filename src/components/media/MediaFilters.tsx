import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, Search } from 'lucide-react';
import { FilterOptions } from '@/lib/types/media';

interface MediaFiltersProps {
  filters: FilterOptions;
  onFilterChange: (key: keyof FilterOptions, value: string) => void;
}

export const MediaFilters = ({
  filters,
  onFilterChange,
}: MediaFiltersProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center space-x-2'>
          <Filter className='h-5 w-5' />
          <span>Filters & Search</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <div className='space-y-2'>
            <Label htmlFor='search'>Search</Label>
            <div className='relative'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                id='search'
                placeholder='Search titles...'
                value={filters.searchTerm}
                onChange={(e) => onFilterChange('searchTerm', e.target.value)}
                className='pl-8'
              />
            </div>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='type'>Media Type</Label>
            <Select
              value={filters.filterType}
              onValueChange={(value: 'all' | 'movie' | 'tv') =>
                onFilterChange('filterType', value)
              }
            >
              <SelectTrigger id='type'>
                <SelectValue placeholder='Select type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Types</SelectItem>
                <SelectItem value='movie'>Movies</SelectItem>
                <SelectItem value='tv'>TV Shows</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='minSize'>Min Size (GB)</Label>
            <Input
              id='minSize'
              type='number'
              placeholder='0'
              value={filters.minSize}
              onChange={(e) => onFilterChange('minSize', e.target.value)}
            />
          </div>
        </div>
        {/* Active Folder Filter */}
        {filters.folderFilter && (
          <div className='mt-4 flex items-center space-x-2'>
            <Badge variant='secondary' className='flex items-center space-x-2'>
              <span>Folder: {filters.folderFilter} (and subfolders)</span>
              <Button
                variant='ghost'
                size='sm'
                className='h-4 w-4 p-0 hover:bg-transparent'
                onClick={() => onFilterChange('folderFilter', '')}
              >
                ×
              </Button>
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
