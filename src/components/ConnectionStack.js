import React from 'react';
import { X } from 'lucide-react';

// Component to display vertical threads of related notes
const ConnectionStack = ({ title, linkedNotes, onSelectNote, onRemove }) => {
  if (linkedNotes.length === 0) return null;

  return (
    <section>
      <div className={STYLES.list}>
        {linkedNotes.map(note => (
          <div 
            key={note.id} 
            className={STYLES.itemGroup}
          >
            {/* The Note Link */}
            <div 
              onClick={() => onSelectNote(note.id)}
              className={STYLES.noteLink}
            >
              <p className={STYLES.noteText}>
                {note.content}
              </p>
            </div>

            {/* The Disconnect Button (Visible on Hover) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(note.id);
              }}
              className={STYLES.disconnectButton}
              title="Disconnect"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

const STYLES = {
  list: "flex flex-col gap-4",
  itemGroup: "group relative flex items-start gap-2 bg-white",
  noteLink: "flex-1 cursor-pointer text-sm border-l border-gray-200 pl-4 py-2 hover:border-gray-400 transition-colors",
  noteText: "text-gray-500 line-clamp-2",
  disconnectButton: "opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all"
};

export default ConnectionStack;