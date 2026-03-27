import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../utils/constants';
import { SearchIcon } from '../../../icons/NavIcons';

export default function SidebarSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  return (
    <div className="px-3 py-2.5">
      <div className="flex items-center gap-2.5 bg-elevated rounded-lg px-3.5 py-2.5">
        <SearchIcon />
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim())
              navigate(`${ROUTES.EXPLORE}?q=${encodeURIComponent(query)}`);
          }}
          className="bg-transparent border-none outline-none text-white text-sm font-body w-full placeholder:text-text-faint"
        />
      </div>
    </div>
  );
}