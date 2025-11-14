import React from 'react';
import Assists from './components/Assists';
import Points from './components/Points';
import Rebounds from './components/Rebounds';
import Threes from './components/Threes';
import './'

const App: React.FC = () => {
  return (
    <div>
      <h1>NBA Player Stats</h1>
      <Points />
      <Threes />
      <Assists />
      <Rebounds />
    </div>
  );
};

export default App;
