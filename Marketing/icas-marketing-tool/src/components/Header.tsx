import React from 'react';
import { Palette, Sparkles } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 px-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Palette className="w-8 h-8" />
            <Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-yellow-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">ICAS Manipal</h1>
            <p className="text-blue-100 text-sm">Marketing Post Generator</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;