import React from 'react';
import { Apollo11State, SpaceWeatherData } from '../../types';
import { Activity, Thermometer, Zap, Gauge } from 'lucide-react';

interface DashboardProps {
  apollo11State?: Apollo11State;
  spaceWeatherData?: SpaceWeatherData;
  earthquakeCount?: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  apollo11State,
  spaceWeatherData,
  earthquakeCount
}) => {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-30">
      <div className="bg-black bg-opacity-95 text-white rounded-lg p-4 shadow-2xl border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Apollo 11 Status */}
          {apollo11State && (
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
              <h4 className="font-semibold mb-2 flex items-center space-x-2">
                <Activity size={16} />
                <span>Apollo 11 Mission</span>
              </h4>
              <div className="text-sm space-y-1">
                <div>Phase: <span className="text-blue-400">{apollo11State.phase.replace('_', ' ')}</span></div>
                <div>Progress: <span className="text-green-400">{apollo11State.progress}%</span></div>
                <div>Altitude: <span className="text-yellow-400">{apollo11State.altitude} km</span></div>
                <div>Velocity: <span className="text-purple-400">{apollo11State.velocity} km/s</span></div>
              </div>
            </div>
          )}

          {/* Space Weather */}
          {spaceWeatherData && (
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
              <h4 className="font-semibold mb-2 flex items-center space-x-2">
                <Thermometer size={16} />
                <span>Space Weather</span>
              </h4>
              <div className="text-sm space-y-1">
                <div>Solar Flares: <span className="text-red-400">{spaceWeatherData.solarFlares.length}</span></div>
                <div>Radiation: <span className="text-orange-400">{spaceWeatherData.radiationLevel.toFixed(1)}%</span></div>
                <div>Geomagnetic: <span className="text-green-400">{spaceWeatherData.geomagneticStorm}</span></div>
              </div>
            </div>
          )}

          {/* Earth Activity */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
            <h4 className="font-semibold mb-2 flex items-center space-x-2">
              <Zap size={16} />
              <span>Earth Activity</span>
            </h4>
            <div className="text-sm space-y-1">
              <div>Earthquakes: <span className="text-red-400">{earthquakeCount || 0}</span></div>
              <div>Magnitude 4.5+: <span className="text-yellow-400">Last 7 days</span></div>
              <div>Status: <span className="text-green-400">Monitoring</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};