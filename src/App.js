import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MapComponent from './MapComponent'; // Assuming you have a MapComponent
import StatsPage from './StatsPage'; // Assuming you have a StatsPage

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Router basename="/map-pixel-app">
      <Routes>
        <Route exact path="/" element={<MapComponent setIsLoggedIn={setIsLoggedIn} isLoggedIn={isLoggedIn} />} />
        <Route path="/stats" element={<StatsPage isLoggedIn={isLoggedIn} />} />
        {/* Add other routes here */}
      </Routes>
    </Router>
  );
}

export default App;