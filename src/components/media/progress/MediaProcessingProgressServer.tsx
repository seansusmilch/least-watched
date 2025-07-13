import { getActiveMediaProcess } from '@/lib/actions/media-processing';
import { MediaProcessingProgressClient } from './MediaProcessingProgressClient';

export async function MediaProcessingProgressServer() {
  const activeProcess = await getActiveMediaProcess();

  if (!activeProcess) {
    return null;
  }

  return (
    <MediaProcessingProgressClient
      initialProgressId={activeProcess.progressId}
      autoRefresh={true}
      refreshInterval={3000}
    />
  );
}
