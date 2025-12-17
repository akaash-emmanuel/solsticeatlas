import React from 'react';
import { sunWavelengths } from '../../data/planets';
import { SunWavelength } from '../../types';

interface WavelengthSelectorProps {
  selectedWavelength: string;
  onWavelengthChange: (wavelength: string) => void;
}

export const WavelengthSelector: React.FC<WavelengthSelectorProps> = ({
  selectedWavelength,
  onWavelengthChange
}) => {
  const [showTooltip, setShowTooltip] = React.useState<string | null>(null);

  return (
    <div className="fixed top-4 right-4 z-40">
      <div className="bg-black bg-opacity-95 text-white rounded-lg p-4 shadow-2xl border border-gray-700">
        <h3 className="text-lg font-semibold mb-3">Sun Wavelengths</h3>
        <div className="grid grid-cols-2 gap-2">
          {sunWavelengths.map((wavelength) => (
            <div key={wavelength.value} className="relative">
              <button
                onClick={() => onWavelengthChange(wavelength.value)}
                onMouseEnter={() => setShowTooltip(wavelength.value)}
                onMouseLeave={() => setShowTooltip(null)}
                className={`w-full p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedWavelength === wavelength.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                }`}
                style={{ 
                  borderLeft: `4px solid ${wavelength.color}`,
                }}
              >
                {wavelength.label}
              </button>
              
              {showTooltip === wavelength.value && (
                <div className="absolute left-full ml-2 top-0 bg-gray-900 text-white text-xs p-2 rounded-lg whitespace-nowrap z-50 shadow-lg border border-gray-600">
                  {wavelength.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};