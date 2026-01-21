import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

const LinkSelector = ({ notes, onClose, onSelect, onCreate }) => {
  const [search, setSearch] = useState('');

  const filtered = notes.filter(n => 
    n.content.toLowerCase().includes(search.toLowerCase()) ||
    n.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-[#fafafa] z-50 flex flex-col">
      <div className="p-4 border-b border-gray-100 flex items-center gap-4">
        <button onClick={onClose} className="p-2 -ml-2">
          <X size={24} className="text-gray-400" />
        </button>
        <input
          autoFocus
          className="flex-1 text-xl bg-transparent outline-none placeholder:text-gray-300"
          placeholder="Search or Create..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {/* CREATE OPTION - Only shows if there is text */}
        {search.trim() && (
            <button 
                onClick={() => onCreate(search)}
                className="w-full text-left p-4 mb-4 bg-black text-white rounded-lg flex items-center gap-3 active:scale-95 transition-transform"
            >
                <Plus size={20} />
                <span className="font-medium truncate">Create "{search}"</span>
            </button>
        )}

        {/* EXISTING NOTES */}
        {filtered.map(note => (
          <button
            key={note.id}
            onClick={() => onSelect(note.id)}
            className="w-full text-left p-4 mb-4 bg-white border border-gray-100 rounded-lg active:bg-gray-50 transition-colors shadow-sm"
          >
            <p className="text-sm text-gray-800 line-clamp-3 leading-relaxed">
              {note.content}
            </p>
          </button>
        ))}
        
        {filtered.length === 0 && !search.trim() && (
            <p className="text-center text-gray-300 mt-10">Type to search or create...</p>
        )}
      </div>
    </div>
  );
};

export default LinkSelector;