import { useCallback, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

const MIN_WIDTH = 20;
const MAX_WIDTH = 80;

export function useSplitPane(initialWidth = 50) {
  const [editorWidth, setEditorWidth] = useState(initialWidth);
  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback((event: ReactMouseEvent) => {
    event.preventDefault();
    isDraggingRef.current = true;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const container = document.getElementById('editor-container');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newWidth = ((moveEvent.clientX - containerRect.left) / containerRect.width) * 100;

      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setEditorWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  return {
    editorWidth,
    handleMouseDown,
  };
}
