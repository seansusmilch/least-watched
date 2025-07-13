import { getCachedAllFoldersWithSpace } from '@/lib/cache/data-cache';
import { FolderSpaceWidgetClient } from './FolderSpaceWidgetClient';

export async function FolderSpaceWidgetServer() {
  const allFoldersWithSpace = await getCachedAllFoldersWithSpace();

  return <FolderSpaceWidgetClient initialData={allFoldersWithSpace} />;
}
