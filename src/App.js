import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import MapComponent from './MapComponent';
import StatsPage from './StatsPage';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => JSON.parse(localStorage.getItem('isLoggedIn')) || false);

  useEffect(() => {
    localStorage.setItem('isLoggedIn', JSON.stringify(isLoggedIn));
  }, [isLoggedIn]);

  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<MapComponent setIsLoggedIn={setIsLoggedIn} isLoggedIn={isLoggedIn} />} />
          <Route path="/stats" element={<StatsPage isLoggedIn={isLoggedIn} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;