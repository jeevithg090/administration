import React from 'react';
import { Calendar, Megaphone, Bell } from 'lucide-react';
import type { PostType } from '../types';

interface PostTypeSelectorProps {
  selectedType: string | null;
  onSelectType: (type: string) => void;
}

const postTypes: PostType[] = [
  { 
    id: 'event', 
    name: 'Event Post', 
    description: 'Celebrate festivals and special occasions' 
  },
  { 
    id: 'advertisement', 
    name: 'Advertisement', 
    description: 'Promote university programs and offerings' 
  },
  { 
    id: 'announcement', 
    name: 'Announcement', 
    description: 'Share important university news and updates' 
  }
];

const getIcon = (typeId: string) => {
  switch (typeId) {
    case 'event':
      return <Calendar className="w-6 h-6" />;
    case 'advertisement':
      return <Megaphone className="w-6 h-6" />;
    case 'announcement':
      return <Bell className="w-6 h-6" />;
    default:
      return <Calendar className="w-6 h-6" />;
  }
};

const PostTypeSelector: React.FC<PostTypeSelectorProps> = ({ selectedType, onSelectType }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Choose Post Type</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {postTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onSelectType(type.id)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${
              selectedType === type.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className={`p-3 rounded-full ${
                selectedType === type.id ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                {getIcon(type.id)}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{type.name}</h3>
                <p className="text-sm opacity-75">{type.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PostTypeSelector;