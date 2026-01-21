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

  // ... (Impulse handling same as before) ...
  const handleImpulseAdd = () => {
     if (!impulse.trim()) return;
     addNote(impulse);
     setImpulse('');
  };

  // ... (Link helper same as before) ...
  const getLinkedNotes = (type) => {
    const activeNote = notes.find(n => n.id === activeNoteId);
    if (!activeNote || !activeNote.links[type]) return [];
    return activeNote.links[type].map(linkId => notes.find(n => n.id === linkId)).filter(Boolean);
  };

  const activeNote = notes.find(n => n.id === activeNoteId);

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-[#1a1a1a]">
      {view === 'map' && (
        <MapView 
            notes={notes} 
            activeNoteId={activeNoteId}
            onSelectNote={(id) => { setActiveNoteId(id); setView('focus'); }}
            onClose={() => setView('focus')}
        />
      )}

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
          onAddNote={addNote} // PASSED PROP HERE
        />
      )}
    </div>
  );
};

export default App;