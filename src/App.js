import React, { useState, useRef } from 'react';
import { useSlipBox } from './hooks/useSlipBox';

// Views
import GlobalIndexView from './components/views/GlobalIndexView';
import FocusView from './components/views/FocusView';
import MapView from './components/views/MapView';

const App = () => {
  // --- 1. THE NERVOUS SYSTEM (Logic Hook) ---
  const { notes, addNote, deleteNote, addLink } = useSlipBox();

  // --- 2. UI STATE ---
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState(null); 
  const [viewMode, setViewMode] = useState('list'); 
  
  const textareaRef = useRef(null);

  // --- 3. EXPLICIT ROUTING ---
  
  // Derived State 
  const filteredNotes = notes.filter(n => {
    const query = searchQuery.toLowerCase();
    // If the query is a tag search (starts with #), strip it for the tag comparison
    const cleanQuery = query.startsWith('#') ? query.slice(1) : query;

    return (
      n.content.toLowerCase().includes(query) ||
      n.tags.some(t => t.toLowerCase().includes(cleanQuery))
    );
  });

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  const getLinkedNotes = (type) => {
    if (!selectedNote) return [];
    return selectedNote.links[type]
      .map(id => notes.find(n => n.id === id))
      .filter(Boolean);
  };

  // --- HANDLERS ---

  const handleGlobalSelect = (id) => {
      setSelectedNoteId(id);
      setViewMode('focus'); // Explicitly enter focus mode from list
  };

  const handleMapSelect = (id) => {
      setSelectedNoteId(id);
      // DO NOT change viewMode. Stay in map.
  };

  const handleMapClose = () => {
      // If we have a selection, go to Focus. If not, go to List.
      setViewMode(selectedNoteId ? 'focus' : 'list');
  };

  const handleAddNote = () => {
      addNote(input);
      setInput('');
      textareaRef.current?.focus();
  };

  const handleTagClick = (tag) => {
    // Prepend the '#' for visual feedback
    setSearchQuery(`#${tag}`); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-sans selection:bg-black selection:text-white relative">
      
      {/* VIEW: MAP */}
      {viewMode === 'map' && (
          <MapView 
            notes={notes} 
            activeNoteId={selectedNoteId}
            onSelectNote={handleMapSelect} 
            onClose={handleMapClose}       
          />
      )}

      {/* VIEW: GLOBAL INDEX */}
      {viewMode === 'list' && !selectedNoteId && (
          <GlobalIndexView 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            input={input}
            setInput={setInput}
            onAddNote={handleAddNote}
            textareaRef={textareaRef}
            filteredNotes={filteredNotes}
            onDeleteNote={deleteNote}
            onSelectNote={handleGlobalSelect} 
            onTagClick={handleTagClick}
          />
      )}

      {/* VIEW: FOCUS */}
      {viewMode === 'focus' && selectedNoteId && selectedNote && (
            <FocusView 
              selectedNote={selectedNote}
              allNotes={notes}
              getLinkedNotes={getLinkedNotes}
              onBack={() => {
                  setSelectedNoteId(null);
                  setViewMode('list');
              }}
              onSelectNote={(id) => setSelectedNoteId(id)} 
              onAddLink={addLink}
              onOpenMap={() => setViewMode('map')}
            />
      )}
    </div>
  );
};

export default App;