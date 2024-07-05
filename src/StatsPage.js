import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './StatsPage.css'; // Add some basic styling

const StatsPage = ({ isLoggedIn }) => {
  const [userStats, setUserStats] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL;
        const response = await axios.get(`${backendUrl}/api/global_stats`);
        setGlobalStats(response.data);
      } catch (error) {
        console.error('Error fetching global stats:', error);
        setErrorMessage('Failed to fetch global stats. \nThe server is incorrectly configured or offline if this happens.');
      }
    };

    const fetchUserStats = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL;
        const response = await axios.get(`${backendUrl}/api/user_stats`, { withCredentials: true });
        setUserStats(response.data);
      } catch (error) {
        console.error('Error fetching user stats:', error);
        setErrorMessage('Failed to fetch user stats. Either the session is invalid or the server is incorrectly configured or offline.\n Try to relog.');
      }
    };

    fetchGlobalStats();

    if (isLoggedIn) {
      fetchUserStats();
    }
  }, [isLoggedIn]);

  if (errorMessage) {
    return <div className="error-message">{errorMessage}</div>;
  }

  return (
    <div className="stats-container">
      <h2>World Statistics</h2>
      {globalStats ? (
        <div className="card">
          <p>Total Pixels Placed in the World: {globalStats.totalWorldPixelsPlaced}</p>
          <p>Total Unique Pixels Currently in the World: {globalStats.totalUniquePixels}</p>
          <p>Total Users with Pixels: {globalStats.totalUsersWithPixels}</p>
          <p>Percentage of Pixels Placed Relative to the World: {globalStats.percentagePixelsPlaced}%</p>
        </div>
      ) : (
        <div className="loading-message">Loading global stats...</div>
      )}

      {isLoggedIn && userStats && (
        <>
          <h2>User Statistics</h2>
          <div className="card">
            <p>Total Pixels Placed: {userStats.totalPixelsPlaced}</p>
            <p>Total Unique Colors Used: {userStats.totalUniqueColors}</p>
            <h3>Placed Pixels:</h3>
            <ul>
              {userStats.placedPixels.map((pixel, index) => (
                <li key={index}>
                  <Link to={`/?lat=${pixel.lat}&lng=${pixel.lng}`}>
                    Pixel at ({pixel.lat.toFixed(4)}, {pixel.lng.toFixed(4)}) - {pixel.color}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {!isLoggedIn && (
        <div className="info-message">Log in to view your personal statistics.</div>
      )}
    </div>
  );
};

export default StatsPage;
