import { describe, it, expect } from 'vitest';
import { applyCtrlShiftRangeSelection } from './selection-utils';
import type { RowSelectionState } from '@tanstack/react-table';

describe('applyCtrlShiftRangeSelection', () => {
  it('selects the range between the nearest checked rows', () => {
    const rowIds = ['a', 'b', 'c', 'd', 'e'];
    const selection: RowSelectionState = { a: true, e: true };

    const nextSelection = applyCtrlShiftRangeSelection(rowIds, selection, 'c');

    expect(nextSelection).toEqual({
      a: true,
      b: true,
      c: true,
      d: true,
      e: true,
    });
  });

  it('falls back to a single row when only one checked bound exists', () => {
    const rowIds = ['a', 'b', 'c', 'd'];
    const selection: RowSelectionState = { a: true };

    const nextSelection = applyCtrlShiftRangeSelection(rowIds, selection, 'c');

    expect(nextSelection).toEqual({
      a: true,
      c: true,
    });
  });

  it('falls back to a single row when no checked bounds exist', () => {
    const rowIds = ['a', 'b', 'c'];
    const selection: RowSelectionState = {};

    const nextSelection = applyCtrlShiftRangeSelection(rowIds, selection, 'b');

    expect(nextSelection).toEqual({
      b: true,
    });
  });
});

