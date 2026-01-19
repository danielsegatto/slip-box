import React from 'react';
import NoteItem from './NoteItem';

const NoteList = ({ notes, onDelete, onSelect }) => {
  if (notes.length === 0) {
    return (
      <div className="text-center py-20 text-gray-300 italic">
        The slip-box is quiet.
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {notes.map((note) => (
        <NoteItem 
          key={note.id} 
          note={note} 
          deleteNote={onDelete} 
          onSelect={() => onSelect(note.id)} 
        />
      ))}
    </div>
  );
};

export default NoteList;
