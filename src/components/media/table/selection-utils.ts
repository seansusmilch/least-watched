import type { RowSelectionState } from '@tanstack/react-table';

function getSelectedRowIds(rowSelection: RowSelectionState): string[] {
  return Object.entries(rowSelection)
    .filter(([, isSelected]) => isSelected)
    .map(([rowId]) => rowId);
}

export function applyCtrlShiftRangeSelection(
  rowIds: string[],
  rowSelection: RowSelectionState,
  clickedRowId: string
): RowSelectionState {
  const clickedIndex = rowIds.indexOf(clickedRowId);

  if (clickedIndex === -1) {
    return rowSelection;
  }

  const selectedIds = new Set(getSelectedRowIds(rowSelection));

  let previousCheckedIndex = -1;
  for (let index = clickedIndex - 1; index >= 0; index -= 1) {
    if (selectedIds.has(rowIds[index])) {
      previousCheckedIndex = index;
      break;
    }
  }

  let nextCheckedIndex = -1;
  for (let index = clickedIndex + 1; index < rowIds.length; index += 1) {
    if (selectedIds.has(rowIds[index])) {
      nextCheckedIndex = index;
      break;
    }
  }

  const idsToSelect =
    previousCheckedIndex !== -1 && nextCheckedIndex !== -1
      ? rowIds.slice(previousCheckedIndex, nextCheckedIndex + 1)
      : [clickedRowId];

  return idsToSelect.reduce<RowSelectionState>((selection, rowId) => {
    selection[rowId] = true;
    return selection;
  }, { ...rowSelection });
}

