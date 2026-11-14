import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import type { Festival } from '../types';
import { indianFestivals } from '../data/festivals';

interface FestivalSelectorProps {
  selectedFestival: Festival | null;
  onSelectFestival: (festival: Festival) => void;
}

const FestivalSelector: React.FC<FestivalSelectorProps> = ({
  selectedFestival,
  onSelectFestival,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'religious', 'cultural', 'national', 'seasonal'];

  const filteredFestivals = indianFestivals.filter((festival) => {
    const matchesSearch =
      festival.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      festival.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || festival.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Select Festival</h2>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            aria-label="Search festivals"
            placeholder="Search festivals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="relative">
          <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <select
            aria-label="Filter by category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Festival Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-1">
        {filteredFestivals.map((festival) => (
          <button
            type="button"
            key={festival.id}
            aria-pressed={selectedFestival?.id === festival.id}
            onClick={() => onSelectFestival(festival)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-lg text-left ${
              selectedFestival?.id === festival.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg text-gray-800">{festival.name}</h3>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  festival.category === 'religious'
                    ? 'bg-purple-100 text-purple-700'
                    : festival.category === 'cultural'
                      ? 'bg-green-100 text-green-700'
                      : festival.category === 'national'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                }`}
              >
                {festival.category}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-3">{festival.description}</p>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{festival.date}</span>
              <div className="flex space-x-1">
                {festival.colors.slice(0, 3).map((color, index) => (
                  <span
                    aria-hidden="true"
                    key={index}
                    className="block w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      {filteredFestivals.length === 0 && (
        <div className="text-center py-8 text-gray-500" role="status">
          No festivals found matching your criteria.
        </div>
      )}
    </div>
  );
};

export default FestivalSelector;
