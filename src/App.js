import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, Rectangle, Circle, InfoWindow } from '@react-google-maps/api';

const mapContainerStyle = {
  height: '100vh',
  width: '100vw',
  position: 'fixed',
  top: 0,
  left: 0,
};

const center = {
  lat: -33.8688,
  lng: 151.2093,
};

const libraries = ['places', 'geometry']; // Add 'geometry'

const bounds = {
  north: -33.7000,
  south: -33.93518102,
  east: 151.2109881,
  west: 151.0241784
};

const controlsContainerStyle = {
  position: 'fixed',
  bottom: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 10,
  backgroundColor: 'white',
  padding: '10px',
  border: '1px solid #ccc',
  borderRadius: '5px',
  display: 'flex',
  gap: '20px',
  alignItems: 'center',
};

function App() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showStationNames, setShowStationNames] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(center);
  const [geolocationError, setGeolocationError] = useState(null);
  const [radius, setRadius] = useState(0); // Initial radius in meters
  const [startPoint, setStartPoint] = useState(null); // Distance measurement
  const [endPoint, setEndPoint] = useState(null); // Distance measurement
  const [distance, setDistance] = useState(null); // Distance measurement
  const [measuringMode, setMeasuringMode] = useState(false);

  const isWithinBounds = useCallback((lat, lng) => {
    return lat <= bounds.north && lat >= bounds.south && lng <= bounds.east && lng >= bounds.west;
  }, []);

  useEffect(() => {
    fetch('stations.csv')
      .then((response) => response.text())
      .then((csvData) => {
        const rows = csvData.split('\n');
        const parsedStations = [];
        rows.forEach((row) => {
          const data = row.split(',');
          if (data.length === 3) {
            const stationName = data[0].trim();
            const lat = parseFloat(data[1].trim());
            const lng = parseFloat(data[2].trim());
            if (stationName && !isNaN(lat) && !isNaN(lng) && isWithinBounds(lat, lng)) {
              parsedStations.push({ name: stationName, lat, lng });
            }
          }
        });
        setStations(parsedStations);
      })
      .catch((error) => console.error('Error loading the CSV file:', error));
  }, [isWithinBounds]);

  const handleMarkerClick = (station) => {
    setSelectedStation(station);
  };

  const handleToggleChange = (event) => {
    setShowStationNames(event.target.checked);
  };

  const handleGeolocationSuccess = (position) => {
    const { latitude, longitude } = position.coords;
    setUserLocation({ lat: latitude, lng: longitude });
    setMapCenter({ lat: latitude, lng: longitude });
    setGeolocationError(null);
  };

  const handleGeolocationError = (error) => {
    setGeolocationError(error.message);
    console.error('Error getting user location:', error);
  };

  useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ lat: latitude, lng: longitude });
                    setGeolocationError(null);
                  },
                handleGeolocationError
              );

            // Optional: For continuous tracking of the user's location WITHOUT centering the map
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ lat: latitude, lng: longitude });
                    setGeolocationError(null);
                  },
                handleGeolocationError,
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0,
                  }
              );
            return () => navigator.geolocation.clearWatch(watchId);
          } else {
            setGeolocationError('Geolocation is not supported by your browser.');
          }
      }, []);

  const handleRadiusChange = (event) => {
    setRadius(parseInt(event.target.value, 10));
  };

  // --- Distance Measurement Handlers ---
  const handleMapClick = 
  (event) => {
    console.log(measuringMode)
    if (!measuringMode) return;
    console.log(event.latLng);

    const lat = event.latLng.lat(); // Correct way to get latitude
    const lng = event.latLng.lng(); // Correct way to get longitude
    const latLng = { lat, lng };

    if (!startPoint) {
      setStartPoint(latLng);
      setEndPoint(null);
      setDistance(null);
    } else if (!endPoint) {
      setEndPoint(latLng);
      const dist = window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(startPoint.lat, startPoint.lng),
        new window.google.maps.LatLng(lat, lng)
      );
      setDistance(dist);
    } else {
      setStartPoint(latLng);
      setEndPoint(null);
      setDistance(null);
    }
  };

  const toggleMeasuringMode = () => {
    setMeasuringMode(!measuringMode);
    if (measuringMode) {
      // Reset measurement when exiting measuring mode
      setStartPoint(null);
      setEndPoint(null);
      setDistance(null);
    }
  };

  return (
    <div style={{ overflow: 'hidden', height: '100vh' }}>
      <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={libraries}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={12}
          options={{ disableDefaultUI: true }}
          onClick={handleMapClick} // Add onClick handler
        >
          <Rectangle
            bounds={bounds}
            options={{
              strokeColor: '#FF0000',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillOpacity: 0,
              clickable: false
            }}
          />
          {stations.map((station) => (
            <React.Fragment key={`${station.lat}-${station.lng}`}>
              <Circle
                center={{ lat: station.lat, lng: station.lng }}
                radius={500}
                options={{
                  fillColor: '#FF0000',
                  fillOpacity: 0.20,
                  strokeOpacity: 0,
                  strokeWeight: 1,
                  clickable: false,
                }}
              />
              <Marker
                position={{ lat: station.lat, lng: station.lng }}
                onClick={() => handleMarkerClick(station)}
                visible={showStationNames}
              >
                {selectedStation && selectedStation.lat === station.lat && selectedStation.lng === station.lng && (
                  <InfoWindow onCloseClick={() => setSelectedStation(null)}>
                    <h3>{station.name}</h3>
                  </InfoWindow>
                )}
              </Marker>
            </React.Fragment>
          ))}
          {userLocation && (
            <>
              <Marker
                position={userLocation}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: 'blue',
                  fillOpacity: 0.8,
                  strokeColor: 'white',
                  strokeWeight: 1,
                }}
                title="Your Location"
              />
              <Circle
                center={userLocation}
                radius={radius}
                options={{
                  fillColor: 'blue',
                  fillOpacity: 0.15,
                  strokeColor: 'blue',
                  strokeOpacity: 0.5,
                  strokeWeight: 2,
                  clickable: false,
                }}
              />
            </>
          )}
          {/* --- Distance Measurement Markers and InfoWindow --- */}
          {startPoint && <Marker position={startPoint} label="A" />}
          {endPoint && <Marker position={endPoint} label="B" />}
          {startPoint &&
            endPoint && (
              <InfoWindow
                position={{
                  lat: (startPoint.lat + endPoint.lat) / 2,
                  lng: (startPoint.lng + endPoint.lng) / 2,
                }}
                onCloseClick={() => {
                  setStartPoint(null);
                  setEndPoint(null);
                  setDistance(null);
                }}
              >
                <div>Distance: {distance ? distance.toFixed(2) : 0} meters</div>
              </InfoWindow>
            )}
        </GoogleMap>
      </LoadScript>
      {geolocationError && (
        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, backgroundColor: 'yellow', padding: '10px', border: '1px solid orange', borderRadius: '5px' }}>
          Error: {geolocationError}
        </div>
      )}
      <div style={controlsContainerStyle}>
        <label>
          <input type="checkbox" checked={showStationNames} onChange={handleToggleChange} /> Show Station Names
        </label>
        <label>
          Radius:
          <input
            type="number"
            min="0" // Changed min to 0
            max="20000"
            step="100"
            value={radius}
            onChange={handleRadiusChange}
          />
        </label>
        <button onClick={toggleMeasuringMode}>
          {measuringMode ? 'Disable Measuring' : 'Enable Measuring'}
        </button>
      </div>
    </div>
  );
}

export default App;
