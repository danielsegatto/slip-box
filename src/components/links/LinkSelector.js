import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

const LinkSelector = ({ notes, onClose, onSelect, onCreate }) => {
  const [search, setSearch] = useState('');

  const filtered = notes.filter(n => 
    n.content.toLowerCase().includes(search.toLowerCase()) ||
    n.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={STYLES.overlay}>
      <div className={STYLES.header}>
        <button onClick={onClose} className={STYLES.closeButton}>
          <X size={24} className="text-gray-400" />
        </button>
        <input
          autoFocus
          className={STYLES.input}
          placeholder="Search or Create..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      
      <div className={STYLES.listContainer}>
        {/* CREATE OPTION */}
        {search.trim() && (
            <button 
                onClick={() => onCreate(search)}
                className={STYLES.createButton}
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
            className={STYLES.noteItem}
          >
            <p className={STYLES.noteText}>
              {note.content}
            </p>
          </button>
        ))}
        
        {filtered.length === 0 && !search.trim() && (
            <p className={STYLES.emptyState}>Type to search or create...</p>
        )}
      </div>
    </div>
  );
};

const STYLES = {
  overlay: "fixed inset-0 bg-[#fafafa] z-50 flex flex-col",
  header: "p-4 border-b border-gray-100 flex items-center gap-4",
  closeButton: "p-2 -ml-2",
  input: "flex-1 text-xl bg-transparent outline-none placeholder:text-gray-300",
  listContainer: "flex-1 overflow-y-auto p-4",
  createButton: "w-full text-left p-4 mb-4 bg-black text-white rounded-lg flex items-center gap-3 active:scale-95 transition-transform",
  noteItem: "w-full text-left p-4 mb-4 bg-white border border-gray-100 rounded-lg active:bg-gray-50 transition-colors shadow-sm",
  noteText: "text-sm text-gray-800 line-clamp-3 leading-relaxed",
  emptyState: "text-center text-gray-300 mt-10"
};

export default LinkSelector;