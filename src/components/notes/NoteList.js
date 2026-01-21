import React from 'react';
import NoteItem from './NoteItem'; // Changed from './NoteItem' to './NoteItem' (same dir)

const NoteList = ({ notes, deleteNote, onSelect, onTagClick }) => {
  if (notes.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <p>...</p>
      </div>
    );
  }

  return (
    <section className="pb-20">
      {notes.map(note => (
        <NoteItem 
          key={note.id} 
          note={note} 
          deleteNote={deleteNote} 
          onSelect={() => onSelect(note.id)}
          onTagClick={onTagClick}
        />
      ))}
    </section>
  );
};

export default NoteList;