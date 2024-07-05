import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Link, useNavigate } from 'react-router-dom';
import './StatsPage.css'; // Add some basic styling

Modal.setAppElement('#root');
const backendUrl = process.env.REACT_APP_BACKEND_URL;
const hCaptchaSiteKey = process.env.REACT_APP_HCAPTCHA_SITE_KEY;

const StatsPage = ({ isLoggedIn, setIsLoggedIn }) => {
  const [userStats, setUserStats] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [hcaptchaToken, setHcaptchaToken] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/global_stats`);
        setGlobalStats(response.data);
      } catch (error) {
        console.error('Error fetching global stats:', error);
        setErrorMessage('Failed to fetch global stats. \nThe server is incorrectly configured or offline if this happens.');
      }
    };

    const fetchUserStats = async () => {
      try {
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

  const handleLoginClick = () => {
    setIsModalOpen(true);
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();

    if (!hcaptchaToken) {
      setErrorMessage('Please complete the hCaptcha');
      return;
    }

    const url = isRegistering ? `${backendUrl}/register` : `${backendUrl}/login`;
    const payload = { username, password, hcaptchaToken };

    axios.post(url, payload, { withCredentials: true })
      .then((response) => {
        console.log('Auth response:', response.data);
        setIsModalOpen(false);
        setUsername('');
        setPassword('');
        setHcaptchaToken('');
        setErrorMessage('');
        setIsLoggedIn(true);
        localStorage.setItem('isLoggedIn', 'true');
        if (isRegistering) {
          navigate('/'); // Navigate to home or dashboard after successful registration
        }
      })
      .catch((error) => {
        console.error('Auth error:', error);
        if (error.response) {
          setErrorMessage(error.response.data.message);
        } else {
          setErrorMessage('An unexpected error occurred');
        }
      });
  };

  const handleHcaptchaVerify = (token) => {
    setHcaptchaToken(token);
  };

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

      {isLoggedIn && userStats ? (
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
      ) : (
        <div className="info-message">
          <button className="handleLoginClick" onClick={handleLoginClick}>Login</button>
           to view your personal statistics.
        </div>
      )}

      <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} className="auth-modal">
        <h2>{isRegistering ? 'Register' : 'Login'}</h2>
        <form onSubmit={handleAuthSubmit}>
          <div>
            <label>Username:</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div>
            <label>Password:</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div>
            <HCaptcha
              sitekey={hCaptchaSiteKey}
              onVerify={handleHcaptchaVerify}
            />
          </div>
          <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
          {errorMessage && <p className="error">{errorMessage}</p>}
        </form>
        <button onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
        </button>
      </Modal>
    </div>
  );
};

export default StatsPage;