import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './StatsPage.css'; // Add some basic styling

const StatsPage = ({ isLoggedIn }) => {
  const [stats, setStats] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/'); // Redirect to the home page if not logged in
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/user_stats', { withCredentials: true });
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setErrorMessage('Failed to fetch stats. Please try again later.');
      }
    };

    fetchStats();
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) {
    return <div className="error-message">Please log in to view your statistics.</div>;
  }

  if (errorMessage) {
    return <div className="error-message">{errorMessage}</div>;
  }

  if (!stats) {
    return <div className="loading-message">Loading...</div>;
  }

  return (
    <div className="stats-container">
      <h2>User Statistics</h2>
      <p>Total Pixels Placed: {stats.totalPixelsPlaced}</p>
      <p>Total Unique Colors Used: {stats.totalUniqueColors}</p>
      <h3>Placed Pixels:</h3>
      <ul>
        {stats.placedPixels.map((pixel, index) => (
          <li key={index}>
            <Link to={`/?lat=${pixel.lat}&lng=${pixel.lng}`}>
              Pixel at ({pixel.lat.toFixed(4)}, {pixel.lng.toFixed(4)}) - {pixel.color}
            </Link>
          </li>
        ))}
      </ul>
      <h3>World Statistics</h3>
      <p>Total Pixels Placed in the World: {stats.totalWorldPixelsPlaced}</p>
      <p>Total Users with Pixels: {stats.totalUsersWithPixels}</p>
      <p>Percentage of Pixels Placed Relative to the World: {stats.percentagePixelsPlaced.toFixed(10)}%</p>
    </div>
  );
};

export default StatsPage;