import React, { Component } from 'react';
import './App.css';
import '../node_modules/draft-js/dist/Draft.css';
import '../node_modules/draft-js-mention-plugin/lib/plugin.css';

import MentionEditor from './app/components/MentionEditor';

class App extends Component {
  render() {
    return (
      <div className="App">
        <MentionEditor />
        <MentionEditor />
      </div>
    );
  }
}

export default App;
