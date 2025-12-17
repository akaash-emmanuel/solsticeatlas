import { useState, useEffect } from 'react';
import { Earthquake } from '../types';

export const useEarthquakeData = () => {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEarthquakes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Using USGS earthquake API
        const response = await fetch(
          'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson'
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch earthquake data');
        }
        
        const data = await response.json();
        
        const earthquakeData: Earthquake[] = data.features.map((feature: any) => ({
          id: feature.id,
          magnitude: feature.properties.mag,
          depth: feature.geometry.coordinates[2],
          location: feature.properties.place,
          time: feature.properties.time,
          coordinates: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]] as [number, number]
        }));
        
        setEarthquakes(earthquakeData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchEarthquakes();
  }, []);

  return { earthquakes, loading, error };
};