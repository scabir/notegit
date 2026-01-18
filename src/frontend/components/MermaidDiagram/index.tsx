import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';

interface MermaidDiagramProps {
  code: string;
  isDark: boolean;
}

export function MermaidDiagram({ code, isDark }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const diagramIdRef = useRef(`mermaid-${Math.random().toString(36).slice(2, 9)}`);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const renderDiagram = async () => {
      try {
        const { default: mermaid } = await import('mermaid');
        mermaid.initialize({ startOnLoad: false, theme: isDark ? 'dark' : 'default' });

        const { svg, bindFunctions } = await mermaid.render(diagramIdRef.current, code);
        if (!active || !containerRef.current) return;

        containerRef.current.innerHTML = svg;
        bindFunctions?.(containerRef.current);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to render mermaid diagram');
      }
    };

    if (code.trim()) {
      void renderDiagram();
    }

    return () => {
      active = false;
    };
  }, [code, isDark]);

  if (error) {
    return (
      <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
          Mermaid render error: {error}
        </Typography>
        <pre style={{ margin: 0 }}>{code}</pre>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        '& svg': {
          maxWidth: '100%',
          height: 'auto',
        },
      }}
    />
  );
}
