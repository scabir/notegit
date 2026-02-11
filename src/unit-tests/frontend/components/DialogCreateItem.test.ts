import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { TextField } from '@mui/material';
import { DialogCreateItem } from '../../../frontend/components/FileTreeDialogCreateItem';

describe('DialogCreateItem', () => {
  it('submits when Enter is pressed', () => {
    const onCreate = jest.fn();
    const onChange = jest.fn();

    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(DialogCreateItem, {
          open: true,
          title: 'Create',
          label: 'Name',
          helperText: 'Help',
          placeholder: 'New',
          creationLocationText: 'In /notes',
          value: 'note.md',
          errorMessage: undefined,
          creating: false,
          onChange,
          onClose: jest.fn(),
          onCreate,
          testId: 'create-item',
        })
      );
    });

    const field = renderer!.root.findByType(TextField);

    act(() => {
      field.props.onKeyPress({ key: 'Enter' });
    });

    expect(onCreate).toHaveBeenCalled();
  });
});
