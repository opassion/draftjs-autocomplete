import React, { Component } from 'react';
import { EditorState } from 'draft-js';
import Editor from 'draft-js-plugins-editor';
import createMentionPlugin, { defaultSuggestionsFilter } from 'draft-js-mention-plugin';
import editorStyles from './editor.module.css';
import { persons, hashes, relations } from '../constants';

export default class SimpleMentionEditor extends Component {

  constructor(props) {
    super(props);

    this.mentionPersonPlugin = createMentionPlugin({
      persons,
      entityMutability: 'IMMUTABLE',
      mentionPrefix: '@',
      mentionTrigger: '@',
      supportWhitespace: true
    });

    this.mentionHashPlugin = createMentionPlugin({
      hashes,
      entityMutability: 'IMMUTABLE',
      mentionPrefix: '#',
      mentionTrigger: '#',
      supportWhitespace: true
    });

    this.mentionRelationPlugin = createMentionPlugin({
      hashes,
      entityMutability: 'IMMUTABLE',
      mentionPrefix: '<>',
      mentionTrigger: '<>',
      supportWhitespace: true
    });
  }

  state = {
    editorState: EditorState.createEmpty(),
    suggestionPersons: persons,
    suggestionHashes: hashes,
    suggestionRelations: relations
  };

  onChange = (editorState) => {
    this.setState({
      editorState,
    });
  };

  onPersonSearchChange = ({ value }) => {
    this.setState({
      mentionList1: defaultSuggestionsFilter(value, persons),
    });
  };

  onHashSearchChange = ({ value }) => {
    this.setState({
      suggestionHashes: defaultSuggestionsFilter(value, hashes),
    });
  };

  onRelationSearchChange = ({ value }) => {
    this.setState({
      suggestionRelations: defaultSuggestionsFilter(value, relations),
    });
  };

  focus = () => {
    this.editor.focus();
  };

  render() {
    const { MentionSuggestions: MentionPersonSuggestion } = this.mentionPersonPlugin;
    const { MentionSuggestions: MentionHashSuggestion } = this.mentionHashPlugin
    const { MentionSuggestions: MentionRelationSuggestion } = this.mentionRelationPlugin;

    const plugins = [this.mentionHashPlugin, this.mentionPersonPlugin, this.mentionRelationPlugin];

    return (
      <div className={editorStyles.editor} onClick={this.focus}>
        <Editor
          editorState={this.state.editorState}
          onChange={this.onChange}
          plugins={plugins}
          ref={(element) => { this.editor = element; }}
        />
        <MentionPersonSuggestion
          onSearchChange={this.onPersonSearchChange}
          suggestions={this.state.suggestionPersons}
        />
        <MentionHashSuggestion
          onSearchChange={this.onHashSearchChange}
          suggestions={this.state.suggestionHashes}
        />
        <MentionRelationSuggestion
          onSearchChange={this.onRelationSearchChange}
          suggestions={this.state.suggestionRelations}
        />
      </div>
    );
  }
}