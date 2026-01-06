'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Breakpoint,
  DeletionScoreSettings,
  ScoringFactor,
} from '@/lib/types/settings';
import { BreakpointEditor } from './breakpoint-editor';

interface ScoringFactorSectionProps {
  factor: ScoringFactor;
  settings: DeletionScoreSettings;
  setSettings: (settings: DeletionScoreSettings) => void;
}

export function ScoringFactorSection({
  factor,
  settings,
  setSettings,
}: ScoringFactorSectionProps) {
  const isEnabled = settings[factor.enabledKey] as boolean;
  const maxPoints = settings[factor.maxPointsKey] as number;

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold'>{factor.title}</h3>
          <p className='text-sm text-muted-foreground'>{factor.description}</p>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={(checked) =>
            setSettings({ ...settings, [factor.enabledKey]: checked })
          }
        />
      </div>

      {isEnabled && (
        <div className='space-y-4 pl-4'>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label className='text-base font-medium'>Weight</Label>
              <div className='text-sm text-muted-foreground'>
                {maxPoints} pts ({((maxPoints / 100) * 100).toFixed(0)}% of
                total score)
              </div>
            </div>
            <Slider
              value={[maxPoints]}
              onValueChange={([value]) =>
                setSettings({ ...settings, [factor.maxPointsKey]: value })
              }
              max={100}
              step={1}
              className='w-full'
            />
          </div>

          {factor.breakdownsKey && (
            <Accordion
              type='single'
              collapsible
              className='w-full'
              data-testid={`${factor.key}-breakdown-accordion`}
            >
              <AccordionItem value='breakdown' className='border-none'>
                <AccordionTrigger
                  className='py-2 hover:no-underline text-sm font-medium text-muted-foreground justify-end'
                  data-testid={`${factor.key}-breakdown-trigger`}
                >
                  Fine-grained scoring breakdown
                </AccordionTrigger>
                <AccordionContent
                  className='space-y-3 pt-2'
                  data-testid={`${factor.key}-breakdown-content`}
                >
                  <div className='text-xs text-muted-foreground mb-2 space-y-1'>
                    <p>
                      Each breakpoint defines a score tier. An item&apos;s value
                      (e.g., days unwatched) is checked against the breakpoints
                      in descending order.
                    </p>
                    <p>
                      The <strong>first</strong> breakpoint where the
                      item&apos;s value is <strong>greater than</strong> the
                      breakpoint value determines the score. Values that
                      don&apos;t exceed any breakpoint get 0 points.
                    </p>
                    <p className='text-xs text-blue-600 font-medium'>
                      💡 Tip: Values that don&apos;t exceed any breakpoint will
                      get 0 points for this factor.
                    </p>
                  </div>
                  <BreakpointEditor
                    breakpoints={
                      (settings[factor.breakdownsKey] as
                        | Breakpoint[]
                        | undefined) || []
                    }
                    onChange={(newBreakpoints) =>
                      setSettings({
                        ...settings,
                        [factor.breakdownsKey as string]: newBreakpoints,
                      })
                    }
                    maxPoints={maxPoints}
                    unit={factor.breakdownUnit || ''}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      )}
    </div>
  );
}
