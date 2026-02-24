import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getDayFastingTimes, FastingTimes, formatLocalTime, formatDuration, getFastingTimesByCity } from '@danishfareed/ramadan-timings';

export const InteractiveMap = () => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const marker = useRef<maplibregl.Marker | null>(null);

    const [locationName, setLocationName] = useState('Mecca, Saudi Arabia');
    const [times, setTimes] = useState<FastingTimes | null>(null);
    const [offsetMinutes, setOffsetMinutes] = useState(180); // Default Mecca
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Initial calculation for Mecca
    useEffect(() => {
        const initialTimes = getDayFastingTimes(new Date(), {
            latitude: 21.4225,
            longitude: 39.8262,
            timezoneOffsetMinutes: 180,
            imsakMarginMinutes: 10
        });
        setTimes(initialTimes);
    }, []);

    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', // Dark beautiful map style
            center: [39.8262, 21.4225],
            zoom: 3,
            interactive: true,
        });

        marker.current = new maplibregl.Marker({ color: '#10B981' })
            .setLngLat([39.8262, 21.4225])
            .addTo(map.current);

        map.current.on('click', (e) => {
            const { lng, lat } = e.lngLat;
            updateMapAndData(lng, lat, `Coordinates: ${lat.toFixed(2)}°, ${lng.toFixed(2)}°`, -new Date().getTimezoneOffset());
        });

        return () => map.current?.remove();
    }, []);

    const updateMapAndData = (lng: number, lat: number, name: string, offset: number) => {
        setLocationName(name);
        setOffsetMinutes(offset);

        if (marker.current) marker.current.setLngLat([lng, lat]);
        if (map.current) map.current.flyTo({ center: [lng, lat], zoom: 5, essential: true });

        const newTimes = getDayFastingTimes(new Date(), {
            latitude: lat,
            longitude: lng,
            timezoneOffsetMinutes: offset,
            imsakMarginMinutes: 10,
            highLatitudeMode: 'middle-of-night' // Built-in fallback for click resilience
        });
        setTimes(newTimes);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery) return;

        setLoading(true);
        setError('');
        try {
            // Use the new library feature!
            const data = await getFastingTimesByCity(searchQuery, new Date(), { imsakMarginMinutes: 10, highLatitudeMode: 'middle-of-night' });

            setLocationName(data.locationName);
            setTimes(data.times);

            // We don't get exact coords directly from getFastingTimesByCity in the output (they are used internally). 
            // But we can approximate the visual by searching open-meteo again or leaving the marker. 
            // For full map flying, we will re-query the geocode helper manually for the bounds if we wanted. 
            // Instead, we will do a direct call to the open meteo API from the component so we can fly the map.
            const url = \`https://geocoding-api.open-meteo.com/v1/search?name=\${encodeURIComponent(searchQuery)}&count=1&format=json\`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.results && json.results.length > 0) {
        const { latitude, longitude } = json.results[0];
        if (marker.current) marker.current.setLngLat([longitude, latitude]);
        if (map.current) map.current.flyTo({ center: [longitude, latitude], zoom: 6 });
      }

    } catch (err: any) {
      setError(err.message || 'City not found. Try a different query.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="map-showcase">
      <div className="map-overlay-panel">
        <h2>Global City Search & Interactive Map</h2>
        <p className="subtitle mb-4">Click anywhere on the map or search a city to instantly evaluate Sharia-compliant timings using the `getFastingTimesByCity` feature.</p>
        
        <form className="search-box" onSubmit={handleSearch}>
          <input 
            type="text" 
            placeholder="Search city (e.g. 'London', 'Tokyo')" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" disabled={loading}>{loading ? '...' : 'Search'}</button>
        </form>
        {error && <div className="error">{error}</div>}

        <div className="results-panel mt">
          <h3 className="location-title">{locationName}</h3>
          
          {times ? (
            <div className="times-list">
              <div className="time-row"><span>Imsak:</span> <b>{formatLocalTime(times.imsak, offsetMinutes)}</b></div>
              <div className="time-row highlight-text"><span>Fajr (Start):</span> <b>{formatLocalTime(times.fajr, offsetMinutes)}</b></div>
              <div className="time-row"><span>Sunrise:</span> <b>{formatLocalTime(times.sunrise, offsetMinutes)}</b></div>
              <div className="time-row"><span>Dhuhr:</span> <b>{formatLocalTime(times.solarNoon, offsetMinutes)}</b></div>
              <div className="time-row highlight-text"><span>Maghrib (End):</span> <b>{formatLocalTime(times.maghrib, offsetMinutes)}</b></div>
              
              <div className="duration-pill mt">
                Fasting Duration: {formatDuration(times.fastingDurationMinutes)}
              </div>
            </div>
          ) : (
            <div className="error">Times could not be computed.</div>
          )}
        </div>
      </div>
      
      <div ref={mapContainer} className="map-container-div" />
    </div>
  );
};
