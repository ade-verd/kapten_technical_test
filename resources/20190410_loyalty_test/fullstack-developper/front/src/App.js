import React, { Component } from 'react';
import './App.css';

import Rider from './Rider.js';

class App extends Component {
  render() {
    return (
      <div className="App">
        <h1>Loyalty program</h1>
        <Rider id="000000000000000000000001" />
      </div>
    );
  }
}

export default App;
