import React from 'react';
import { Editor } from 'draft-js';

function normalizeSelectedIndex(selectedIndex, max) {
  let index = selectedIndex % max;
  if (index < 0) {
    index += max;
  }
  return index;
}

class TypeaheadEditor extends React.Component {
  constructor(props) {
    super(props);
  }

  hasEntityAtSelection() {
    const { editorState } = this.props;

    const selection = editorState.getSelection();
    if (!selection.getHasFocus()) {
      return false;
    }

    const contentState = editorState.getCurrentContent();
    const block = contentState.getBlockForKey(selection.getStartKey());
    return !!block.getEntityAt(selection.getStartOffset() - 1);
  }

  getTypeaheadRange() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) {
      return null;
    }

    if (this.hasEntityAtSelection()) {
      return null;
    }

    const range = selection.getRangeAt(0);
    let text = range.startContainer.textContent;

    // ..and before the typeahead token.
    const index1 = text.lastIndexOf('@');
    const index2 = text.lastIndexOf('#');
    const index3 = text.lastIndexOf('<>');
    const index = Math.max(index1, index2, index3);

    if (index === -1) {
      return null;
    }
    text = text.substring(index);

    return {
      text,
      start: index,
      end: range.startOffset
    };
  }

  getCurrentTypeaheadState() {
    return this.props.typeaheadState;
  }

  updateTypeaheadState(typeaheadState) {
    this.props.onTypeaheadChange && this.props.onTypeaheadChange(typeaheadState);
  }

  createNewTypeaheadState() {
    const typeaheadRange = this.getTypeaheadRange();
    if (!typeaheadRange) {
      this.props.onTypeaheadChange(null);
      return null;
    }
    
    const tempRange = window.getSelection().getRangeAt(0).cloneRange();
    tempRange.setStart(tempRange.startContainer, typeaheadRange.start);

    const rangeRect = tempRange.getBoundingClientRect();
    let [left, top] = [rangeRect.left, rangeRect.bottom];

    this.props.onTypeaheadChange({
      left,
      top,
      text: typeaheadRange.text,
      selectedIndex: 0
    });
  }

  onChange = (editorState) => {
    this.props.onChange(editorState);

    // Set typeahead visibility. Wait a frame to ensure that the cursor is
    // updated.
    if (this.props.onTypeaheadChange) {
      window.requestAnimationFrame(() => {
        this.createNewTypeaheadState();
      });
    }
  };

  onEscape = (e) => {
    if (!this.getCurrentTypeaheadState()) {
      this.props.onEscape && this.props.onEscape(e);
      return;
    }

    e.preventDefault();
    this.updateTypeaheadState(null);
  };

  onArrow(e, originalHandler, nudgeAmount) {
    let typeaheadState = this.getCurrentTypeaheadState();

    if (!typeaheadState) {
      originalHandler && originalHandler(e);
      return;
    }

    e.preventDefault();
    typeaheadState.selectedIndex += nudgeAmount;
    this.updateTypeaheadState(typeaheadState);
  }

  onUpArrow = (e) => {
    this.onArrow(e, this.props.onUpArrow, -1);
  };

  onDownArrow = (e) => {
    this.onArrow(e, this.props.onDownArrow, 1);
  }

  onTab = (e) => {
    e.preventDefault();
    this.handleReturn();
  }

  handleReturn = (e) => {
    const typeaheadState = this.getCurrentTypeaheadState();
    if (typeaheadState) {
      if (this.props.handleTypeaheadReturn) {
        const contentState = this.props.editorState.getCurrentContent();

        const selection = contentState.getSelectionAfter();
        const entitySelection = selection.set(
          'anchorOffset', selection.getFocusOffset() - typeaheadState.text.length
        );

        this.props.handleTypeaheadReturn(
          typeaheadState.text, typeaheadState.selectedIndex, entitySelection
        );
        
        this.updateTypeaheadState(null);
      } else {
        console.error(
          "Warning: A typeahead is showing and return was pressed but `handleTypeaheadReturn` " +
          "isn't implemented."
        );
      }
      return true;
    }
    return false;
  };

  render() {
    const {
      onChange,
      onEscape, onUpArrow, onDownArrow,
      onTypeaheadChange,
      ...other
    } = this.props;

    return (
      <Editor
        {...other}
        onChange={this.onChange}
        onEscape={this.onEscape}
        onTab={this.onTab}
        onUpArrow={this.onUpArrow}
        onDownArrow={this.onDownArrow}
        handleReturn={this.handleReturn}
      />
    );
  }
};

export {
  normalizeSelectedIndex,
  TypeaheadEditor,
};
