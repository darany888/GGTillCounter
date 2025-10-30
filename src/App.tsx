import React from 'react';
import './App.css';
import Header from './components/Header';
import TillCounter from './components/TillCounter';

function App(): JSX.Element {
  return (
    <div id="App" className="App">
      <Header title="Glou Glou Cashup" />
      <TillCounter />
    </div>
  );
}

export default App;
