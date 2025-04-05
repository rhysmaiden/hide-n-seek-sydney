import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, Rectangle, Circle, InfoWindow } from '@react-google-maps/api';

const mapContainerStyle = {
    height: '100vh',
    width: '100vw',
    position: 'fixed', // To prevent scrolling
    top: 0,
    left: 0,
};

const center = {
    lat: -33.8688,
    lng: 151.2093,
};

const libraries = ['places']; // Add other libraries if needed

const bounds = {
    north: -33.7000,
    south: -33.93518102,
    east: 151.2109881,
    west: 151.0241784
};

const checkboxContainerStyle = {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    backgroundColor: 'white',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
};

function App() {
    const [stations, setStations] = useState([]);
    const [selectedStation, setSelectedStation] = useState(null);
    const [showStationNames, setShowStationNames] = useState(true);

    const isWithinBounds = (lat, lng) => {
        return lat <= bounds.north && lat >= bounds.south && lng <= bounds.east && lng >= bounds.west;
    };

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
    }, []);

    const handleMarkerClick = (station) => {
        setSelectedStation(station);
    };

    const handleToggleChange = (event) => {
        setShowStationNames(event.target.checked);
    };

    return (
        <div style={{ overflow: 'hidden', height: '100vh' }}> {/* Prevent body scrolling */}
            <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={libraries}>
                <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={12} options={{ disableDefaultUI: true }}> {/* disableDefaultUI to prevent map controls from interfering with fixed elements */}
                    <Rectangle
                        bounds={bounds}
                        options={{
                            strokeColor: '#FF0000',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            fillOpacity: 0,
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
                                title={station.name}
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
                </GoogleMap>
            </LoadScript>
            <div style={checkboxContainerStyle}>
                <label>
                    <input type="checkbox" id="toggleStations" checked={showStationNames} onChange={handleToggleChange} /> Show Station Names
                </label>
            </div>
        </div>
    );
}

export default App;
