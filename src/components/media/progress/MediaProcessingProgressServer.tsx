import { getActiveMediaProcess } from '@/lib/actions/media-processing';
import { MediaProcessingProgressEnhanced } from './MediaProcessingProgressEnhanced';

export async function MediaProcessingProgressServer() {
  const activeProcess = await getActiveMediaProcess();

  if (!activeProcess) {
    return null;
  }

  return (
    <MediaProcessingProgressEnhanced
      initialProgressId={activeProcess.progressId}
      autoRefresh={true}
      refreshInterval={2000}
    />
  );
}
