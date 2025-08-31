import React from 'react';
import { Monitor, Square, Smartphone, Tablet, Maximize } from 'lucide-react';
import type { AspectRatio } from '../types';
import { aspectRatios } from '../data/festivals';

interface AspectRatioSelectorProps {
  selectedRatios: AspectRatio[];
  onToggleRatio: (ratio: AspectRatio) => void;
}

const getIcon = (ratioId: string) => {
  switch (ratioId) {
    case '1:1':
      return <Square className="w-5 h-5" />;
    case '16:9':
      return <Monitor className="w-5 h-5" />;
    case '9:16':
      return <Smartphone className="w-5 h-5" />;
    case '4:5':
      return <Tablet className="w-5 h-5" />;
    case '2:1':
      return <Maximize className="w-5 h-5" />;
    default:
      return <Square className="w-5 h-5" />;
  }
};

const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ selectedRatios, onToggleRatio }) => {
  const isSelected = (ratio: AspectRatio) => 
    selectedRatios.some(selected => selected.id === ratio.id);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Select Aspect Ratios</h2>
      <p className="text-gray-600 mb-6">Choose the formats you need for different social media platforms</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {aspectRatios.map((ratio) => (
          <button
            key={ratio.id}
            onClick={() => onToggleRatio(ratio)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${
              isSelected(ratio)
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className={`p-3 rounded-full ${
                isSelected(ratio) ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                {getIcon(ratio.id)}
              </div>
              
              <div>
                <h3 className="font-semibold text-lg">{ratio.name}</h3>
                <p className="text-sm opacity-75 mb-2">{ratio.description}</p>
                <div className="text-xs bg-gray-100 rounded px-2 py-1 inline-block">
                  {ratio.width} × {ratio.height}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {selectedRatios.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h3 className="font-medium text-green-800 mb-2">Selected Formats:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedRatios.map((ratio) => (
              <span
                key={ratio.id}
                className="inline-flex items-center space-x-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"
              >
                {getIcon(ratio.id)}
                <span>{ratio.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      
      {selectedRatios.length === 0 && (
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <p className="text-yellow-700 text-sm">
            ⚠️ Please select at least one aspect ratio to generate posts.
          </p>
        </div>
      )}
    </div>
  );
};

export default AspectRatioSelector;