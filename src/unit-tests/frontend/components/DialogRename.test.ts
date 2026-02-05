import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { TextField } from '@mui/material';
import { DialogRename } from '../../../frontend/components/FileTreeView/DialogRename';

describe('DialogRename', () => {
  it('submits when Enter is pressed', () => {
    const onSubmit = jest.fn();
    const onChange = jest.fn();

    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(DialogRename, {
          open: true,
          title: 'Rename',
          label: 'Name',
          value: 'old.md',
          onChange,
          onClose: jest.fn(),
          onSubmit,
          errorMessage: undefined,
          creating: false,
          placeholder: 'New name',
          testId: 'rename-item',
        })
      );
    });

    const field = renderer!.root.findByType(TextField);

    act(() => {
      field.props.onKeyPress({ key: 'Enter' });
    });

    expect(onSubmit).toHaveBeenCalled();
  });
});
