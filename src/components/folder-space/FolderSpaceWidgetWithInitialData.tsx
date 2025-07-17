import { folderSpaceService } from '@/lib/services/folder-space-service';
import { FolderSpaceWidget } from './FolderSpaceWidget';

export async function FolderSpaceWidgetWithInitialData() {
  const allFoldersWithSpace = await folderSpaceService.getAllFoldersWithSpace();

  return <FolderSpaceWidget initialData={allFoldersWithSpace} />;
}
