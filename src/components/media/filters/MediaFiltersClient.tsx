'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { MultiSelect } from '@/components/ui/multi-select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Filter,
  Search,
  Eye,
  Star,
  Settings,
  Zap,
  Tv,
  HardDrive,
  X,
  RotateCcw,
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
    <div className='space-y-3 pt-2'>
      <div className='flex justify-between items-center'>
        <Label className='text-xs font-medium'>{label}</Label>
        <span className='text-xs text-muted-foreground'>
          {localValue[0] === min && localValue[1] === max
            ? 'Any'
            : `${formatValue(localValue[0])}${unit} - ${formatValue(
                localValue[1]
              )}${unit}`}
        </span>
      </div>
      <Slider
        value={localValue}
        onValueChange={handleSliderChange}
        min={min}
        max={max}
        step={1}
        className='w-full'
      />
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

  const activeFiltersList = useMemo(() => {
    const list: { id: string; label: string; onRemove: () => void }[] = [];

    // Search Term
    if (filters.searchTerm) {
      list.push({
        id: 'searchTerm',
        label: `Search: "${filters.searchTerm}"`,
        onRemove: () => updateFilter({ searchTerm: '' }),
      });
    }

    // Media Types
    if (filters.mediaTypes.size > 0) {
      filters.mediaTypes.forEach((type) => {
        list.push({
          id: `mediaType-${type}`,
          label: type === 'movie' ? 'Movie' : 'TV Show',
          onRemove: () => {
            const newSet = new Set(filters.mediaTypes);
            newSet.delete(type);
            updateFilter({ mediaTypes: newSet });
          },
        });
      });
    }

    // Sources
    filters.sources.forEach((source) => {
      list.push({
        id: `source-${source}`,
        label: `Source: ${source}`,
        onRemove: () => {
          const newSet = new Set(filters.sources);
          newSet.delete(source);
          updateFilter({ sources: newSet });
        },
      });
    });

    // Folders
    filters.folders.forEach((folder) => {
      list.push({
        id: `folder-${folder}`,
        label: `Folder: ${folder}`,
        onRemove: () => {
          const newSet = new Set(filters.folders);
          newSet.delete(folder);
          updateFilter({ folders: newSet });
        },
      });
    });

    // Watch States
    filters.watchStates.forEach((state) => {
      const labelMap = {
        watched: 'Watched',
        unwatched: 'Unwatched',
        partial: 'Partial',
      };
      list.push({
        id: `watchState-${state}`,
        label: labelMap[state] || state,
        onRemove: () => {
          const newSet = new Set(filters.watchStates);
          newSet.delete(state);
          updateFilter({ watchStates: newSet });
        },
      });
    });

    // Unwatched Days
    if (
      filters.unwatchedDaysRange.min !== undefined ||
      filters.unwatchedDaysRange.max !== undefined
    ) {
      const min = filters.unwatchedDaysRange.min ?? 0;
      const max = filters.unwatchedDaysRange.max
        ? `${filters.unwatchedDaysRange.max}`
        : '∞';
      list.push({
        id: 'unwatchedDays',
        label: `Unwatched: ${min}-${max} days`,
        onRemove: () =>
          updateFilter({
            unwatchedDaysRange: { min: undefined, max: undefined },
          }),
      });
    }

    // Size Range
    if (
      filters.sizeRange.min !== undefined ||
      filters.sizeRange.max !== undefined
    ) {
      const min = filters.sizeRange.min ?? 0;
      const max = filters.sizeRange.max ? `${filters.sizeRange.max}` : '∞';
      list.push({
        id: 'sizeRange',
        label: `Size: ${min}-${max} GB`,
        onRemove: () =>
          updateFilter({
            sizeRange: { min: undefined, max: undefined, unit: 'GB' },
          }),
      });
    }

    // Qualities
    filters.qualities.forEach((quality) => {
      list.push({
        id: `quality-${quality}`,
        label: `Quality: ${quality}`,
        onRemove: () => {
          const newSet = new Set(filters.qualities);
          newSet.delete(quality);
          updateFilter({ qualities: newSet });
        },
      });
    });

    // Quality Score Range
    if (
      filters.qualityScoreRange.min !== undefined ||
      filters.qualityScoreRange.max !== undefined
    ) {
      const min = filters.qualityScoreRange.min ?? 0;
      const max = filters.qualityScoreRange.max
        ? `${filters.qualityScoreRange.max}`
        : '100';
      list.push({
        id: 'qualityScore',
        label: `Score: ${min}-${max}`,
        onRemove: () =>
          updateFilter({
            qualityScoreRange: { min: undefined, max: undefined },
          }),
      });
    }

    // Genres
    filters.genres.forEach((genre) => {
      list.push({
        id: `genre-${genre}`,
        label: `Genre: ${genre}`,
        onRemove: () => {
          const newSet = new Set(filters.genres);
          newSet.delete(genre);
          updateFilter({ genres: newSet });
        },
      });
    });

    // Year Range
    if (
      filters.yearRange.min !== undefined ||
      filters.yearRange.max !== undefined
    ) {
      const min = filters.yearRange.min ?? 1900;
      const max = filters.yearRange.max ? `${filters.yearRange.max}` : 'Now';
      list.push({
        id: 'yearRange',
        label: `Year: ${min}-${max}`,
        onRemove: () =>
          updateFilter({ yearRange: { min: undefined, max: undefined } }),
      });
    }

    // Runtime Range
    if (
      filters.runtimeRange.min !== undefined ||
      filters.runtimeRange.max !== undefined
    ) {
      const min = filters.runtimeRange.min ?? 0;
      const max = filters.runtimeRange.max
        ? `${filters.runtimeRange.max}`
        : '∞';
      list.push({
        id: 'runtimeRange',
        label: `Runtime: ${min}-${max} min`,
        onRemove: () =>
          updateFilter({ runtimeRange: { min: undefined, max: undefined } }),
      });
    }

    // TV Specific
    if (filters.monitored !== undefined) {
      list.push({
        id: 'monitored',
        label: filters.monitored ? 'Monitored Only' : 'Unmonitored Only',
        onRemove: () => updateFilter({ monitored: undefined }),
      });
    }

    if (
      filters.completionRange.min !== undefined ||
      filters.completionRange.max !== undefined
    ) {
      const min = filters.completionRange.min ?? 0;
      const max = filters.completionRange.max
        ? `${filters.completionRange.max}`
        : '100';
      list.push({
        id: 'completionRange',
        label: `Completion: ${min}-${max}%`,
        onRemove: () =>
          updateFilter({
            completionRange: { min: undefined, max: undefined },
          }),
      });
    }

    if (
      filters.seasonCountRange.min !== undefined ||
      filters.seasonCountRange.max !== undefined
    ) {
      const min = filters.seasonCountRange.min ?? 1;
      const max = filters.seasonCountRange.max
        ? `${filters.seasonCountRange.max}`
        : '20+';
      list.push({
        id: 'seasonCountRange',
        label: `Seasons: ${min}-${max}`,
        onRemove: () =>
          updateFilter({
            seasonCountRange: { min: undefined, max: undefined },
          }),
      });
    }

    // Deletion Score
    if (
      filters.deletionScoreRange.min !== undefined ||
      filters.deletionScoreRange.max !== undefined
    ) {
      const min = filters.deletionScoreRange.min ?? 0;
      const max = filters.deletionScoreRange.max
        ? `${filters.deletionScoreRange.max}`
        : '100';
      list.push({
        id: 'deletionScoreRange',
        label: `Del. Score: ${min}-${max}`,
        onRemove: () =>
          updateFilter({
            deletionScoreRange: { min: undefined, max: undefined },
          }),
      });
    }

    return list;
  }, [filters, updateFilter]);

  // Helper function to convert Set to array for MultiSelect
  const setToArray = (set: Set<string>): string[] => Array.from(set);
  const arrayToSet = (array: string[]): Set<string> => new Set(array);

  return (
    <div className='flex flex-col h-full'>
      <SheetHeader className='px-4 py-4 border-b flex flex-row items-center justify-between space-y-0'>
        <div className='flex flex-col gap-1'>
          <SheetTitle className='flex items-center gap-2'>
            <Filter className='h-4 w-4' />
            Filters
          </SheetTitle>
          <SheetDescription>
            {activeFilterCount > 0
              ? `${activeFilterCount} active filters`
              : 'Refine your media list'}
          </SheetDescription>
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant='ghost'
            size='sm'
            onClick={clearAllFilters}
            className='h-8 px-2 text-muted-foreground hover:text-foreground'
          >
            <RotateCcw className='h-3 w-3 mr-1' />
            Reset
          </Button>
        )}
      </SheetHeader>

      <ScrollArea className='flex-1'>
        <div className='p-4 space-y-6'>
          {/* Active Filters Display */}
          {activeFiltersList.length > 0 && (
            <div className='space-y-3'>
              <h4 className='text-sm font-medium text-muted-foreground'>
                Active Filters
              </h4>
              <div className='flex flex-wrap gap-2'>
                {activeFiltersList.map((filter) => (
                  <Badge
                    key={filter.id}
                    variant='secondary'
                    className='cursor-pointer hover:bg-secondary/80 pr-1'
                    onClick={filter.onRemove}
                  >
                    {filter.label}
                    <X className='h-3 w-3 ml-1' />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Quick Filters */}
          <div className='space-y-3'>
            <h4 className='text-sm font-medium flex items-center gap-2 text-muted-foreground'>
              <Zap className='h-3 w-3' />
              Quick Filters
            </h4>
            <div className='flex flex-wrap gap-2'>
              {quickFilters.map((quickFilter) => (
                <Button
                  key={quickFilter.id}
                  variant='outline'
                  size='sm'
                  onClick={() => applyQuickFilterHandler(quickFilter)}
                  className='text-xs rounded-full'
                >
                  {quickFilter.label}
                </Button>
              ))}
            </div>
          </div>

          <Accordion
            type='multiple'
            defaultValue={['common']}
            className='w-full'
          >
            {/* Common Filters */}
            <AccordionItem value='common' className='border-none'>
              <AccordionTrigger className='py-2 hover:no-underline'>
                <span className='flex items-center gap-2 font-semibold'>
                  Common Filters
                </span>
              </AccordionTrigger>
              <AccordionContent className='space-y-4 pt-2'>
                <div className='space-y-2'>
                  <Label>Search Title</Label>
                  <div className='flex gap-2'>
                    <div className='relative flex-1'>
                      <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                      <Input
                        placeholder='Search titles...'
                        value={filters.searchTerm}
                        onChange={(e) =>
                          updateFilter({ searchTerm: e.target.value })
                        }
                        className='pl-8'
                      />
                    </div>
                    <Select
                      value={filters.searchType}
                      onValueChange={(value: 'contains' | 'exact' | 'regex') =>
                        updateFilter({ searchType: value })
                      }
                    >
                      <SelectTrigger className='w-[100px]'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='contains'>Contains</SelectItem>
                        <SelectItem value='exact'>Exact</SelectItem>
                        <SelectItem value='regex'>Regex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label>Media Types</Label>
                  <MultiSelect
                    key={JSON.stringify(setToArray(filters.mediaTypes))}
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
                    key={JSON.stringify(setToArray(filters.sources))}
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

                <div className='space-y-2'>
                  <Label>Root Folders</Label>
                  <MultiSelect
                    key={JSON.stringify(setToArray(filters.folders))}
                    options={availableFolders.map((folder) => ({
                      label: folder,
                      value: folder,
                    }))}
                    onValueChange={(values) =>
                      updateFilter({ folders: arrayToSet(values) })
                    }
                    defaultValue={setToArray(filters.folders)}
                    placeholder='All folders'
                    maxCount={2}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Watch Status */}
            <AccordionItem value='watch-status' className='border-t'>
              <AccordionTrigger className='py-3 hover:no-underline'>
                <span className='flex items-center gap-2'>
                  <Eye className='h-4 w-4 text-muted-foreground' />
                  Watch Status
                </span>
              </AccordionTrigger>
              <AccordionContent className='space-y-4 pt-2'>
                <div className='space-y-2'>
                  <Label>State</Label>
                  <MultiSelect
                    key={JSON.stringify(setToArray(filters.watchStates))}
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
                  unit='d'
                />
              </AccordionContent>
            </AccordionItem>

            {/* Quality & Size */}
            <AccordionItem value='quality' className='border-t'>
              <AccordionTrigger className='py-3 hover:no-underline'>
                <span className='flex items-center gap-2'>
                  <HardDrive className='h-4 w-4 text-muted-foreground' />
                  Quality & Size
                </span>
              </AccordionTrigger>
              <AccordionContent className='space-y-4 pt-2'>
                <div className='space-y-2'>
                  <Label>Qualities</Label>
                  <MultiSelect
                    key={JSON.stringify(setToArray(filters.qualities))}
                    options={availableQualities.map((quality) => ({
                      label: quality,
                      value: quality,
                    }))}
                    onValueChange={(values) =>
                      updateFilter({ qualities: arrayToSet(values) })
                    }
                    defaultValue={setToArray(filters.qualities)}
                    placeholder='All qualities'
                    maxCount={2}
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
                  label='Size'
                  min={0}
                  max={100}
                  value={filters.sizeRange}
                  onValueChange={(value) =>
                    updateFilter({ sizeRange: { ...value, unit: 'GB' } })
                  }
                  formatValue={(v) => v.toString()}
                  unit=' GB'
                />
              </AccordionContent>
            </AccordionItem>

            {/* Content Details */}
            <AccordionItem value='content' className='border-t'>
              <AccordionTrigger className='py-3 hover:no-underline'>
                <span className='flex items-center gap-2'>
                  <Star className='h-4 w-4 text-muted-foreground' />
                  Content Details
                </span>
              </AccordionTrigger>
              <AccordionContent className='space-y-4 pt-2'>
                <div className='space-y-2'>
                  <Label>Genres</Label>
                  <MultiSelect
                    key={JSON.stringify(setToArray(filters.genres))}
                    options={availableGenres.map((genre) => ({
                      label: genre,
                      value: genre,
                    }))}
                    onValueChange={(values) =>
                      updateFilter({ genres: arrayToSet(values) })
                    }
                    defaultValue={setToArray(filters.genres)}
                    placeholder='All genres'
                    maxCount={2}
                  />
                </div>
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
                  label='Runtime'
                  min={0}
                  max={300}
                  value={filters.runtimeRange}
                  onValueChange={(value) =>
                    updateFilter({ runtimeRange: value })
                  }
                  formatValue={(v) => v.toString()}
                  unit=' min'
                />
              </AccordionContent>
            </AccordionItem>

            {/* TV Specific */}
            <AccordionItem value='tv' className='border-t'>
              <AccordionTrigger className='py-3 hover:no-underline'>
                <span className='flex items-center gap-2'>
                  <Tv className='h-4 w-4 text-muted-foreground' />
                  TV Specific
                </span>
              </AccordionTrigger>
              <AccordionContent className='space-y-4 pt-2'>
                <div className='flex items-center justify-between py-2'>
                  <Label htmlFor='monitored' className='cursor-pointer'>
                    Only Monitored
                  </Label>
                  <Switch
                    id='monitored'
                    checked={filters.monitored === true}
                    onCheckedChange={(checked) =>
                      updateFilter({ monitored: checked ? true : undefined })
                    }
                  />
                </div>
                <RangeSlider
                  label='Completion'
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
                  label='Seasons'
                  min={1}
                  max={20}
                  value={filters.seasonCountRange}
                  onValueChange={(value) =>
                    updateFilter({ seasonCountRange: value })
                  }
                  formatValue={(v) => v.toString()}
                  unit=''
                />
              </AccordionContent>
            </AccordionItem>

            {/* Management */}
            <AccordionItem value='management' className='border-t'>
              <AccordionTrigger className='py-3 hover:no-underline'>
                <span className='flex items-center gap-2'>
                  <Settings className='h-4 w-4 text-muted-foreground' />
                  Management
                </span>
              </AccordionTrigger>
              <AccordionContent className='pt-2'>
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
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>

      <SheetFooter className='p-4 border-t bg-muted/20'>
        <div className='text-xs text-muted-foreground w-full text-center'>
          Showing {totalItems} items matching filters
        </div>
      </SheetFooter>
    </div>
  );
}
