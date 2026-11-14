import { useState } from 'react';
import { Check, Filter, Search, SearchX } from 'lucide-react';
import type { Festival, FestivalCategory } from '../types';
import { indianFestivals } from '../data/festivals';
import Section from './Section';

interface FestivalSelectorProps {
  selectedFestival: Festival | null;
  onSelectFestival: (festival: Festival) => void;
}

const CATEGORIES = ['all', 'religious', 'cultural', 'national', 'seasonal'] as const;

const CATEGORY_STYLES: Record<FestivalCategory, string> = {
  religious: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200',
  cultural: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200',
  national: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200',
  seasonal: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200',
};

const FestivalSelector = ({ selectedFestival, onSelectFestival }: FestivalSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<(typeof CATEGORIES)[number]>('all');

  const term = searchTerm.trim().toLowerCase();
  const filteredFestivals = indianFestivals.filter((festival) => {
    const matchesSearch =
      festival.name.toLowerCase().includes(term) ||
      festival.description.toLowerCase().includes(term);
    const matchesCategory = selectedCategory === 'all' || festival.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
  };

  return (
    <Section
      id="festival"
      step={2}
      title="Pick a festival"
      description="Colours, motifs and wording are tailored to the occasion."
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            className="size-5 absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search festivals"
            placeholder="Search festivals…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="relative sm:w-56">
          <Filter
            className="size-5 absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none"
            aria-hidden="true"
          />
          <select
            aria-label="Filter by category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as (typeof CATEGORIES)[number])}
            className="input pl-10 pr-8"
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category === 'all'
                  ? 'All categories'
                  : category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {filteredFestivals.length} festival{filteredFestivals.length === 1 ? '' : 's'} shown
      </p>

      {filteredFestivals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[26rem] overflow-y-auto p-1 -m-1">
          {filteredFestivals.map((festival) => {
            const selected = selectedFestival?.id === festival.id;
            return (
              <button
                type="button"
                key={festival.id}
                aria-pressed={selected}
                onClick={() => onSelectFestival(festival)}
                className="option flex flex-col"
              >
                <span className="flex items-start justify-between gap-2 mb-1.5 pr-7">
                  <span className="font-semibold text-fg">{festival.name}</span>
                  <span className={`chip capitalize ${CATEGORY_STYLES[festival.category]}`}>
                    {festival.category}
                  </span>
                </span>
                {selected && (
                  <span className="check-dot" aria-hidden="true">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                )}
                <span className="text-sm text-fg-muted mb-3">{festival.description}</span>
                <span className="mt-auto flex items-center justify-between gap-2">
                  <span className="text-xs text-fg-subtle">{festival.date}</span>
                  <span className="flex -space-x-1" aria-hidden="true">
                    {festival.colors.slice(0, 3).map((color, index) => (
                      <span
                        key={index}
                        className="block size-4 rounded-full ring-2 ring-surface"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center text-center gap-2 py-10 rounded-xl border-2 border-dashed border-line">
          <SearchX className="size-8 text-fg-subtle" aria-hidden="true" />
          <p className="font-medium">No festivals match your search</p>
          <button type="button" onClick={clearFilters} className="btn-ghost text-brand-fg">
            Clear search and filters
          </button>
        </div>
      )}
    </Section>
  );
};

export default FestivalSelector;
