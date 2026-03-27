import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { INDIAN_CITIES, cityMatchesSearch, normalizeCityName } from '../constants/cities';

const CityDropdown = ({ value, onChange, placeholder = 'Select city', className = '', darkBg = 'bg-zinc-800' }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  // Normalize incoming value to canonical name for display
  const displayValue = normalizeCityName(value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const filtered = INDIAN_CITIES.filter(c => cityMatchesSearch(c, search));

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div
        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-gray-700 text-sm cursor-pointer flex items-center justify-between"
        onClick={() => setOpen(!open)}
      >
        <span className={displayValue ? 'text-white' : 'text-gray-500'}>
          {displayValue || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className={`absolute z-50 mt-1 w-full rounded-lg ${darkBg} border border-gray-700 shadow-xl max-h-60 overflow-hidden`}>
          <div className="p-2 border-b border-gray-700">
            <input
              type="text"
              placeholder="Search city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-3 py-2 rounded-md bg-white/5 border border-gray-600 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.map(c => (
              <div
                key={c.value}
                onClick={() => {
                  onChange(c.value);
                  setSearch('');
                  setOpen(false);
                }}
                className={`px-4 py-2.5 cursor-pointer text-sm transition-colors hover:bg-white/10 ${
                  displayValue === c.value ? 'bg-purple-500/20 text-white' : 'text-gray-300'
                }`}
              >
                {c.value}
                {c.aliases && (
                  <span className="text-gray-500 text-xs ml-1">({c.aliases.join(', ')})</span>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="px-4 py-3 text-gray-500 text-sm text-center">No cities found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CityDropdown;
