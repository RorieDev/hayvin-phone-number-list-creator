import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useResizableColumns - Hook for managing resizable table columns
 * 
 * Features:
 * - Drag to resize columns
 * - Persists widths to localStorage
 * - Minimum column width enforcement
 * 
 * @param {string} storageKey - Unique key for localStorage
 * @param {object} defaultWidths - Default column widths { columnId: width }
 * @param {number} minWidth - Minimum column width in pixels (default: 80)
 */
export function useResizableColumns(storageKey, defaultWidths, minWidth = 80) {
    // Load saved widths from localStorage or use defaults
    const [columnWidths, setColumnWidths] = useState(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                return { ...defaultWidths, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Failed to load column widths:', e);
        }
        return defaultWidths;
    });

    // Track active resize operation
    const resizeState = useRef({
        isResizing: false,
        columnId: null,
        startX: 0,
        startWidth: 0
    });

    // Save widths to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(columnWidths));
        } catch (e) {
            console.warn('Failed to save column widths:', e);
        }
    }, [storageKey, columnWidths]);

    // Handle mouse down on resize handle
    const handleResizeStart = useCallback((columnId, e) => {
        e.preventDefault();
        e.stopPropagation();

        resizeState.current = {
            isResizing: true,
            columnId,
            startX: e.clientX,
            startWidth: columnWidths[columnId] || defaultWidths[columnId] || 150
        };

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [columnWidths, defaultWidths]);

    // Handle mouse move during resize
    const handleResizeMove = useCallback((e) => {
        if (!resizeState.current.isResizing) return;

        const { columnId, startX, startWidth } = resizeState.current;
        const deltaX = e.clientX - startX;
        const newWidth = Math.max(minWidth, startWidth + deltaX);

        setColumnWidths(prev => ({
            ...prev,
            [columnId]: newWidth
        }));
    }, [minWidth]);

    // Handle mouse up to end resize
    const handleResizeEnd = useCallback(() => {
        if (!resizeState.current.isResizing) return;

        resizeState.current.isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    // Attach/detach global listeners
    useEffect(() => {
        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);

        return () => {
            document.removeEventListener('mousemove', handleResizeMove);
            document.removeEventListener('mouseup', handleResizeEnd);
        };
    }, [handleResizeMove, handleResizeEnd]);

    // Reset to default widths
    const resetWidths = useCallback(() => {
        setColumnWidths(defaultWidths);
        try {
            localStorage.removeItem(storageKey);
        } catch (e) {
            console.warn('Failed to reset column widths:', e);
        }
    }, [storageKey, defaultWidths]);

    return {
        columnWidths,
        handleResizeStart,
        resetWidths,
        isResizing: () => resizeState.current.isResizing
    };
}

/**
 * ResizableHeader - Component for a resizable table header cell
 */
export function ResizableHeader({
    columnId,
    width,
    onResizeStart,
    children,
    className = '',
    style = {}
}) {
    return (
        <th
            className={`resizable-header ${className}`}
            style={{
                width: width,
                minWidth: width,
                maxWidth: width,
                position: 'relative',
                ...style
            }}
        >
            {children}
            <div
                className="resize-handle"
                onMouseDown={(e) => onResizeStart(columnId, e)}
                onClick={(e) => e.stopPropagation()}
            />
        </th>
    );
}
