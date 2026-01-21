import React, { useState } from 'react';
import { ArrowLeft, Plus, Map } from 'lucide-react'; 
import ConnectionStack from '../links/ConnectionStack';
import LinkSelector from '../links/LinkSelector';
import AutoResizingTextarea from '../inputs/AutoResizingTextarea'; 

const FocusView = ({ 
  selectedNote, allNotes, getLinkedNotes, onBack, onSelectNote, 
  onUpdateNote, onAddLink, onRemoveLink, onOpenMap, onAddNote 
}) => {
  const [linkingType, setLinkingType] = useState(null); 

  // --- LINKING LOGIC ---
  const linkableNotes = allNotes.filter(n => {
    if (!selectedNote) return false;
    const isSelf = n.id === selectedNote.id;
    const currentLinks = selectedNote.links?.[linkingType] || []; 
    const isAlreadyConnected = linkingType && currentLinks.includes(n.id);
    return !isSelf && !isAlreadyConnected;
  });

  const handleLinkSelection = (targetId) => {
    onAddLink(selectedNote.id, targetId, linkingType); 
    setLinkingType(null);
  };

  const handleCreateAndLink = (content) => {
      const newNote = onAddNote(content); 
      onAddLink(selectedNote.id, newNote.id, linkingType); 
      setLinkingType(null); 
  };

  // --- COUNTER LOGIC ---
  const antCount = selectedNote.links?.anterior?.length || 0;
  const postCount = selectedNote.links?.posterior?.length || 0;
  const showCounter = antCount > 0 || postCount > 0;

  if (!selectedNote) return null;

  return (
    <>
      {linkingType && (
        <LinkSelector 
          notes={linkableNotes} 
          onClose={() => setLinkingType(null)} 
          onSelect={handleLinkSelection}
          onCreate={handleCreateAndLink} 
        />
      )}

      <main className={STYLES.container}>
        
        {/* HEADER */}
        <div className={STYLES.header}>
            <button onClick={onBack} className={STYLES.navButton}>
                <ArrowLeft size={28} className="text-black" />
            </button>
            <button onClick={onOpenMap} className={STYLES.navButton}>
                <Map size={28} className="text-black" />
            </button>
        </div>
        
        <div className={STYLES.threadContainer}>
          
          {/* ANTERIOR */}
          <div className={STYLES.connectionGroup}>
            <ConnectionStack 
              title="Anterior" 
              linkedNotes={getLinkedNotes('anterior')} 
              onSelectNote={onSelectNote}
              onRemove={(targetId) => onRemoveLink(selectedNote.id, targetId, 'anterior')}
            />
            <button 
              onClick={() => setLinkingType('anterior')}
              className={STYLES.addButton}
            >
              <Plus size={28} />
            </button>
          </div>

          {/* CURRENT NOTE (EDITABLE) */}
          <article className={STYLES.activeNoteContainer}>
             <AutoResizingTextarea
               value={selectedNote.content}
               onChange={(e) => onUpdateNote(selectedNote.id, e.target.value)}
               className={STYLES.textarea}
             />
             
             {/* CONNECTION COUNTER */}
             {showCounter && (
                <div className={STYLES.counter}>
                  {antCount > 0 && <span>{antCount} [</span>}
                  {antCount > 0 && postCount > 0 && <span>&nbsp;</span>}
                  {postCount > 0 && <span>] {postCount}</span>}
                </div>
             )}
          </article>

          {/* POSTERIOR */}
          <div className={STYLES.connectionGroup}>
            <button 
              onClick={() => setLinkingType('posterior')}
              className={STYLES.addButton}
            >
              <Plus size={28} />
            </button>
            <ConnectionStack 
              title="Posterior" 
              linkedNotes={getLinkedNotes('posterior')} 
              onSelectNote={onSelectNote}
              onRemove={(targetId) => onRemoveLink(selectedNote.id, targetId, 'posterior')}
            />
          </div>

        </div>
      </main>
    </>
  );
};

const STYLES = {
  container: "max-w-2xl mx-auto px-5 py-4 min-h-screen flex flex-col",
  header: "flex justify-between items-center mb-6",
  navButton: "p-3 -ml-3 rounded-full active:bg-gray-100 transition-colors",
  threadContainer: "flex flex-col gap-2 relative flex-1",
  connectionGroup: "flex flex-col gap-2",
  addButton: "text-gray-300 hover:text-black self-center transition-colors",
  // CHANGED: Added relative positioning to contain the counter
  activeNoteContainer: "relative border-y border-gray-100",
  textarea: "w-full text-2xl leading-relaxed text-[#1a1a1a] font-light resize-none bg-white outline-none overflow-hidden p-2 pb-8", // Added pb-8 for counter space
  // NEW STYLE
  counter: "p-2 absolute bottom-2 right-2 text-xs font-mono text-gray-300 tracking-widest pointer-events-none bg-white/80 px-1 rounded"
};

export default FocusView;