import { useState } from "react";

interface UseEditProps {
  onSave?: (itemId: number, newName: string) => void;
}

export const useEdit = ({ onSave }: UseEditProps = {}) => {
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const startEditing = (itemId: number, currentName: string) => {
    setEditingItem(itemId);
    setEditValue(currentName);
  };

  const saveEdit = (itemId: number) => {
    if (editValue.trim()) {
      onSave?.(itemId, editValue.trim());
    }
    setEditingItem(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditValue("");
  };

  const updateEditValue = (value: string) => {
    setEditValue(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent, itemId: number) => {
    if (e.key === "Enter") {
      saveEdit(itemId);
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  const isEditing = (itemId: number) => editingItem === itemId;

  return {
    editingItem,
    editValue,
    startEditing,
    saveEdit,
    cancelEdit,
    updateEditValue,
    handleKeyDown,
    isEditing,
  };
};
