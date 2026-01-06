export const TABLE_HEIGHTS = {
  fullscreen: 'h-[calc(100vh-12rem)]',
  default: 'h-[70vh]',
} as const;

export const FULLSCREEN_CARD_CLASSES = 'h-full flex flex-col';
export const FULLSCREEN_CONTENT_CLASSES = 'flex-1 min-h-0';
export const FULLSCREEN_CONTAINER_CLASSES = 'h-full flex flex-col';

export function getTableHeightClass(fullscreen: boolean): string {
  return fullscreen ? TABLE_HEIGHTS.fullscreen : TABLE_HEIGHTS.default;
}

export function getCardClasses(fullscreen: boolean): string {
  return fullscreen ? FULLSCREEN_CARD_CLASSES : '';
}

export function getCardContentClasses(fullscreen: boolean): string {
  return fullscreen ? FULLSCREEN_CONTENT_CLASSES : '';
}

export function getContainerClasses(fullscreen: boolean): string {
  return fullscreen ? FULLSCREEN_CONTAINER_CLASSES : 'space-y-6';
}
