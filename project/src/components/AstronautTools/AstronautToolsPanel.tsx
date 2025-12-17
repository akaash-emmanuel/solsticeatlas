import React, { useState } from 'react';
import { Wrench, Trash2, Eye, Target, RotateCcw } from 'lucide-react';

interface AstronautToolsPanelProps {
  onToolSelect: (tool: string) => void;
  selectedTool: string | null;
}

export const AstronautToolsPanel: React.FC<AstronautToolsPanelProps> = ({
  onToolSelect,
  selectedTool
}) => {
  const tools = [
    { id: 'debris_cleaner', name: 'Debris Cleaner', icon: Trash2, description: 'Remove space debris' },
    { id: 'orbit_visualizer', name: 'Orbit Visualizer', icon: Eye, description: 'Show orbital paths' },
    { id: 'targeting_system', name: 'Targeting System', icon: Target, description: 'Target celestial bodies' },
    { id: 'attitude_control', name: 'Attitude Control', icon: RotateCcw, description: 'Control spacecraft orientation' }
  ];

  return (
    <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-30">
      <div className="bg-black bg-opacity-95 text-white rounded-lg p-4 w-64 shadow-2xl border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Wrench size={20} />
          <span>Astronaut Tools</span>
        </h3>
        
        <div className="space-y-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => onToolSelect(tool.id)}
                className={`w-full p-3 rounded-lg text-left transition-all duration-200 ${
                  selectedTool === tool.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon size={18} />
                  <div>
                    <div className="font-medium">{tool.name}</div>
                    <div className="text-xs text-gray-300">{tool.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-600">
          <div className="text-sm text-gray-400">
            Select a tool to interact with the 3D scene
          </div>
        </div>
      </div>
    </div>
  );
};