import { getActiveMediaProcess } from '@/lib/actions/media-processing';
import { MediaProcessingProgressWrapper } from './MediaProcessingProgressWrapper';

export async function MediaProcessingProgressServer() {
  const activeProcess = await getActiveMediaProcess();

  if (!activeProcess) {
    return null;
  }

  return (
    <MediaProcessingProgressWrapper
      initialProgressId={activeProcess.progressId}
    />
  );
}
