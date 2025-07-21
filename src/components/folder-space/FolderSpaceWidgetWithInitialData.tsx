import { folderSpaceService } from '@/lib/services/folder-space-service';
import { FolderSpaceWidget } from './FolderSpaceWidget';

export async function FolderSpaceWidgetWithInitialData() {
  try {
    const allFoldersWithSpace =
      await folderSpaceService.getAllFoldersWithSpace();
    return <FolderSpaceWidget initialData={allFoldersWithSpace} />;
  } catch (error) {
    console.warn(
      '⚠️ Failed to load folder space data, showing empty state:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    // Return widget with empty data array as fallback
    return <FolderSpaceWidget initialData={[]} />;
  }
}
