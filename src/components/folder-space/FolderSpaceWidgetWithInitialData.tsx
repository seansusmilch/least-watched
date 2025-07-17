import { getAllFoldersWithSpace } from '@/lib/actions/folder-space';
import { FolderSpaceWidget } from './FolderSpaceWidget';

export async function FolderSpaceWidgetWithInitialData() {
  const allFoldersWithSpace = await getAllFoldersWithSpace();

  return <FolderSpaceWidget initialData={allFoldersWithSpace} />;
}
