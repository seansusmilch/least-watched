import { useState } from 'react';
import {
  loadColumnVisibility,
  saveColumnVisibility,
  getDefaultColumnVisibility,
} from '@/lib/utils/columnConfig';

export const useColumnVisibility = () => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(loadColumnVisibility());
  const [tempColumnVisibility, setTempColumnVisibility] = useState<
    Record<string, boolean>
  >(getDefaultColumnVisibility());
  const [isColumnPopoverOpen, setIsColumnPopoverOpen] = useState(false);

  const handleTempColumnVisibilityChange = (
    columnId: string,
    visible: boolean
  ) => {
    setTempColumnVisibility((prev) => ({
      ...prev,
      [columnId]: visible,
    }));
  };

  const handleSaveColumnVisibility = () => {
    setColumnVisibility(tempColumnVisibility);
    saveColumnVisibility(tempColumnVisibility);
    setIsColumnPopoverOpen(false);
  };

  const handleOpenColumnPopover = () => {
    // Initialize temp state with current state when opening
    setTempColumnVisibility(columnVisibility);
    setIsColumnPopoverOpen(true);
  };

  const handleResetColumnVisibility = () => {
    setTempColumnVisibility(getDefaultColumnVisibility());
  };

  const hasUnsavedChanges = () => {
    return (
      JSON.stringify(columnVisibility) !== JSON.stringify(tempColumnVisibility)
    );
  };

  return {
    columnVisibility,
    tempColumnVisibility,
    isColumnPopoverOpen,
    setIsColumnPopoverOpen,
    handleTempColumnVisibilityChange,
    handleSaveColumnVisibility,
    handleOpenColumnPopover,
    handleResetColumnVisibility,
    hasUnsavedChanges,
  };
};
