import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Maximize2, ArrowLeft } from 'lucide-react';

interface MediaTableNavigationButtonProps {
  fullscreen: boolean;
}

export function MediaTableNavigationButton({
  fullscreen,
}: MediaTableNavigationButtonProps) {
  if (fullscreen) {
    return (
      <Button variant='outline' size='sm' asChild>
        <Link href='/'>
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back to Dashboard
        </Link>
      </Button>
    );
  }

  return (
    <Button variant='outline' size='sm' asChild>
      <Link href='/media'>
        <Maximize2 className='h-4 w-4 mr-2' />
        Expand
      </Link>
    </Button>
  );
}
