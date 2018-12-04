import React, { Component } from 'react';
import styled from 'styled-components';
import { EditorState, Entity, Modifier, CompositeDecorator } from 'draft-js';

import { TypeaheadEditor, normalizeSelectedIndex } from './TypeaheadEditor';
import { PERSON, RELATION, HASHTAG } from '../constants';

const Wrapper = styled.div`
  min-height: 200px;
  padding: 10px;
  border: 1px solid #ccc;
  background: white;
`;

const SelectDropdown = styled.div`
  border: 1px solid #ccc;
  background: white;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, .1), 0 1px 10px rgba(0, 0, 0, .35);
  border-radius: 3;
  overflow: hidden;
  position: absolute;
  max-width: 250px;
  text-align: left;
  left: ${props => props.left}px;
  top: ${props => props.top}px;
`;

const SelectItem = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 24px;
  background: ${props => props.highlight ? '#3290cc' : 'white'};
  color: ${props => props.highlight ? 'white' : '#3290cc'};

  img {
    width: 40px;
    height: 40px;
    margin-right: 10px;
  }
`;

const MentionText = styled.span`
  color: #3290cc;
`;

const MENTION_ENTITY_KEY = Entity.create('MENTION', 'SEGMENTED');

function filterList(query, list) {
  return list.filter(item => {
    return item.value.toLowerCase().startsWith(query.toLowerCase());
  });
}

function MentionSpan(props) {
  return (
    <MentionText {...props}>
      {props.children}
    </MentionText>
  );
};

function getEntityStrategy(mutability) {
  return function (contentBlock, callback) {
    contentBlock.findEntityRanges(
      (character) => {
        const entityKey = character.getEntity();
        if (entityKey === null) {
          return false;
        }
        return Entity.get(entityKey).getMutability() === mutability;
      },
      callback
    );
  };
}

const decorator = new CompositeDecorator([
  {
    strategy: getEntityStrategy('SEGMENTED'),
    component: MentionSpan,
  },
]);

function getFilteredList(text) {
  let filteredList = [];
  let key = '';
  
  if (text.startsWith('@')) {
    key = '@';
    filteredList = filterList(text.replace(/^@/, ''), PERSON);
  } else if (text.startsWith('#')) {
    key = '#';
    filteredList = filterList(text.replace(/^#/, ''), HASHTAG);
  } else if (text.startsWith('<>')) {
    key = '<>';
    filteredList = filterList(text.replace(/^<>/, ''), RELATION);
  } 

  return {
    key,
    filteredList
  };
}

function Mentions ({ left, top, selectedIndex, text }) {
  
  const { filteredList } = getFilteredList(text);
  
  const normalizedIndex = normalizeSelectedIndex(selectedIndex, filteredList.length);

  return (
    <SelectDropdown left={left} top={top}>
      {filteredList.map((item, index) => {
        return (
          <SelectItem highlight={index === normalizedIndex}>
            {!!item.photo && 
              <img src={item.photo} />
            }
            <span>{item.value}</span>
          </SelectItem>
        );
      })}
    </SelectDropdown>
  );
};

class MentionsEditorExample extends Component {
  constructor() {
    super();

    this.state = {
      editorState: EditorState.createEmpty(decorator),
      typeaheadState: null
    };
  }

  onChange = (editorState) => this.setState({ editorState });

  onTypeaheadChange = (typeaheadState) => this.setState({ typeaheadState });

  handleTypeaheadReturn = (text, selectedIndex, selection) => {
    const { editorState } = this.state;
    const { key, filteredList } = getFilteredList(text);
    const index = normalizeSelectedIndex(selectedIndex, filteredList.length);
    const contentStateWithEntity = Modifier.replaceText(
      editorState.getCurrentContent(),
      selection,
      key + filteredList[index].value,
      null,
      MENTION_ENTITY_KEY
    );

    const nextEditorState = EditorState.push(
      editorState, contentStateWithEntity, 'apply-entity'
    );

    this.setState({ editorState: nextEditorState });
  };

  renderTypeahead() {
    if (this.state.typeaheadState === null) {
      return null;
    }
    
    return <Mentions {...this.state.typeaheadState} />;
  }

  render() {
    return (
      <div>
        {this.renderTypeahead()}
        <Wrapper>
          <TypeaheadEditor
            editorState={this.state.editorState}
            onChange={this.onChange}
            onTypeaheadChange={this.onTypeaheadChange}
            handleTypeaheadReturn={this.handleTypeaheadReturn}
          />
        </Wrapper>
      </div>
    );
  }
}

export default MentionsEditorExample;
