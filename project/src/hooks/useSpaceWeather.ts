import { useState, useEffect } from 'react';
import { SpaceWeatherData } from '../types';

export const useSpaceWeather = () => {
  const [data, setData] = useState<SpaceWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpaceWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Using NASA's DONKI API for space weather data
        const response = await fetch(
          'https://api.nasa.gov/DONKI/FLR?startDate=2024-01-01&endDate=2024-12-31&api_key=jmRRPCUwwWyNaMrXJCNz8HDX8q94wPnQfKz0ig5a'
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch space weather data');
        }
        
        const flareData = await response.json();
        
        setData({
          solarFlares: flareData.slice(0, 10), // Get latest 10 flares
          radiationLevel: Math.random() * 100, // Simulated data
          geomagneticStorm: Math.random() > 0.7 ? 'Active' : 'Quiet'
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        // Fallback data
        setData({
          solarFlares: [],
          radiationLevel: 15,
          geomagneticStorm: 'Quiet'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSpaceWeather();
    
    // Refresh every 30 minutes
    const interval = setInterval(fetchSpaceWeather, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
};