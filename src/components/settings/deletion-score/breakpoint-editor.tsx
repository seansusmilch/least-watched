'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Breakpoint } from '@/lib/types/settings';
import { getActualPoints } from './types';

interface BreakpointEditorProps {
  breakpoints: Breakpoint[];
  onChange: (newBreakpoints: Breakpoint[]) => void;
  maxPoints: number;
  unit: string;
}

export function BreakpointEditor({
  breakpoints,
  onChange,
  maxPoints,
  unit,
}: BreakpointEditorProps) {
  const handleBreakpointChange = (
    index: number,
    field: keyof Breakpoint,
    value: number | string
  ) => {
    const newBreakpoints = [...breakpoints];
    newBreakpoints[index] = { ...newBreakpoints[index], [field]: value };
    onChange(newBreakpoints);
  };

  const handleBlur = () => {
    const newBreakpoints = [...breakpoints].sort((a, b) => a.value - b.value);

    const values = newBreakpoints.map((bp) => bp.value);
    const hasDuplicates = new Set(values).size !== values.length;
    if (hasDuplicates) {
      toast.error('Breakpoint values must be unique.');
      return;
    }

    const currentValues = breakpoints.map((bp) => bp.value);
    const newValues = newBreakpoints.map((bp) => bp.value);
    if (JSON.stringify(currentValues) !== JSON.stringify(newValues)) {
      onChange(newBreakpoints);
    }
  };

  const addBreakpoint = () => {
    const lastValue =
      breakpoints.length > 0 ? breakpoints[breakpoints.length - 1].value : 0;
    onChange([...breakpoints, { value: lastValue + 1, percent: 100 }]);
  };

  const removeBreakpoint = (index: number) => {
    const newBreakpoints = breakpoints.filter((_, i) => i !== index);
    onChange(newBreakpoints);
  };

  return (
    <div className='space-y-3'>
      {breakpoints.map((bp, index) => {
        return (
          <div
            key={index}
            className='flex items-center space-x-2 p-2 bg-muted/50 rounded-lg'
          >
            <div className='flex-1'>
              <div className='flex items-center space-x-2'>
                <Input
                  type='number'
                  value={bp.value}
                  onBlur={handleBlur}
                  onChange={(e) =>
                    handleBreakpointChange(
                      index,
                      'value',
                      parseInt(e.target.value, 10) || 0
                    )
                  }
                  className='w-24'
                />
                <span className='text-sm text-muted-foreground'>{unit}</span>
                <Slider
                  value={[bp.percent]}
                  onValueChange={([newValue]) =>
                    handleBreakpointChange(index, 'percent', newValue)
                  }
                  max={100}
                  step={1}
                  className='flex-1'
                />
                <div className='w-16 text-sm font-medium text-center'>
                  {getActualPoints(bp.percent, maxPoints)} pts
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => removeBreakpoint(index)}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
              <div className='text-xs text-muted-foreground mt-1 pl-1'>
                {(() => {
                  // All breakpoints apply to values greater than the breakpoint value
                  return `Applies to values > ${bp.value} ${unit}`;
                })()}
              </div>
            </div>
          </div>
        );
      })}
      <Button variant='outline' onClick={addBreakpoint}>
        <Plus className='h-4 w-4 mr-2' />
        Add Breakpoint
      </Button>
    </div>
  );
}
