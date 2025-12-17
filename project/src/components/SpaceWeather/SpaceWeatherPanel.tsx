import React from 'react';
import { Sun, Thermometer, Zap, Activity } from 'lucide-react';
import { SpaceWeatherData } from '../../types';
import { LoadingIndicator } from '../UI/LoadingIndicator';
import { ErrorMessage } from '../UI/ErrorMessage';

interface SpaceWeatherPanelProps {
  data: SpaceWeatherData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const SpaceWeatherPanel: React.FC<SpaceWeatherPanelProps> = ({
  data,
  loading,
  error,
  onRetry
}) => {
  return (
    <div className="fixed left-4 bottom-1/2 transform translate-y-1/2 z-30">
      <div className="bg-black bg-opacity-95 text-white rounded-lg p-4 w-80 shadow-2xl border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Sun size={20} />
          <span>Space Weather</span>
        </h3>
        
        {loading && <LoadingIndicator message="Loading space weather data..." />}
        
        {error && (
          <ErrorMessage message={error} onRetry={onRetry} />
        )}
        
        {data && (
          <div className="space-y-4">
            {/* Solar Flares */}
            <div className="bg-gray-800 rounded-lg p-3">
              <h4 className="font-medium mb-2 flex items-center space-x-2">
                <Zap size={16} />
                <span>Solar Flares</span>
              </h4>
              <div className="text-sm">
                <div className="mb-1">Recent Events: <span className="text-red-400">{data.solarFlares.length}</span></div>
                {data.solarFlares.length > 0 && (
                  <div className="text-xs text-gray-400">
                    Latest: {data.solarFlares[0]?.classType || 'Unknown'} class
                  </div>
                )}
              </div>
            </div>
            
            {/* Radiation Level */}
            <div className="bg-gray-800 rounded-lg p-3">
              <h4 className="font-medium mb-2 flex items-center space-x-2">
                <Thermometer size={16} />
                <span>Radiation Level</span>
              </h4>
              <div className="text-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${Math.min(data.radiationLevel, 100)}%` }}
                    />
                  </div>
                  <span className="text-orange-400">{data.radiationLevel.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            
            {/* Geomagnetic Storm */}
            <div className="bg-gray-800 rounded-lg p-3">
              <h4 className="font-medium mb-2 flex items-center space-x-2">
                <Activity size={16} />
                <span>Geomagnetic Storm</span>
              </h4>
              <div className="text-sm">
                <span className={`inline-block px-2 py-1 rounded text-xs ${
                  data.geomagneticStorm === 'Active' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-green-600 text-white'
                }`}>
                  {data.geomagneticStorm}
                </span>
              </div>
            </div>
            
            {/* Status */}
            <div className="text-xs text-gray-400 text-center">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};