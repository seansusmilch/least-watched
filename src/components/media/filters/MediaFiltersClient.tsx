'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Filter,
  Search,
  Eye,
  Star,
  Settings,
  ChevronDown,
  ChevronUp,
  Zap,
  Tv,
  HardDrive,
  X,
} from 'lucide-react';
import { QuickFilterOption } from '@/lib/types/media';
import { useMediaFilterContext } from './MediaFilterProvider';

interface MediaFiltersClientProps {
  availableGenres: string[];
  availableQualities: string[];
  availableSources: string[];
  availableFolders: string[];
  totalItems: number;
}

// Quick filter presets
const quickFilters: QuickFilterOption[] = [
  {
    id: 'unwatched',
    label: 'Unwatched',
    description: 'Items never watched',
    icon: 'eye-off',
    filters: {
      watchStates: new Set(['unwatched']),
    },
  },
  {
    id: 'old-unwatched',
    label: 'Old & Unwatched',
    description: 'Unwatched for 365+ days',
    icon: 'clock',
    filters: {
      watchStates: new Set(['unwatched']),
      unwatchedDaysRange: { min: 365 },
    },
  },
  {
    id: 'low-quality',
    label: 'Low Quality',
    description: 'Quality score below 60',
    icon: 'trending-down',
    filters: {
      qualityScoreRange: { max: 60 },
    },
  },
  {
    id: 'large-files',
    label: 'Large Files',
    description: 'Files over 10GB',
    icon: 'hard-drive',
    filters: {
      sizeRange: { min: 10, unit: 'GB' },
    },
  },
  {
    id: 'high-deletion-score',
    label: 'High Deletion Score',
    description: 'Deletion score over 70',
    icon: 'target',
    filters: {
      deletionScoreRange: { min: 70 },
    },
  },
];

// Range slider component
interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  value: { min?: number; max?: number };
  onValueChange: (value: { min?: number; max?: number }) => void;
  formatValue: (value: number) => string;
  unit: string;
}

