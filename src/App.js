import React, { useState, useEffect, useRef } from 'react';
import { useSlipBox } from './hooks/useSlipBox';

// Views
import GlobalIndexView from './components/views/GlobalIndexView';
import FocusView from './components/views/FocusView';
import MapView from './components/views/MapView';

const App = () => {
  // --- 1. THE NERVOUS SYSTEM (Logic Hook) ---
  const { notes, addNote, deleteNote, addLink } = useSlipBox();

  // --- 2. UI STATE (The "Router") ---
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState(null); 
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'focus' | 'map'
  
  const textareaRef = useRef(null);

  // --- 3. EXPLICIT ROUTING ---
  // Note: We REMOVED the useEffect that watched selectedNoteId.
  // View switching is now handled explicitly by the interaction source.

  // Derived State
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
    setSearchQuery(tag); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-sans selection:bg-black selection:text-white relative">
      
      {/* VIEW: MAP (The Topography) */}
      {viewMode === 'map' && (
          <MapView 
            notes={notes} 
            activeNoteId={selectedNoteId}
            onSelectNote={handleMapSelect} // Uses specific handler
            onClose={handleMapClose}       // Uses specific handler
          />
      )}

      {/* VIEW: GLOBAL INDEX (The Lobby) */}
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
            onSelectNote={handleGlobalSelect} // Uses specific handler
            onTagClick={handleTagClick}
          />
      )}

      {/* VIEW: FOCUS (The Thread) */}
      {viewMode === 'focus' && selectedNoteId && selectedNote && (
            <FocusView 
              selectedNote={selectedNote}
              allNotes={notes}
              getLinkedNotes={getLinkedNotes}
              onBack={() => {
                  setSelectedNoteId(null);
                  setViewMode('list');
              }}
              onSelectNote={(id) => setSelectedNoteId(id)} // Stay in Focus View
              onAddLink={addLink}
              onOpenMap={() => setViewMode('map')}
            />
      )}
    </div>
  );
};

export default App;