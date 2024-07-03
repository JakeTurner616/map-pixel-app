import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker, Tooltip, Polyline, Rectangle, useMap } from 'react-leaflet';
import { SketchPicker } from 'react-color';
import axios from 'axios';
import Modal from 'react-modal';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import 'leaflet/dist/leaflet.css';
import './MapComponent.css';
import { useLocation, useNavigate } from 'react-router-dom';
import L from 'leaflet';

Modal.setAppElement('#root');
const backendUrl = process.env.REACT_APP_BACKEND_URL;
const hCaptchaSiteKey = process.env.REACT_APP_HCAPTCHA_SITE_KEY;
const mapContainerStyle = {
  height: '100vh',
  width: '100vw',
};

const GRID_SIZE = 0.0001;

const snapToGrid = (value) => {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
};

const generateGridLines = (bounds) => {
  const lines = [];
  for (let lat = snapToGrid(bounds.getSouth()); lat <= snapToGrid(bounds.getNorth()); lat += GRID_SIZE) {
    lines.push([
      [lat, bounds.getWest()],
      [lat, bounds.getEast()],
    ]);
  }
  for (let lng = snapToGrid(bounds.getWest()); lng <= snapToGrid(bounds.getEast()); lng += GRID_SIZE) {
    lines.push([
      [bounds.getSouth(), lng],
      [bounds.getNorth(), lng],
    ]);
  }
  return lines;
};

const PixelLayer = ({ pixels, setHoveredPixelIndex }) => {
  return (
    <>
      {pixels.map((pixel, index) => (
        <Rectangle
          key={index}
          bounds={[
            [pixel.lat, pixel.lng],
            [pixel.lat + GRID_SIZE, pixel.lng + GRID_SIZE],
          ]}
          pathOptions={{ color: pixel.color, weight: 1, fillOpacity: 1 }}
          eventHandlers={{
            mouseover: () => setHoveredPixelIndex(index),
            mouseout: () => setHoveredPixelIndex(null),
          }}
        >
          <Tooltip
            direction="top"
            offset={[0, -10]}
            opacity={1}
            permanent={false}
            sticky={true}
          >
            <span>{`User: ${pixel.username || 'Unknown'}, Placed: ${new Date(pixel.placed_at).toLocaleString()}`}</span>
          </Tooltip>
        </Rectangle>
      ))}
    </>
  );
};

const MarkerLayer = ({ pixels, setHoveredPixelIndex }) => {
  return (
    <>
      {pixels.map((pixel, index) => {
        const customIcon = new L.DivIcon({
          className: 'custom-marker',
          html: `<div style="position: relative;">
                   <div style="background-color: ${pixel.color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid #fff;"></div>
                   <div class="custom-tooltip">${`User: ${pixel.username || 'Unknown'}, Placed: ${new Date(pixel.placed_at).toLocaleString()}`}</div>
                 </div>`,
        });

        return (
          <Marker
            key={index}
            position={[pixel.lat, pixel.lng]}
            icon={customIcon}
            eventHandlers={{
              mouseover: () => setHoveredPixelIndex(index),
              mouseout: () => setHoveredPixelIndex(null),
            }}
          />
        );
      })}
    </>
  );
};

const GridLayer = ({ zoomLevel }) => {
  const map = useMap();
  const [lines, setLines] = useState([]);

  const updateGridLines = useCallback(() => {
    const bounds = map.getBounds();
    setLines(generateGridLines(bounds));
  }, [map]);

  useEffect(() => {
    updateGridLines();

    map.on('moveend', updateGridLines);
    map.on('zoomend', updateGridLines);

    return () => {
      map.off('moveend', updateGridLines);
      map.off('zoomend', updateGridLines);
    };
  }, [map, updateGridLines]);

  if (zoomLevel < 18) return null;

  return (
    <>
      {lines.map((line, index) => (
        <Polyline
          key={index}
          positions={line}
          pathOptions={{ color: 'rgba(0, 0, 0, 0.2)', weight: 1 }}
        />
      ))}
    </>
  );
};

const HoverIndicator = ({ position }) => {
  if (!position) return null;

  return (
    <Rectangle
      bounds={[
        [position.lat, position.lng],
        [position.lat + GRID_SIZE, position.lng + GRID_SIZE],
      ]}
      pathOptions={{ color: '#000000', weight: 1, fillOpacity: 0.5 }}
    />
  );
};

