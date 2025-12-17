import React, { useState } from 'react';
import { Menu, X, Globe, Zap, Rocket, Wrench, Sun, RotateCcw } from 'lucide-react';
import { ViewMode } from '../../types';

interface HamburgerMenuProps {
  viewMode: ViewMode;
  onToggleView: (key: keyof ViewMode) => void;
  onReset: () => void;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  viewMode,
  onToggleView,
  onReset
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { key: 'solarSystem' as keyof ViewMode, label: 'Solar System', icon: Sun },
    { key: 'earthGlobe' as keyof ViewMode, label: 'Earth Globe', icon: Globe },
    { key: 'earthquakes' as keyof ViewMode, label: 'Earthquakes', icon: Zap },
    { key: 'apollo11' as keyof ViewMode, label: 'Apollo 11', icon: Rocket },
    { key: 'astronautTools' as keyof ViewMode, label: 'Astronaut Tools', icon: Wrench },
    { key: 'spaceWeather' as keyof ViewMode, label: 'Space Weather', icon: Sun }
  ];

  const handleToggle = (key: keyof ViewMode) => {
    onToggleView(key);
    // Close menu after selection on mobile
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };
  return (
    <div className="fixed top-4 left-4 z-50 select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black bg-opacity-80 text-white p-3 rounded-lg hover:bg-opacity-90 transition-all duration-200 shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      {isOpen && (
        <div className="absolute top-16 left-0 bg-black bg-opacity-95 text-white rounded-lg p-4 min-w-64 shadow-2xl border border-gray-700">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => handleToggle(item.key)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    viewMode[item.key] 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
            
            <div className="border-t border-gray-600 pt-2 mt-2">
              <button
                onClick={onReset}
                className="w-full flex items-center space-x-3 p-3 rounded-lg bg-red-600 hover:bg-red-700 transition-all duration-200 shadow-md"
              >
                <RotateCcw size={20} />
                <span>Reset Scene</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};