import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, Rectangle, Circle, InfoWindow } from '@react-google-maps/api';

const mapContainerStyle = {
    height: '100vh',
    width: '100%',
};

const center = {
    lat: -33.8688,
    lng: 151.2093,
};

const libraries = ['places']; // Add other libraries if needed

const bounds = {
  north: -33.7000,
  south: -33.92884985,
  east: 151.2109881,
  west: 151.0667339,
};

function App() {
    const [stations, setStations] = useState([]);
    const [selectedStation, setSelectedStation] = useState(null);
    const [showStationNames, setShowStationNames] = useState(true);

    const isWithinBounds = useCallback((lat, lng) => {
        return lat <= bounds.north && lat >= bounds.south && lng <= bounds.east && lng >= bounds.west;
    }, [bounds]);

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

    return (
        <div>
            <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                <label>
                    <input type="checkbox" id="toggleStations" checked={showStationNames} onChange={handleToggleChange} /> Show Station Names
                </label>
            </div>
            <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={libraries}>
                <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={12}>
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
        </div>
    );
}

export default App;
