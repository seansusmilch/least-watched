import { cn } from '@/lib/utils';

export function getHeaderCellClasses(
  isTitle: boolean,
  canSort: boolean
): string {
  return cn(
    'flex items-center px-4 py-2 font-medium text-left',
    isTitle && 'flex-1 min-w-[200px]',
    canSort && 'cursor-pointer select-none hover:bg-muted/50'
  );
}

export function getCellClasses(isTitle: boolean): string {
  return cn('flex items-center px-4 py-2', isTitle && 'flex-1 min-w-[200px]');
}

export function getFixedColumnStyles(size: number) {
  return {
    width: `${size}px`,
    minWidth: `${size}px`,
    maxWidth: `${size}px`,
    flex: 'none' as const,
  };
}
