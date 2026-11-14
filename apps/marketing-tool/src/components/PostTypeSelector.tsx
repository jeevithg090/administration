import { Bell, Calendar, Check, Megaphone } from 'lucide-react';
import { postTypes } from '../data/festivals';
import type { PostTypeId } from '../types';
import Section from './Section';

interface PostTypeSelectorProps {
  selectedType: PostTypeId | null;
  onSelectType: (type: PostTypeId) => void;
}

const ICONS: Record<PostTypeId, typeof Calendar> = {
  event: Calendar,
  advertisement: Megaphone,
  announcement: Bell,
};

const PostTypeSelector = ({ selectedType, onSelectType }: PostTypeSelectorProps) => (
  <Section
    id="post-type"
    step={1}
    title="Choose a post type"
    description="What are you posting about?"
  >
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {postTypes.map((type) => {
        const Icon = ICONS[type.id];
        const selected = selectedType === type.id;
        return (
          <button
            type="button"
            key={type.id}
            aria-pressed={selected}
            onClick={() => onSelectType(type.id)}
            className="option flex sm:flex-col items-center sm:items-start gap-3"
          >
            {selected && (
              <span className="check-dot" aria-hidden="true">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
            )}
            <span className="option-icon" aria-hidden="true">
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 pr-6 sm:pr-0">
              <span className="block font-semibold text-fg">{type.name}</span>
              <span className="block text-sm text-fg-muted">{type.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  </Section>
);

export default PostTypeSelector;
