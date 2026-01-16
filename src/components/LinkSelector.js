import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

const LinkSelector = ({ notes, onClose, onSelect }) => {
  const [query, setQuery] = useState('');

  // Filter notes based on the search query
  const filtered = notes.filter(n => 
    n.content.toLowerCase().includes(query.toLowerCase()) || 
    n.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-[#fafafa]/95 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-gray-100 shadow-xl rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-50">
          <Search size={18} className="text-gray-400" />
          <input 
            autoFocus
            type="text"
            placeholder="Search for a thought to connect..."
            className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder:text-gray-300"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="text-gray-300 hover:text-black">
            <X size={18} />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-300 italic text-sm">
              No matching thoughts found.
            </div>
          ) : (
            filtered.map(note => (
              <button
                key={note.id}
                onClick={() => onSelect(note.id)}
                className="w-full text-left p-4 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors group"
              >
                <p className="text-sm text-gray-600 group-hover:text-black line-clamp-2">
                  {note.content}
                </p>
                <div className="flex gap-2 mt-2">
                   {note.tags.map(t => (
                     <span key={t} className="text-[10px] text-gray-300 group-hover:text-gray-500">#{t}</span>
                   ))}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LinkSelector;
