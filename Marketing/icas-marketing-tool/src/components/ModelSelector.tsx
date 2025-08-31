import React from 'react';
import { Cpu, Zap, Sparkles, Palette } from 'lucide-react';
import type { ImageModel } from '../types';

interface ModelSelectorProps {
  selectedModel: ImageModel;
  onModelChange: (model: ImageModel) => void;
}

const AVAILABLE_MODELS: ImageModel[] = [
  {
    id: 'canvas-local',
    name: 'Local Canvas',
    description: 'Fast, reliable local generation with festival themes',
    provider: 'local',
    features: ['Instant Generation', 'No API Limits', 'Festival Themes', 'CORS-Free']
  },
  {
    id: 'openrouter-dalle',
    name: 'DALL-E 3 (OpenRouter)',
    description: 'High-quality AI images with detailed marketing prompts',
    provider: 'openrouter',
    endpoint: 'openai/dall-e-3',
    features: ['Premium Quality', 'Marketing Optimized', 'Professional Results', 'Detailed Prompts']
  },
  {
    id: 'openrouter-flux',
    name: 'Flux Pro (OpenRouter)',
    description: 'Advanced AI model for creative and detailed images',
    provider: 'openrouter',
    endpoint: 'black-forest-labs/flux-1.1-pro',
    features: ['Creative Design', 'High Detail', 'Modern Style', 'Social Media Ready']
  },
  {
    id: 'qwen-image',
    name: 'Qwen-VL Enhanced Canvas',
    description: 'AI-enhanced local generation using Qwen vision-language analysis',
    provider: 'qwen',
    endpoint: 'https://api-inference.huggingface.co/models/Qwen/Qwen2-VL-72B-Instruct',
    features: ['AI Analysis', 'Enhanced Local Generation', 'Cultural Context', 'Educational Focus']
  },
  {
    id: 'stable-diffusion',
    name: 'Stable Diffusion XL',
    description: 'Open-source model for artistic and creative images',
    provider: 'huggingface',
    endpoint: 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
    features: ['Open Source', 'Artistic Style', 'Customizable', 'Community Driven']
  }
];

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelChange }) => {
  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'local':
        return <Cpu className="w-4 h-4 text-green-600" />;
      case 'openrouter':
        return <Zap className="w-4 h-4 text-blue-600" />;
      case 'qwen':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'huggingface':
        return <Palette className="w-4 h-4 text-orange-600" />;
      default:
        return <Cpu className="w-4 h-4 text-gray-600" />;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'local':
        return 'border-green-200 bg-green-50';
      case 'openrouter':
        return 'border-blue-200 bg-blue-50';
      case 'qwen':
        return 'border-purple-200 bg-purple-50';
      case 'huggingface':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Image Generation Model</h2>
      <p className="text-gray-600 mb-6">Choose the AI model for generating your social media posts</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AVAILABLE_MODELS.map((model) => (
          <div
            key={model.id}
            className={`relative cursor-pointer transition-all duration-200 rounded-lg border-2 p-4 hover:shadow-lg ${
              selectedModel.id === model.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : `${getProviderColor(model.provider)} hover:border-gray-300`
            }`}
            onClick={() => onModelChange(model)}
          >
            {/* Selection indicator */}
            {selectedModel.id === model.id && (
              <div className="absolute top-2 right-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            )}
            
            {/* Model header */}
            <div className="flex items-center space-x-2 mb-3">
              {getProviderIcon(model.provider)}
              <h3 className="font-semibold text-gray-800">{model.name}</h3>
            </div>
            
            {/* Model description */}
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{model.description}</p>
            
            {/* Provider badge */}
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                model.provider === 'local' ? 'bg-green-100 text-green-700' :
                model.provider === 'openrouter' ? 'bg-blue-100 text-blue-700' :
                model.provider === 'qwen' ? 'bg-purple-100 text-purple-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {model.provider.toUpperCase()}
              </span>
              {model.provider === 'local' && (
                <span className="text-xs text-green-600 font-medium">FREE</span>
              )}
            </div>
            
            {/* Features */}
            <div className="space-y-1">
              {model.features.slice(0, 3).map((feature, index) => (
                <div key={index} className="flex items-center space-x-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-xs text-gray-600">{feature}</span>
                </div>
              ))}
              {model.features.length > 3 && (
                <div className="text-xs text-gray-500">+{model.features.length - 3} more features</div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Selected model info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">Selected: {selectedModel.name}</h4>
        <p className="text-sm text-gray-600 mb-2">{selectedModel.description}</p>
        <div className="flex flex-wrap gap-2">
          {selectedModel.features.map((feature, index) => (
            <span 
              key={index} 
              className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-full text-gray-700"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;
export { AVAILABLE_MODELS };