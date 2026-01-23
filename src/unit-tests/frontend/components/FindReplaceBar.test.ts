import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { TextField, Tooltip, IconButton } from '@mui/material';
import { FindReplaceBar } from '../../../frontend/components/FindReplaceBar';
import { FIND_REPLACE_TEXT } from '../../../frontend/components/FindReplaceBar/constants';

const getTooltipButton = (renderer: TestRenderer.ReactTestRenderer, title: string) => {
  const tooltip = renderer.root
    .findAllByType(Tooltip)
    .find((item) => item.props.title === title);

  if (!tooltip) {
    throw new Error(`Tooltip not found: ${title}`);
  }

  return tooltip.findByType(IconButton);
};

describe('FindReplaceBar', () => {
  it('handles keyboard shortcuts', () => {
    const onFindNext = jest.fn();
    const onFindPrevious = jest.fn();
    const onReplace = jest.fn();
    const onReplaceAll = jest.fn();
    const onClose = jest.fn();

    const renderer = TestRenderer.create(
      React.createElement(FindReplaceBar, {
        onClose,
        onFindNext,
        onFindPrevious,
        onReplace,
        onReplaceAll,
        initialQuery: 'term',
        matchInfo: { current: 1, total: 2 },
      })
    );

    const findInput = renderer.root
      .findAllByType(TextField)
      .find((field) => field.props.placeholder === FIND_REPLACE_TEXT.findPlaceholder);

    if (!findInput) {
      throw new Error('Find input not found');
    }

    act(() => {
      findInput.props.onKeyDown({ key: 'Enter', shiftKey: false });
    });
    expect(onFindNext).toHaveBeenCalledWith('term');

    act(() => {
      findInput.props.onKeyDown({ key: 'Enter', shiftKey: true });
    });
    expect(onFindPrevious).toHaveBeenCalledWith('term');

    act(() => {
      findInput.props.onKeyDown({ key: 'Escape' });
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('fires replace actions with current inputs', () => {
    const onFindNext = jest.fn();
    const onFindPrevious = jest.fn();
    const onReplace = jest.fn();
    const onReplaceAll = jest.fn();
    const onClose = jest.fn();

    const renderer = TestRenderer.create(
      React.createElement(FindReplaceBar, {
        onClose,
        onFindNext,
        onFindPrevious,
        onReplace,
        onReplaceAll,
        initialQuery: 'term',
      })
    );

    const replaceInput = renderer.root
      .findAllByType(TextField)
      .find((field) => field.props.placeholder === FIND_REPLACE_TEXT.replacePlaceholder);

    if (!replaceInput) {
      throw new Error('Replace input not found');
    }

    act(() => {
      replaceInput.props.onChange({ target: { value: 'swap' } });
    });

    const replaceButton = getTooltipButton(renderer, FIND_REPLACE_TEXT.replaceCurrent);
    act(() => {
      replaceButton.props.onClick();
    });
    expect(onReplace).toHaveBeenCalledWith('term', 'swap');

    const replaceAllButton = getTooltipButton(renderer, FIND_REPLACE_TEXT.replaceAll);
    act(() => {
      replaceAllButton.props.onClick();
    });
    expect(onReplaceAll).toHaveBeenCalledWith('term', 'swap');
  });
});
