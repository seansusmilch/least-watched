import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Filter,
  Search,
  Eye,
  Star,
  Settings,
  ChevronDown,
  ChevronUp,
  X,
  Zap,
  Tv,
  HardDrive,
} from 'lucide-react';
import { FilterOptions, QuickFilterOption } from '@/lib/types/media';

interface MediaFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: Partial<FilterOptions>) => void;
  availableGenres: string[];
  availableQualities: string[];
  availableSources: string[];
  availableFolders: string[];
  totalItems: number;
  filteredItems: number;
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

export const MediaFilters = ({
  filters,
  onFilterChange,
  availableGenres,
  availableQualities,
  availableSources,
  availableFolders,
  totalItems,
  filteredItems,
}: MediaFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const applyQuickFilter = (quickFilter: QuickFilterOption) => {
    onFilterChange(quickFilter.filters);
  };

  const clearAllFilters = () => {
    onFilterChange({
      searchTerm: '',
      searchType: 'contains',
      mediaTypes: new Set(),
      sources: new Set(),
      watchStates: new Set(),
      unwatchedDaysRange: {},
      lastWatchedRange: {},
      watchCountRange: {},
      sizeRange: { unit: 'GB' },
      qualities: new Set(),
      qualityScoreRange: {},
      sizePerHourRange: {},
      yearRange: {},
      genres: new Set(),
      ratingRange: {},
      runtimeRange: {},
      completionRange: {},
      seasonCountRange: {},
      episodeCountRange: {},
      monitored: undefined,
      dateAddedRange: {},
      folders: new Set(),
      deletionScoreRange: {},
      filterType: 'all',
      minSize: '',
      folderFilter: '',
      filterMode: 'basic',
      savedPresetId: undefined,
    });
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

  const MultiSelectFilter = ({
    label,
    options,
    selectedValues,
    onSelectionChange,
    placeholder = 'Select options...',
  }: {
    label: string;
    options: string[];
    selectedValues: Set<string>;
    onSelectionChange: (values: Set<string>) => void;
    placeholder?: string;
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (option: string) => {
      const newSelection = new Set(selectedValues);
      if (newSelection.has(option)) {
        newSelection.delete(option);
      } else {
        newSelection.add(option);
      }
      onSelectionChange(newSelection);
    };

    return (
      <div className='space-y-2'>
        <Label>{label}</Label>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant='outline' className='w-full justify-between'>
              <span className='truncate'>
                {selectedValues.size === 0
                  ? placeholder
                  : `${selectedValues.size} selected`}
              </span>
              <ChevronDown className='h-4 w-4' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-64 p-2'>
            <div className='space-y-2 max-h-48 overflow-y-auto'>
              {options.map((option) => (
                <div key={option} className='flex items-center space-x-2'>
                  <Checkbox
                    id={`${label}-${option}`}
                    checked={selectedValues.has(option)}
                    onCheckedChange={() => toggleOption(option)}
                  />
                  <Label htmlFor={`${label}-${option}`} className='text-sm'>
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        {selectedValues.size > 0 && (
          <div className='flex flex-wrap gap-1'>
            {Array.from(selectedValues).map((value) => (
              <Badge key={value} variant='secondary' className='text-xs'>
                {value}
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-3 w-3 p-0 ml-1'
                  onClick={() => toggleOption(value)}
                >
                  <X className='h-2 w-2' />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  };

  const RangeSlider = ({
    label,
    min,
    max,
    step = 1,
    value,
    onValueChange,
    formatValue = (v: number) => v.toString(),
    unit = '',
  }: {
    label: string;
    min: number;
    max: number;
    step?: number;
    value: { min?: number; max?: number };
    onValueChange: (value: { min?: number; max?: number }) => void;
    formatValue?: (value: number) => string;
    unit?: string;
  }) => {
    const currentMin = value.min ?? min;
    const currentMax = value.max ?? max;

    const handleSliderChange = (values: number[]) => {
      onValueChange({
        min: values[0] === min ? undefined : values[0],
        max: values[1] === max ? undefined : values[1],
      });
    };

    return (
      <div className='space-y-2'>
        <div className='flex justify-between items-center'>
          <Label>{label}</Label>
          <span className='text-sm text-muted-foreground'>
            {formatValue(currentMin)}
            {unit} - {formatValue(currentMax)}
            {unit}
          </span>
        </div>
        <Slider
          value={[currentMin, currentMax]}
          onValueChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          className='w-full'
        />
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center space-x-2'>
            <Filter className='h-5 w-5' />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant='secondary'>{activeFilterCount}</Badge>
            )}
          </CardTitle>
          <div className='flex items-center space-x-2'>
            <span className='text-sm text-muted-foreground'>
              {filteredItems} of {totalItems} items
            </span>
            {activeFilterCount > 0 && (
              <Button variant='outline' size='sm' onClick={clearAllFilters}>
                Clear All
              </Button>
            )}
          </div>
        </div>
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
                onClick={() => applyQuickFilter(quickFilter)}
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
                  onChange={(e) =>
                    onFilterChange({ searchTerm: e.target.value })
                  }
                  className='pl-8'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label>Search Type</Label>
              <Select
                value={filters.searchType}
                onValueChange={(value: 'contains' | 'exact' | 'regex') =>
                  onFilterChange({ searchType: value })
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
            <MultiSelectFilter
              label='Media Types'
              options={['movie', 'tv']}
              selectedValues={filters.mediaTypes}
              onSelectionChange={(values) =>
                onFilterChange({ mediaTypes: values as Set<'movie' | 'tv'> })
              }
              placeholder='All types'
            />
            <MultiSelectFilter
              label='Sources'
              options={availableSources}
              selectedValues={filters.sources}
              onSelectionChange={(values) =>
                onFilterChange({ sources: values })
              }
              placeholder='All sources'
            />
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
              <MultiSelectFilter
                label='Watch States'
                options={['watched', 'unwatched', 'partial']}
                selectedValues={filters.watchStates}
                onSelectionChange={(values) =>
                  onFilterChange({
                    watchStates: values as Set<
                      'watched' | 'unwatched' | 'partial'
                    >,
                  })
                }
                placeholder='All states'
              />

              <RangeSlider
                label='Days Unwatched'
                min={0}
                max={1095}
                value={filters.unwatchedDaysRange}
                onValueChange={(value) =>
                  onFilterChange({ unwatchedDaysRange: value })
                }
                formatValue={(v) => v.toString()}
                unit=' days'
              />

              <RangeSlider
                label='Watch Count'
                min={0}
                max={50}
                value={filters.watchCountRange}
                onValueChange={(value) =>
                  onFilterChange({ watchCountRange: value })
                }
                formatValue={(v) => v.toString()}
                unit=' times'
              />
            </div>

            {/* Quality & Size Filters */}
            <div className='space-y-4'>
              <h4 className='font-medium flex items-center space-x-2'>
                <HardDrive className='h-4 w-4' />
                <span>Quality & Size</span>
              </h4>
              <div className='grid gap-4 md:grid-cols-2'>
                <RangeSlider
                  label='File Size'
                  min={0}
                  max={100}
                  value={filters.sizeRange}
                  onValueChange={(value) =>
                    onFilterChange({
                      sizeRange: { ...value, unit: filters.sizeRange.unit },
                    })
                  }
                  formatValue={(v) => v.toFixed(1)}
                  unit={` ${filters.sizeRange.unit}`}
                />
                <div className='space-y-2'>
                  <Label>Size Unit</Label>
                  <Select
                    value={filters.sizeRange.unit}
                    onValueChange={(value: 'GB' | 'MB') =>
                      onFilterChange({
                        sizeRange: { ...filters.sizeRange, unit: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='GB'>GB</SelectItem>
                      <SelectItem value='MB'>MB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <MultiSelectFilter
                label='Quality'
                options={availableQualities}
                selectedValues={filters.qualities}
                onSelectionChange={(values) =>
                  onFilterChange({ qualities: values })
                }
                placeholder='All qualities'
              />

              <RangeSlider
                label='Quality Score'
                min={0}
                max={100}
                value={filters.qualityScoreRange}
                onValueChange={(value) =>
                  onFilterChange({ qualityScoreRange: value })
                }
                formatValue={(v) => v.toString()}
                unit=''
              />
            </div>

            {/* Content Filters */}
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
                  onValueChange={(value) =>
                    onFilterChange({ yearRange: value })
                  }
                  formatValue={(v) => v.toString()}
                  unit=''
                />
                <RangeSlider
                  label='Runtime (minutes)'
                  min={0}
                  max={300}
                  value={filters.runtimeRange}
                  onValueChange={(value) =>
                    onFilterChange({ runtimeRange: value })
                  }
                  formatValue={(v) => v.toString()}
                  unit=' min'
                />
              </div>

              <MultiSelectFilter
                label='Genres'
                options={availableGenres}
                selectedValues={filters.genres}
                onSelectionChange={(values) =>
                  onFilterChange({ genres: values })
                }
                placeholder='All genres'
              />

              <div className='grid gap-4 md:grid-cols-2'>
                <RangeSlider
                  label='IMDB Rating'
                  min={0}
                  max={10}
                  step={0.1}
                  value={filters.ratingRange.imdb || {}}
                  onValueChange={(value) =>
                    onFilterChange({
                      ratingRange: { ...filters.ratingRange, imdb: value },
                    })
                  }
                  formatValue={(v) => v.toFixed(1)}
                  unit=''
                />
                <RangeSlider
                  label='TMDB Rating'
                  min={0}
                  max={10}
                  step={0.1}
                  value={filters.ratingRange.tmdb || {}}
                  onValueChange={(value) =>
                    onFilterChange({
                      ratingRange: { ...filters.ratingRange, tmdb: value },
                    })
                  }
                  formatValue={(v) => v.toFixed(1)}
                  unit=''
                />
              </div>
            </div>

            {/* TV Show Specific Filters */}
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
                    onFilterChange({ completionRange: value })
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
                    onFilterChange({ seasonCountRange: value })
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
                    onFilterChange({ monitored: checked ? true : undefined })
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
              <MultiSelectFilter
                label='Folders'
                options={availableFolders}
                selectedValues={filters.folders}
                onSelectionChange={(values) =>
                  onFilterChange({ folders: values })
                }
                placeholder='All folders'
              />

              <RangeSlider
                label='Deletion Score'
                min={0}
                max={100}
                value={filters.deletionScoreRange}
                onValueChange={(value) =>
                  onFilterChange({ deletionScoreRange: value })
                }
                formatValue={(v) => v.toString()}
                unit=''
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
