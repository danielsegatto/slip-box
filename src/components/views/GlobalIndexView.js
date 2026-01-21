import React from 'react';
import SearchBar from '../inputs/SearchBar'; // Changed path
import ImpulseCapture from '../inputs/ImpulseCapture'; // Changed path
import NoteList from '../notes/NoteList'; // Changed path

const GlobalIndexView = ({ 
  notes, 
  searchQuery, 
  setSearchQuery, 
  impulse, 
  setImpulse, 
  onAddImpulse, 
  onSelectNote, 
  deleteNote 
}) => {
  return (
    <>
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <main className="max-w-2xl mx-auto px-4">
         <ImpulseCapture 
            input={impulse} 
            setInput={setImpulse} 
            addNote={onAddImpulse} 
         />
         <NoteList 
            notes={notes.filter(n => n.content.toLowerCase().includes(searchQuery.toLowerCase()))} 
            onSelect={onSelectNote}
            deleteNote={deleteNote}
            onTagClick={setSearchQuery}
         />
      </main>
    </>
  );
};

export default GlobalIndexView;