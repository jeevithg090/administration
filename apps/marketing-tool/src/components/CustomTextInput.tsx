import React from 'react';
import { Type } from 'lucide-react';
import { config } from '../config';

const MAX_LENGTH = 500;

interface CustomTextInputProps {
  value: string;
  onChange: (value: string) => void;
  postType: string;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({ value, onChange, postType }) => {
  const getPlaceholder = () => {
    switch (postType) {
      case 'advertisement':
        return 'Enter your advertisement message... (e.g., "Admissions open for 2024-25 batch", "Join our Engineering program")';
      case 'announcement':
        return 'Enter your announcement... (e.g., "Campus reopening announcement", "New course launch")';
      default:
        return 'Optional subtitle, e.g. "Wishing everyone light and joy". Leave empty to use the festival description.';
    }
  };

  const getLabel = () => {
    switch (postType) {
      case 'advertisement':
        return 'Advertisement Message';
      case 'announcement':
        return 'Announcement Text';
      default:
        return 'Greeting Message (optional)';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Type className="w-6 h-6 text-blue-600" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-gray-800">
          <label htmlFor="custom-text">{getLabel()}</label>
        </h2>
      </div>

      <div className="space-y-4">
        <textarea
          id="custom-text"
          maxLength={MAX_LENGTH}
          aria-describedby="custom-text-count"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={getPlaceholder()}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />

        <div className="flex justify-between items-center text-sm">
          <span id="custom-text-count" className="text-gray-500">
            {value.length}/{MAX_LENGTH} characters
          </span>
          {value.length > 450 && (
            <span className="text-orange-500">
              Keep it concise for better social media engagement
            </span>
          )}
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">Writing Tips:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            {postType === 'advertisement' && (
              <>
                <li>• Highlight unique selling points of {config.brandName}</li>
                <li>• Include a call-to-action (e.g., "Apply Now", "Learn More")</li>
                <li>• Mention specific programs or facilities</li>
              </>
            )}
            {postType === 'announcement' && (
              <>
                <li>• Be clear and direct with important information</li>
                <li>• Include dates, times, and locations if relevant</li>
                <li>• Use professional and informative tone</li>
              </>
            )}
            <li>• Keep it engaging and easy to read</li>
            <li>• Use emojis sparingly for better engagement</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CustomTextInput;
