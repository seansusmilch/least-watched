'use client';

import React from 'react';
import { SCORING_FACTORS } from './types';
import { DeletionScoreSettings } from '@/lib/types/settings';

interface ScoreDistributionProps {
  settings: DeletionScoreSettings;
  validation: { isValid: boolean; message: string };
  calculateTotalMaxPoints: () => number;
}

export function ScoreDistribution({
  settings,
  validation,
  calculateTotalMaxPoints,
}: ScoreDistributionProps) {
  return (
    <div className='p-4 bg-muted/30 rounded-lg border'>
      <div className='flex items-center justify-between mb-3'>
        <h4 className='font-semibold'>Score Distribution</h4>
        <div
          className={`text-sm font-medium ${
            validation.isValid ? 'text-green-600' : 'text-destructive'
          }`}
        >
          {calculateTotalMaxPoints()}/100 pts
        </div>
      </div>

      <div className='space-y-2'>
        {SCORING_FACTORS.map((factor) => {
          const isEnabled = settings[factor.enabledKey] as boolean;
          const maxPoints = settings[factor.maxPointsKey] as number;

          if (!isEnabled) return null;

          return (
            <div key={factor.key} className='flex items-center space-x-3'>
              <div className='w-24 text-sm text-muted-foreground'>
                {factor.title}
              </div>
              <div className='flex-1 bg-muted rounded-full h-2'>
                <div
                  className={`${factor.color} h-2 rounded-full transition-all duration-200`}
                  style={{ width: `${(maxPoints / 100) * 100}%` }}
                />
              </div>
              <div className='w-12 text-sm font-medium text-center'>
                {maxPoints} pts
              </div>
            </div>
          );
        })}
      </div>

      {!validation.isValid && (
        <div className='mt-3 text-destructive font-medium whitespace-pre-line text-sm'>
          {validation.message}
        </div>
      )}
      {validation.isValid && (
        <div className='mt-3 text-green-600 font-medium text-sm'>
          ✓ Settings are valid and ready to save
        </div>
      )}
    </div>
  );
}
