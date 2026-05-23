import { useState } from 'react';
import { DisplayItem } from './useDocuments';

export function useMultipleSelection() {
    const [selection, setSelection] = useState<DisplayItem[]>([]);

    const isSelected = (item: DisplayItem) => {
        return selection.some(s => s.id === item.id);
    };

    const toggleSelection = (item: DisplayItem) => {
        if (isSelected(item)) {
            setSelection(prev => prev.filter(s => s.id !== item.id));
        } else {
            setSelection(prev => [...prev, item]);
        }
    };

    const toggleSelectAll = (items: DisplayItem[]) => {
        if (selection.length === items.length && items.length > 0) {
            setSelection([]);
        } else {
            setSelection([...items]);
        }
    };

    const clearSelection = () => setSelection([]);

    return {
        selection,
        isSelected,
        toggleSelection,
        toggleSelectAll,
        clearSelection
    };
}