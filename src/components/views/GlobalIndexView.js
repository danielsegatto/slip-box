import React from 'react';
import SearchBar from '../SearchBar';
import ImpulseCapture from '../ImpulseCapture';
import NoteList from '../NoteList';

const GlobalIndexView = ({ 
  // Search State
  searchQuery, 
  setSearchQuery, 
  // Capture State
  input, 
  setInput, 
  onAddNote, 
  textareaRef, 
  // List Data & Actions
  filteredNotes, 
  onDeleteNote, 
  onSelectNote,
  onTagClick
}) => {
  return (
    <>
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <main className="max-w-2xl mx-auto px-6 pb-24">
        <ImpulseCapture 
          input={input} 
          setInput={setInput} 
          addNote={onAddNote} 
          textareaRef={textareaRef} 
        />
        <NoteList 
          notes={filteredNotes} 
          onDelete={onDeleteNote} 
          onSelect={onSelectNote}
          onTagClick={onTagClick}
        />
      </main>
    </>
  );
};

export default GlobalIndexView;
