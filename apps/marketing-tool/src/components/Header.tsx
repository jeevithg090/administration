import { Palette, Sparkles } from 'lucide-react';
import { config } from '../config';
import ThemeToggle from './ThemeToggle';

const Header = () => (
  <header className="bg-linear-to-r from-blue-700 to-violet-700 text-white">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between gap-4 min-h-16 py-3">
      <a href={import.meta.env.BASE_URL} className="flex items-center gap-3 min-w-0 rounded-lg">
        <span
          className="relative inline-grid place-items-center size-10 shrink-0 rounded-xl bg-white/15"
          aria-hidden="true"
        >
          <Palette className="size-5" />
          <Sparkles className="size-3.5 absolute top-1 right-1 text-yellow-300" />
        </span>
        <span className="min-w-0">
          <span className="block text-lg sm:text-xl font-bold leading-tight truncate">
            {config.brandName}
          </span>
          <span className="block text-sm text-blue-100 leading-tight">
            Marketing Post Generator
          </span>
        </span>
      </a>
      <ThemeToggle />
    </div>
  </header>
);

export default Header;
