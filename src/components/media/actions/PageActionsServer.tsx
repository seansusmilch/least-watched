import { PageActionsEnhanced } from './PageActionsEnhanced';
import { getActiveMediaProcess } from '@/lib/actions/media-processing';

export async function PageActionsServer() {
  // Check if there's an active media processing job
  const activeProcess = await getActiveMediaProcess();
  const hasActiveProcess = activeProcess !== null;

  // Server component that renders the enhanced client component with server actions
  return <PageActionsEnhanced disabled={hasActiveProcess} />;
}
