import React, { useState, useEffect, useRef } from 'react';
import { useSlipBox } from './hooks/useSlipBox'; // New Import
import SearchBar from './components/SearchBar';
import ImpulseCapture from './components/ImpulseCapture';
import NoteList from './components/NoteList';
import FocusView from './components/FocusView';
import MapView from './components/MapView';

const App = () => {
  // --- LOGIC LAYER (The Hook) ---
  const { notes, addNote, deleteNote, addLink } = useSlipBox();

  // --- UI STATE LAYER ---
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState(null); 
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'focus' | 'map'
  const textareaRef = useRef(null);

  // Handle View State Transitions
  useEffect(() => {
    if (selectedNoteId) {
        setViewMode('focus');
    } else {
        setViewMode('list');
    }
  }, [selectedNoteId]);

  // Handle Note Creation Wrapper
  const handleAddNote = () => {
      addNote(input);
      setInput('');
      textareaRef.current?.focus();
  };

  const handleDeleteNote = (id) => {
      deleteNote(id);
      if (selectedNoteId === id) setSelectedNoteId(null);
  }

  // Discovery Logic (Filtering)
  const filteredNotes = notes.filter(n => 
    n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  const getLinkedNotes = (type) => {
    if (!selectedNote) return [];
    return selectedNote.links[type]
      .map(id => notes.find(n => n.id === id))
      .filter(Boolean);
  };

  const handleTagClick = (tag) => {
    setSearchQuery(tag); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-sans selection:bg-black selection:text-white relative">
      
      {/* MAP VIEW OVERLAY */}
      {viewMode === 'map' && (
          <MapView 
            notes={notes} 
            activeNoteId={selectedNoteId}
            onSelectNote={(id) => setSelectedNoteId(id)}
            onClose={() => setViewMode(selectedNoteId ? 'focus' : 'list')}
          />
      )}

      {/* MAIN VIEW */}
      {viewMode !== 'map' && (
          !selectedNoteId ? (
            <>
              <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
              <main className="max-w-2xl mx-auto px-6 pb-24">
                <ImpulseCapture 
                  input={input} 
                  setInput={setInput} 
                  addNote={handleAddNote} 
                  textareaRef={textareaRef} 
                />
                <NoteList 
                  notes={filteredNotes} 
                  onDelete={handleDeleteNote} 
                  onSelect={setSelectedNoteId}
                  onTagClick={handleTagClick}
                />
              </main>
            </>
          ) : (
            <FocusView 
              selectedNote={selectedNote}
              allNotes={notes}
              getLinkedNotes={getLinkedNotes}
              onBack={() => setSelectedNoteId(null)}
              onSelectNote={(id) => setSelectedNoteId(id)}
              onAddLink={addLink}
              onOpenMap={() => setViewMode('map')}
            />
          )
      )}
    </div>
  );
};

export default App;