const HoverLayer = ({ hoveredPixel, hoveredPixelData }) => {
  if (!hoveredPixel) return null;

  return (
    <Rectangle
      bounds={[
        [hoveredPixel.lat, hoveredPixel.lng],
        [hoveredPixel.lat + GRID_SIZE, hoveredPixel.lng + GRID_SIZE],
      ]}
      pathOptions={{ color: '#000000', weight: 1, fillOpacity: 0.5 }}
    >
      <Tooltip direction="top" offset={[0, -10]} opacity={1}>
        <span>{`User: ${hoveredPixelData.username || 'Unknown'}, Placed: ${hoveredPixelData.placed_at ? new Date(hoveredPixelData.placed_at).toLocaleString() : 'Unknown'}`}</span>
      </Tooltip>
    </Rectangle>
  );
};

const Timer = ({ nextAllowedTime }) => {
  const calculateTimeLeft = useCallback(() => {
    if (!nextAllowedTime) return null;
    const now = new Date();
    const nextAllowedDate = new Date(nextAllowedTime);
    console.log(`Current time: ${now.toISOString()}`);
    console.log(`Next allowed time: ${nextAllowedDate.toISOString()}`);

    const timeLeft = nextAllowedDate - now;
    console.log(`Time left in milliseconds: ${timeLeft}`);

    if (timeLeft <= 0) {
      return null;
    }
    const hours = Math.floor(timeLeft / 1000 / 60 / 60);
    const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);
    return { hours, minutes, seconds };
  }, [nextAllowedTime]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  if (!timeLeft) {
    return <div className="timer">You can place a pixel now!</div>;
  }

  return (
    <div className="timer">
      Next pixel placement allowed in: {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
    </div>
  );
};

const popularCities = [
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'Tokyo', lat: 35.6895, lng: 139.6917 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
  { name: 'Moscow', lat: 55.7558, lng: 37.6173 },
  { name: 'Dubai', lat: 25.276987, lng: 55.296249 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 }
];

const getRandomCity = () => {
  return popularCities[Math.floor(Math.random() * popularCities.length)];
};

const MapComponent = ({ setIsLoggedIn, isLoggedIn }) => {
  const [pixels, setPixels] = useState([]);
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const [zoomLevel, setZoomLevel] = useState(13);
  const [hoveredPixelIndex, setHoveredPixelIndex] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [nextAllowedTime, setNextAllowedTime] = useState(null);
  const [mapCenter, setMapCenter] = useState([51.505, -0.09]);
  const [hoverPosition, setHoverPosition] = useState(null);
  const [hcaptchaToken, setHcaptchaToken] = useState('');
  const [showPins, setShowPins] = useState(true);
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(window.innerWidth > 768); // Open by default on large screens
  const location = useLocation();
  const navigate = useNavigate();
  const initialSet = useRef(false);

  const MapUpdater = () => {
    const map = useMap();

    useEffect(() => {
      if (initialSet.current) return;

      const params = new URLSearchParams(location.search);
      const lat = parseFloat(params.get('lat'));
      const lng = parseFloat(params.get('lng'));
      if (!isNaN(lat) && !isNaN(lng)) {
        map.setView([lat, lng], 18);
        initialSet.current = true;
      } else {
        const randomCity = getRandomCity();
        setMapCenter([randomCity.lat, randomCity.lng]);
        map.setView([randomCity.lat, randomCity.lng], 13);
        initialSet.current = true;
      }
    }, [map]);

    return null;
  };

  useEffect(() => {
    const fetchPixels = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/get_map`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched pixel data:', data);
        setPixels(data.pixels);
      } catch (error) {
        console.error('Error fetching pixel data:', error);
      }
    };

    fetchPixels();

    const interval = setInterval(() => {
      fetchPixels();
    }, 8000); // Fetch updates every 8 seconds - for real time updates of pixel data

    return () => clearInterval(interval); // Clear interval on component unmount
  }, []);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (loggedIn) {
      setIsLoggedIn(true);
    }
  }, [setIsLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      const fetchNextAllowedTime = async () => {
        try {
          const response = await axios.get(`${backendUrl}/api/next_allowed_time`, { withCredentials: true });
          setNextAllowedTime(response.data.next_allowed_time);
        } catch (error) {
          console.error('Error fetching next allowed time:', error);
        }
      };

      fetchNextAllowedTime();
    }
  }, [isLoggedIn]);

  const handleMapClick = (e) => {
    if (!isLoggedIn) {
      setIsModalOpen(true);
      return;
    }

    if (zoomLevel < 18) return;

    const lat = snapToGrid(e.latlng.lat);
    const lng = snapToGrid(e.latlng.lng);
    const newPixel = { lat, lng, color: selectedColor };

    axios.post(`${backendUrl}/api/update_pixels`, { pixels: [newPixel] }, { withCredentials: true })
      .then((response) => {
        console.log('Pixel update response:', response.data);
        setPixels([...pixels, newPixel]);
        if (response.data.next_allowed_time) {
          setNextAllowedTime(response.data.next_allowed_time);
        }
      })
      .catch((error) => {
        console.error('Error updating pixel:', error);
        if (error.response && error.response.status === 403 && error.response.data.next_allowed_time) {
          setNextAllowedTime(error.response.data.next_allowed_time);
        } else {
          setErrorMessage('Network error: ' + error.message);
          if (error.response && error.response.data && error.response.data.next_allowed_time) {
            setNextAllowedTime(error.response.data.next_allowed_time);
          }
        }
      });
  };

  const handleMouseMove = (e) => {
    if (zoomLevel < 18) {
      setHoveredPixelIndex(null);
      setHoverPosition(null);
      return;
    }

    const lat = snapToGrid(e.latlng.lat);
    const lng = snapToGrid(e.latlng.lng);
    const hoveredPixelIndex = pixels.findIndex(
      (pixel) =>
        snapToGrid(pixel.lat) === lat && snapToGrid(pixel.lng) === lng
    );
    setHoveredPixelIndex(hoveredPixelIndex);
    setHoverPosition({ lat, lng });
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

  const handleLogout = () => {
    axios.post(`${backendUrl}/logout`, {}, { withCredentials: true })
      .then((response) => {
        console.log('Logout response:', response.data);
        setIsLoggedIn(false);
        setNextAllowedTime(null);
        localStorage.removeItem('isLoggedIn');
      })
      .catch((error) => {
        console.error('Error logging out:', error);
        if (error.response && error.response.status === 405) {
          setErrorMessage('Method not allowed. Please make sure the HTTP method is POST.');
        } else {
          setErrorMessage('Network error: ' + error.message);
        }
      });
  };

  const handleHcaptchaVerify = (token) => {
    setHcaptchaToken(token);
  };

  const MapEvents = () => {
    useMapEvents({
      click: handleMapClick,
      zoomend: (e) => {
        setZoomLevel(e.target.getZoom());
      },
      moveend: (e) => {
        setZoomLevel(e.target.getZoom());
      },
      mousemove: handleMouseMove,
    });
    return null;
  };

  const togglePinsVisibility = () => {
    setShowPins(!showPins);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsColorPickerVisible(false);
      } else {
        setIsColorPickerVisible(true);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="map-container">
      <button 
        className="color-picker-toggle-button" 
        onClick={() => setIsColorPickerVisible(!isColorPickerVisible)}
      >
        {isColorPickerVisible ? 'Hide Color Picker' : 'Show Color Picker'}
      </button>
      {isColorPickerVisible && (
        <div className="color-picker">
          <SketchPicker
            color={selectedColor}
            onChangeComplete={(color) => setSelectedColor(color.hex)}
          />
        </div>
      )}
<div className="top-buttons">
  {isLoggedIn && (
    <>
      <button className="logout-button" onClick={handleLogout}>Logout</button>
      
    </>
  )}
  <button className="stats-button" onClick={() => navigate('/stats')}>Stats</button>
  <button className="pins-toggle-button" onClick={togglePinsVisibility}>{showPins ? 'Hide Pins' : 'Show Pins'}</button>
</div>
      <MapContainer center={mapCenter} zoom={zoomLevel} style={mapContainerStyle}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <MapEvents />
        <PixelLayer pixels={pixels} setHoveredPixelIndex={setHoveredPixelIndex} />
        {showPins && <MarkerLayer pixels={pixels} setHoveredPixelIndex={setHoveredPixelIndex} />}
        <MapUpdater />
        {zoomLevel >= 18 && <GridLayer zoomLevel={zoomLevel} />}
        {hoverPosition && zoomLevel >= 18 && <HoverIndicator position={hoverPosition} />}
        {hoveredPixelIndex !== null && zoomLevel >= 18 && (
          <HoverLayer
            hoveredPixel={pixels[hoveredPixelIndex]}
            hoveredPixelData={pixels[hoveredPixelIndex]}
          />
        )}
      </MapContainer>
      {nextAllowedTime && isLoggedIn && <Timer nextAllowedTime={nextAllowedTime} />}
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

export default MapComponent;
