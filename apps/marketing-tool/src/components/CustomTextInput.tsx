import { Lightbulb } from 'lucide-react';
import { config } from '../config';
import type { PostTypeId } from '../types';
import Section from './Section';

const MAX_LENGTH = 500;
const SOFT_LIMIT = 450;

interface CustomTextInputProps {
  step: number;
  value: string;
  onChange: (value: string) => void;
  postType: PostTypeId;
}

const COPY: Record<PostTypeId, { title: string; description: string; placeholder: string }> = {
  advertisement: {
    title: 'Write your advertisement',
    description: 'This becomes the headline of the post.',
    placeholder: 'e.g. "Admissions open for the 2026–27 batch. Apply now!"',
  },
  announcement: {
    title: 'Write your announcement',
    description: 'This becomes the headline of the post.',
    placeholder: 'e.g. "Campus reopens on 3 June. Classes start at 9 am."',
  },
  event: {
    title: 'Add a greeting',
    description: 'Optional subtitle under the festival name. Leave empty to use its description.',
    placeholder: 'e.g. "Wishing everyone light and joy"',
  },
};

const TIPS: Record<PostTypeId, string[]> = {
  advertisement: [
    `Highlight what makes ${config.brandName} stand out`,
    'Include a call to action, such as “Apply now”',
    'Mention a specific programme or facility',
  ],
  announcement: [
    'Lead with the key information',
    'Include dates, times and places if relevant',
    'Keep the tone clear and professional',
  ],
  event: ['Keep it warm and short', 'One sentence reads best on small screens'],
};

const CustomTextInput = ({ step, value, onChange, postType }: CustomTextInputProps) => {
  const copy = COPY[postType];
  const required = postType !== 'event';
  const showRequiredHint = required && value.length > 0 && !value.trim();

  return (
    <Section
      id="custom-text"
      step={step}
      title={
        <label htmlFor="custom-text">
          {copy.title}
          {!required && <span className="ml-2 text-sm font-normal text-fg-subtle">optional</span>}
        </label>
      }
      description={copy.description}
    >
      <textarea
        id="custom-text"
        maxLength={MAX_LENGTH}
        required={required}
        aria-describedby="custom-text-count custom-text-tips"
        aria-invalid={showRequiredHint || undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={copy.placeholder}
        rows={3}
        className="input py-3 resize-y min-h-24"
      />

      <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm">
        <span className={showRequiredHint ? 'text-danger-fg font-medium' : 'text-warn-fg'}>
          {showRequiredHint
            ? 'Enter some text, not just spaces.'
            : value.length > SOFT_LIMIT
              ? 'Shorter text is easier to read on social media.'
              : ''}
        </span>
        <span id="custom-text-count" className="text-fg-subtle tabular-nums">
          {value.length}/{MAX_LENGTH}
        </span>
      </div>

      <div id="custom-text-tips" className="notice-info mt-4">
        <Lightbulb className="size-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold mb-1">Writing tips</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {TIPS[postType].map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
};

export default CustomTextInput;
