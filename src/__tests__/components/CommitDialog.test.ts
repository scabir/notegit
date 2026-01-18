import React from 'react';
import { renderToString } from 'react-dom/server';
import { CommitDialog } from '../../frontend/components/CommitDialog';

describe('CommitDialog', () => {
  it('renders dialog container when open', () => {
    const html = renderToString(
      React.createElement(CommitDialog, {
        open: true,
        filePath: null,
        onClose: jest.fn(),
        onSuccess: jest.fn(),
      })
    );

    expect(html).toContain('MuiDialog-root');
  });
});
