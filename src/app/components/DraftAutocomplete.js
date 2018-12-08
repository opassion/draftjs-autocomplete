import React from 'react';
import styled from 'styled-components';
import { EditorState, Entity, Modifier, CompositeDecorator } from 'draft-js';

import { TypeaheadEditor, normalizeSelectedIndex } from './TypeaheadEditor';
import { PERSON, RELATION, HASHTAG } from '../constants';

const Wrapper = styled.div`
  padding: 10px;
  border: 1px solid #ccc;
  background: white;
  z-index: 1;
  position: relative;
  height: 400px;
  overflow: auto;
  margin-bottom: 15px;
`;

const EditorHolder = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;

  > div {
    height: 100%;
  }
`;

const SelectDropdown = styled.div`
  border: 1px solid #ccc;
  background: white;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, .1), 0 1px 10px rgba(0, 0, 0, .35);
  border-radius: 3px;
  overflow: hidden;
  position: absolute;
  max-width: 250px;
  text-align: left;
  z-index: 101;
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

const decorator = new CompositeDecorator([
  {
    strategy: getEntityStrategy('SEGMENTED'),
    component: MentionSpan,
  },
]);

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
}

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

function Mentions({ left, top, selectedIndex, text, clientTop, clientLeft }) {
  
  const { filteredList } = getFilteredList(text);
  
  const normalizedIndex = normalizeSelectedIndex(selectedIndex, filteredList.length);
  
  
  return (
    <SelectDropdown left={left - clientLeft} top={top + clientTop}>
      {filteredList.map((item, index) => {
        return (
          <SelectItem highlight={index === normalizedIndex} key={`list-${index}`}>
            {!!item.photo && 
              <img src={item.photo} />
            }
            <span>{item.value}</span>
          </SelectItem>
        );
      })}
    </SelectDropdown>
  );
}

class MentionsEditorExample extends React.Component {
  constructor() {
    super();
    this.wrapper = React.createRef();
    this.state = {
      editorState: EditorState.createEmpty(decorator),
      typeaheadState: null
    };
  }

  onChange = (editorState) => this.setState({ editorState })

  onTypeaheadChange = (typeaheadState) => {
    this.setState({ typeaheadState });
  }

  handleTypeaheadReturn = (text, selectedIndex, selection) => {
    const { editorState } = this.state;
    const { key, filteredList } = getFilteredList(text);
    let keyValue = text;
    if (filteredList.length) {
      const index = normalizeSelectedIndex(selectedIndex, filteredList.length);
      keyValue = key + filteredList[index].value;
    }
    
    const contentStateWithEntity = Modifier.replaceText(
      editorState.getCurrentContent(),
      selection,
      keyValue,
      null,
      MENTION_ENTITY_KEY
    );

    const nextEditorState = EditorState.push(
      editorState, contentStateWithEntity, 'apply-entity'
    );

    this.setState({ editorState: nextEditorState });
  }

  renderTypeahead() {
    if (this.state.typeaheadState === null) {
      return null;
    }

    let clientTop = 0;
    let clientLeft = 0;

    if (this.wrapper && this.wrapper.current) {
      const rect = this.wrapper.current.getBoundingClientRect();
      clientTop = this.wrapper.current.scrollTop - rect.top;
      clientLeft = rect.left;
    }

    
    return <Mentions {...this.state.typeaheadState} clientTop={clientTop} clientLeft={clientLeft} />;
  }

  render() {
    
    return (
      <Wrapper ref={this.wrapper}>
        {this.renderTypeahead()}
        <EditorHolder>
          <TypeaheadEditor
            editorState={this.state.editorState}
            onChange={this.onChange}
            typeaheadState={this.state.typeaheadState}
            onTypeaheadChange={this.onTypeaheadChange}
            handleTypeaheadReturn={this.handleTypeaheadReturn}
          />
        </EditorHolder>
      </Wrapper>
    );
  }
}

export default MentionsEditorExample;