const RangeSlider = ({
  label,
  min,
  max,
  value,
  onValueChange,
  formatValue,
  unit,
}: RangeSliderProps) => {
  const [localValue, setLocalValue] = useState([
    value.min ?? min,
    value.max ?? max,
  ]);

  const handleSliderChange = (newValue: number[]) => {
    setLocalValue(newValue);
    onValueChange({
      min: newValue[0] === min ? undefined : newValue[0],
      max: newValue[1] === max ? undefined : newValue[1],
    });
  };

  return (
    <div className='space-y-2'>
      <Label>{label}</Label>
      <div className='px-2'>
        <Slider
          value={localValue}
          onValueChange={handleSliderChange}
          min={min}
          max={max}
          step={1}
          className='w-full'
        />
        <div className='flex justify-between text-xs text-muted-foreground mt-1'>
          <span>
            {formatValue(localValue[0])}
            {unit}
          </span>
          <span>
            {formatValue(localValue[1])}
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
};

export function MediaFiltersClient({
  availableGenres,
  availableQualities,
  availableSources,
  availableFolders,
  totalItems,
}: MediaFiltersClientProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { filters, updateFilter, resetFilters, applyQuickFilter } =
    useMediaFilterContext();

  const applyQuickFilterHandler = (quickFilter: QuickFilterOption) => {
    applyQuickFilter(quickFilter.filters);
  };

  const clearAllFilters = () => {
    resetFilters();
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.mediaTypes.size > 0) count++;
    if (filters.sources.size > 0) count++;
    if (filters.watchStates.size > 0) count++;
    if (filters.unwatchedDaysRange.min || filters.unwatchedDaysRange.max)
      count++;
    if (filters.sizeRange.min || filters.sizeRange.max) count++;
    if (filters.qualities.size > 0) count++;
    if (filters.qualityScoreRange.min || filters.qualityScoreRange.max) count++;
    if (filters.yearRange.min || filters.yearRange.max) count++;
    if (filters.genres.size > 0) count++;
    if (filters.ratingRange.imdb?.min || filters.ratingRange.imdb?.max) count++;
    if (filters.runtimeRange.min || filters.runtimeRange.max) count++;
    if (filters.completionRange.min || filters.completionRange.max) count++;
    if (filters.folders.size > 0) count++;
    if (filters.deletionScoreRange.min || filters.deletionScoreRange.max)
      count++;
    if (filters.monitored !== undefined) count++;
    return count;
  }, [filters]);

  // Helper function to convert Set to array for MultiSelect
  const setToArray = (set: Set<string>): string[] => Array.from(set);
  const arrayToSet = (array: string[]): Set<string> => new Set(array);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Filter className='h-5 w-5' />
            Filters
          </div>
          <div className='flex items-center gap-2'>
            {activeFilterCount > 0 && (
              <Badge variant='secondary'>{activeFilterCount} active</Badge>
            )}
            <Button
              variant='outline'
              size='sm'
              onClick={clearAllFilters}
              className='h-8'
            >
              <X className='h-3 w-3 mr-1' />
              Clear All
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Quick Filters */}
        <div className='space-y-2'>
          <Label>Quick Filters</Label>
          <div className='flex flex-wrap gap-2'>
            {quickFilters.map((quickFilter) => (
              <Button
                key={quickFilter.id}
                variant='outline'
                size='sm'
                onClick={() => applyQuickFilterHandler(quickFilter)}
                className='text-xs'
              >
                <Zap className='h-3 w-3 mr-1' />
                {quickFilter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Basic Filters - Always Visible */}
        <div className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='search'>Search</Label>
              <div className='relative'>
                <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  id='search'
                  placeholder='Search titles...'
                  value={filters.searchTerm}
                  onChange={(e) => updateFilter({ searchTerm: e.target.value })}
                  className='pl-8'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label>Search Type</Label>
              <Select
                value={filters.searchType}
                onValueChange={(value: 'contains' | 'exact' | 'regex') =>
                  updateFilter({ searchType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='contains'>Contains</SelectItem>
                  <SelectItem value='exact'>Exact Match</SelectItem>
                  <SelectItem value='regex'>Regex</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Media Types</Label>
              <MultiSelect
                options={[
                  { label: 'Movies', value: 'movie' },
                  { label: 'TV Shows', value: 'tv' },
                ]}
                onValueChange={(values) =>
                  updateFilter({
                    mediaTypes: arrayToSet(values) as Set<'movie' | 'tv'>,
                  })
                }
                defaultValue={setToArray(filters.mediaTypes)}
                placeholder='All types'
                maxCount={2}
              />
            </div>
            <div className='space-y-2'>
              <Label>Sources</Label>
              <MultiSelect
                options={availableSources.map((source) => ({
                  label: source,
                  value: source,
                }))}
                onValueChange={(values) =>
                  updateFilter({ sources: arrayToSet(values) })
                }
                defaultValue={setToArray(filters.sources)}
                placeholder='All sources'
                maxCount={3}
              />
            </div>
          </div>
        </div>

        {/* Advanced Filters Accordion */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant='outline' className='w-full justify-between'>
              <div className='flex items-center space-x-2'>
                <Settings className='h-4 w-4' />
                <span>Advanced Filters</span>
              </div>
              {showAdvanced ? (
                <ChevronUp className='h-4 w-4' />
              ) : (
                <ChevronDown className='h-4 w-4' />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className='pt-4 space-y-6'>
            {/* Watch Status Filters */}
            <div className='space-y-4'>
              <h4 className='font-medium flex items-center space-x-2'>
                <Eye className='h-4 w-4' />
                <span>Watch Status</span>
              </h4>
              <div className='space-y-2'>
                <Label>Watch States</Label>
                <MultiSelect
                  options={[
                    { label: 'Watched', value: 'watched' },
                    { label: 'Unwatched', value: 'unwatched' },
                    { label: 'Partial', value: 'partial' },
                  ]}
                  onValueChange={(values) =>
                    updateFilter({
                      watchStates: arrayToSet(values) as Set<
                        'watched' | 'unwatched' | 'partial'
                      >,
                    })
                  }
                  defaultValue={setToArray(filters.watchStates)}
                  placeholder='All states'
                  maxCount={3}
                />
              </div>

              <RangeSlider
                label='Unwatched Days'
                min={0}
                max={1000}
                value={filters.unwatchedDaysRange}
                onValueChange={(value) =>
                  updateFilter({ unwatchedDaysRange: value })
                }
                formatValue={(v) => v.toString()}
                unit=' days'
              />
            </div>

            {/* Quality & Size Filters */}
            <div className='space-y-4'>
              <h4 className='font-medium flex items-center space-x-2'>
                <HardDrive className='h-4 w-4' />
                <span>Quality & Size</span>
              </h4>
              <div className='space-y-2'>
                <Label>Qualities</Label>
                <MultiSelect
                  options={availableQualities.map((quality) => ({
                    label: quality,
                    value: quality,
                  }))}
                  onValueChange={(values) =>
                    updateFilter({ qualities: arrayToSet(values) })
                  }
                  defaultValue={setToArray(filters.qualities)}
                  placeholder='All qualities'
                  maxCount={3}
                />
              </div>

              <RangeSlider
                label='Quality Score'
                min={0}
                max={100}
                value={filters.qualityScoreRange}
                onValueChange={(value) =>
                  updateFilter({ qualityScoreRange: value })
                }
                formatValue={(v) => v.toString()}
                unit=''
              />

              <RangeSlider
                label='Size (GB)'
                min={0}
                max={100}
                value={filters.sizeRange}
                onValueChange={(value) =>
                  updateFilter({ sizeRange: { ...value, unit: 'GB' } })
                }
                formatValue={(v) => v.toString()}
                unit=' GB'
              />
            </div>

            {/* Content Details */}
            <div className='space-y-4'>
              <h4 className='font-medium flex items-center space-x-2'>
                <Star className='h-4 w-4' />
                <span>Content Details</span>
              </h4>
              <div className='grid gap-4 md:grid-cols-2'>
                <RangeSlider
                  label='Year'
                  min={1900}
                  max={new Date().getFullYear()}
                  value={filters.yearRange}
                  onValueChange={(value) => updateFilter({ yearRange: value })}
                  formatValue={(v) => v.toString()}
                  unit=''
                />
                <RangeSlider
                  label='Runtime (minutes)'
                  min={0}
                  max={300}
                  value={filters.runtimeRange}
                  onValueChange={(value) =>
                    updateFilter({ runtimeRange: value })
                  }
                  formatValue={(v) => v.toString()}
                  unit=' min'
                />
              </div>

              <div className='space-y-2'>
                <Label>Genres</Label>
                <MultiSelect
                  options={availableGenres.map((genre) => ({
                    label: genre,
                    value: genre,
                  }))}
                  onValueChange={(values) =>
                    updateFilter({ genres: arrayToSet(values) })
                  }
                  defaultValue={setToArray(filters.genres)}
                  placeholder='All genres'
                  maxCount={3}
                />
              </div>
            </div>

            {/* TV Show Specific */}
            <div className='space-y-4'>
              <h4 className='font-medium flex items-center space-x-2'>
                <Tv className='h-4 w-4' />
                <span>TV Show Specific</span>
              </h4>
              <div className='grid gap-4 md:grid-cols-2'>
                <RangeSlider
                  label='Completion %'
                  min={0}
                  max={100}
                  value={filters.completionRange}
                  onValueChange={(value) =>
                    updateFilter({ completionRange: value })
                  }
                  formatValue={(v) => v.toString()}
                  unit='%'
                />
                <RangeSlider
                  label='Season Count'
                  min={1}
                  max={20}
                  value={filters.seasonCountRange}
                  onValueChange={(value) =>
                    updateFilter({ seasonCountRange: value })
                  }
                  formatValue={(v) => v.toString()}
                  unit=' seasons'
                />
              </div>

              <div className='flex items-center space-x-2'>
                <Switch
                  id='monitored'
                  checked={filters.monitored === true}
                  onCheckedChange={(checked) =>
                    updateFilter({ monitored: checked ? true : undefined })
                  }
                />
                <Label htmlFor='monitored'>Only Monitored Shows</Label>
              </div>
            </div>

            {/* Management Filters */}
            <div className='space-y-4'>
              <h4 className='font-medium flex items-center space-x-2'>
                <Settings className='h-4 w-4' />
                <span>Management</span>
              </h4>
              <div className='space-y-2'>
                <Label>Folders</Label>
                <MultiSelect
                  options={availableFolders.map((folder) => ({
                    label: folder,
                    value: folder,
                  }))}
                  onValueChange={(values) =>
                    updateFilter({ folders: arrayToSet(values) })
                  }
                  defaultValue={setToArray(filters.folders)}
                  placeholder='All folders'
                  maxCount={3}
                />
              </div>

              <RangeSlider
                label='Deletion Score'
                min={0}
                max={100}
                value={filters.deletionScoreRange}
                onValueChange={(value) =>
                  updateFilter({ deletionScoreRange: value })
                }
                formatValue={(v) => v.toString()}
                unit=''
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Filter Summary */}
        <div className='text-sm text-muted-foreground'>
          Showing filtered results from {totalItems} total items
        </div>
      </CardContent>
    </Card>
  );
}
