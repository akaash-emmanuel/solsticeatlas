import React, { useState, useRef } from 'react';
import { ViewMode, Apollo11State, SpaceWeatherData } from './types';
import { HamburgerMenu } from './components/UI/HamburgerMenu';
import { WavelengthSelector } from './components/UI/WavelengthSelector';
import { Dashboard } from './components/UI/Dashboard';
import { SolarSystemRenderer } from './components/SolarSystem/SolarSystemRenderer';
import { EarthGlobeRenderer } from './components/EarthGlobe/EarthGlobeRenderer';
import { Apollo11Renderer } from './components/Apollo11/Apollo11Renderer';
import { AstronautToolsPanel } from './components/AstronautTools/AstronautToolsPanel';
import { SpaceWeatherPanel } from './components/SpaceWeather/SpaceWeatherPanel';
import { useEarthquakeData } from './hooks/useEarthquakeData';
import { useSpaceWeather } from './hooks/useSpaceWeather';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>({
    solarSystem: true,
    earthGlobe: false,
    earthquakes: false,
    apollo11: false,
    astronautTools: false,
    spaceWeather: false
  });
  const [selectedWavelength, setSelectedWavelength] = useState('304');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [apollo11State, setApollo11State] = useState<Apollo11State | undefined>();
  
  const { earthquakes, loading: earthquakesLoading, error: earthquakesError } = useEarthquakeData();
  const { data: spaceWeatherData, loading: spaceWeatherLoading, error: spaceWeatherError } = useSpaceWeather();

  const handleToggleView = (key: keyof ViewMode) => {
    setViewMode(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleReset = () => {
    setViewMode({
      solarSystem: true,
      earthGlobe: false,
      earthquakes: false,
      apollo11: false,
      astronautTools: false,
      spaceWeather: false
    });
    setSelectedWavelength('304');
    setSelectedTool(null);
    setApollo11State(undefined);
  };

  const handleToolSelect = (tool: string) => {
    setSelectedTool(selectedTool === tool ? null : tool);
  };

  const handleSpaceWeatherRetry = () => {
    // This would trigger a refetch in a real implementation
    console.log('Retrying space weather data fetch...');
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Main 3D Container */}
      <div ref={containerRef} className="w-full h-full">
        {/* Solar System */}
        {viewMode.solarSystem && (
          <SolarSystemRenderer
            containerRef={containerRef}
            selectedWavelength={selectedWavelength}
          />
        )}
        
        {/* Earth Globe */}
        {viewMode.earthGlobe && (
          <EarthGlobeRenderer
            containerRef={containerRef}
            earthquakes={viewMode.earthquakes ? earthquakes : []}
          />
        )}
        
        {/* Apollo 11 Mission */}
        {viewMode.apollo11 && (
          <Apollo11Renderer
            containerRef={containerRef}
            onStateChange={setApollo11State}
          />
        )}
      </div>

      {/* UI Overlays */}
      <HamburgerMenu
        viewMode={viewMode}
        onToggleView={handleToggleView}
        onReset={handleReset}
      />
      
      {viewMode.solarSystem && (
        <WavelengthSelector
          selectedWavelength={selectedWavelength}
          onWavelengthChange={setSelectedWavelength}
        />
      )}
      
      {viewMode.astronautTools && (
        <AstronautToolsPanel
          selectedTool={selectedTool}
          onToolSelect={handleToolSelect}
        />
      )}
      
      {viewMode.spaceWeather && (
        <SpaceWeatherPanel
          data={spaceWeatherData}
          loading={spaceWeatherLoading}
          error={spaceWeatherError}
          onRetry={handleSpaceWeatherRetry}
        />
      )}
      
      {/* Dashboard */}
      <Dashboard
        apollo11State={apollo11State}
        spaceWeatherData={spaceWeatherData}
        earthquakeCount={earthquakes.length}
      />
      
      {/* Loading States */}
      {(earthquakesLoading || spaceWeatherLoading) && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="bg-black bg-opacity-90 text-white p-6 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span>Loading space data...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;