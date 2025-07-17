'use client';

import { Badge } from '@/components/ui/badge';
import { AlertTriangle, BarChart3, Users } from 'lucide-react';
import { formatFileSize } from '@/lib/utils/formatters';

// Define the enhanced data structure that this component expects
interface EnhancedFolderData {
  movieCount?: number;
  averageMovieSize?: number;
  qualityBreakdown?: Record<string, number>;
  isLowSpace?: boolean;
}

interface EnhancedFolderDetailsProps {
  enhancedData: EnhancedFolderData;
}

export function EnhancedFolderDetails({
  enhancedData,
}: EnhancedFolderDetailsProps) {
  return (
    <div className='space-y-2 pt-2 border-t'>
      {enhancedData.movieCount !== undefined && (
        <div className='flex items-center justify-between text-xs'>
          <div className='flex items-center space-x-1'>
            <Users className='h-3 w-3' />
            <span>Movies</span>
          </div>
          <span className='font-medium'>{enhancedData.movieCount}</span>
        </div>
      )}

      {enhancedData.averageMovieSize !== undefined && (
        <div className='flex items-center justify-between text-xs'>
          <div className='flex items-center space-x-1'>
            <BarChart3 className='h-3 w-3' />
            <span>Avg Size</span>
          </div>
          <span className='font-medium'>
            {formatFileSize(enhancedData.averageMovieSize)}
          </span>
        </div>
      )}

      {enhancedData.qualityBreakdown && (
        <div className='space-y-1'>
          <div className='text-xs font-medium'>Quality Breakdown</div>
          <div className='flex flex-wrap gap-1'>
            {Object.entries(enhancedData.qualityBreakdown)
              .slice(0, 3) // Show max 3 qualities to avoid overcrowding
              .map(([quality, count]) => (
                <Badge key={quality} variant='outline' className='text-xs'>
                  {quality}: {count}
                </Badge>
              ))}
          </div>
        </div>
      )}

      {enhancedData.isLowSpace && (
        <div className='flex items-center space-x-1 text-xs text-orange-600'>
          <AlertTriangle className='h-3 w-3' />
          <span>Low Space Alert</span>
        </div>
      )}
    </div>
  );
}
