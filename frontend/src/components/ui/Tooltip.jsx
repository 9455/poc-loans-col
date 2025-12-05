import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

export function Tooltip({ children, content }) {
  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root delayDuration={200}>
        <TooltipPrimitive.Trigger asChild>
          <span style={{ cursor: 'help', display: 'inline-flex', alignItems: 'center' }}>
            {children}
          </span>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            sideOffset={5}
            style={{
              backgroundColor: '#1c222e',
              color: '#d1d5db',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              border: '1px solid #374151',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
              zIndex: 10000,
              maxWidth: '250px',
              lineHeight: '1.4'
            }}
          >
            {content}
            <TooltipPrimitive.Arrow fill="#1c222e" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
