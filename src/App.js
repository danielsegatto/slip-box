import React, { useState } from 'react';
import useSlipBox from './hooks/useSlipBox';
import ImpulseCapture from './components/ImpulseCapture';
import SearchBar from './components/SearchBar';
import NoteList from './components/NoteList';
import FocusView from './components/views/FocusView';
import MapView from './components/views/MapView';

const App = () => {
  const { notes, addNote, updateNote, deleteNote, addLink, removeLink } = useSlipBox();
  const [view, setView] = useState('index'); 
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [impulse, setImpulse] = useState('');

  // --- IMPULSE HANDLER ---
  const handleImpulseAdd = () => {
     if (!impulse.trim()) return;
     addNote(impulse);
     setImpulse('');
  };

  // --- LINK HELPER ---
  const getLinkedNotes = (type) => {
    const activeNote = notes.find(n => n.id === activeNoteId);
    if (!activeNote || !activeNote.links[type]) return [];
    return activeNote.links[type].map(linkId => notes.find(n => n.id === linkId)).filter(Boolean);
  };

  const activeNote = notes.find(n => n.id === activeNoteId);

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-[#1a1a1a]">
      
      {/* MAP VIEW OVERLAY */}
      {view === 'map' && (
        <MapView 
            notes={notes} 
            activeNoteId={activeNoteId}
            // CHANGED: Only update the ID, do not change the View.
            // This allows the user to traverse the graph node-by-node.
            // To "land" on the note, the user simply closes the map.
            onSelectNote={(id) => setActiveNoteId(id)}
            onClose={() => setView('focus')}
        />
      )}

      {/* INDEX VIEW (Search & List) */}
      {view === 'index' && (
        <>
          <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <main className="max-w-2xl mx-auto px-4">
             <ImpulseCapture 
                input={impulse} 
                setInput={setImpulse} 
                addNote={handleImpulseAdd} 
             />
             <NoteList 
                notes={notes.filter(n => n.content.toLowerCase().includes(searchQuery.toLowerCase()))} 
                onSelect={(id) => { setActiveNoteId(id); setView('focus'); }}
                deleteNote={deleteNote}
                onTagClick={setSearchQuery}
             />
          </main>
        </>
      )}

      {/* FOCUS VIEW (Deep Work & Linking) */}
      {view === 'focus' && activeNote && (
        <FocusView 
          selectedNote={activeNote}
          allNotes={notes}
          getLinkedNotes={getLinkedNotes}
          onBack={() => setView('index')}
          onSelectNote={setActiveNoteId}
          onUpdateNote={updateNote}
          onAddLink={addLink}
          onRemoveLink={removeLink}
          onOpenMap={() => setView('map')}
          onAddNote={addNote} 
        />
      )}
    </div>
  );
};

export default App;