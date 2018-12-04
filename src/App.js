import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import '../node_modules/draft-js/dist/Draft.css';
import MentionsEditorExample from './app/components/DraftAutocomplete';

class App extends Component {
  render() {
    return (
      <div className="App">
        <MentionsEditorExample />
      </div>
    );
  }
}

export default App;
