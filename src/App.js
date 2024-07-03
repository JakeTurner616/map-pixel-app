import React, { useState, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import MapComponent from './MapComponent';
import StatsPage from './StatsPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (loggedIn) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={<MapComponent setIsLoggedIn={setIsLoggedIn} isLoggedIn={isLoggedIn} />} />
      <Route path="/stats" element={<StatsPage isLoggedIn={isLoggedIn} />} />
    </Routes>
  );
}

export default App;