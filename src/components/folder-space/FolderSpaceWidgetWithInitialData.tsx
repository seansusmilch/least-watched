import { getCachedAllFoldersWithSpace } from '@/lib/cache/data-cache';
import { FolderSpaceWidget } from './FolderSpaceWidget';

export async function FolderSpaceWidgetWithInitialData() {
  const allFoldersWithSpace = await getCachedAllFoldersWithSpace();

  return <FolderSpaceWidget initialData={allFoldersWithSpace} />;
}
