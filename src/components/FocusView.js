import React, { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import ConnectionStack from './ConnectionStack';
import LinkSelector from './LinkSelector';

const FocusView = ({ selectedNote, allNotes, getLinkedNotes, onBack, onSelectNote, onAddLink }) => {
  const [linkingType, setLinkingType] = useState(null); // 'anterior' | 'posterior' | null

  // SMART FILTERING LOGIC:
  // 1. Remove the note itself.
  // 2. Remove notes that are ALREADY connected in the current direction.
  const linkableNotes = allNotes.filter(n => {
    const isSelf = n.id === selectedNote.id;
    const isAlreadyConnected = linkingType && selectedNote.links[linkingType].includes(n.id);
    return !isSelf && !isAlreadyConnected;
  });

  const handleLinkSelection = (targetId) => {
    onAddLink(targetId, linkingType);
    setLinkingType(null);
  };

  return (
    <>
      {linkingType && (
        <LinkSelector 
          notes={linkableNotes} 
          onClose={() => setLinkingType(null)} 
          onSelect={handleLinkSelection} 
        />
      )}

      <main className="max-w-2xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Navigation: Text-less Back Button */}
        <button 
          onClick={onBack}
          className="fixed top-8 left-6 md:left-auto md:relative md:top-auto md:mb-16 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex flex-col gap-6 relative">
          
          {/* ANTERIOR SECTION (Source) */}
          <div className="flex flex-col">
            <ConnectionStack 
              title="Anterior" 
              linkedNotes={getLinkedNotes('anterior')} 
              onSelectNote={onSelectNote}
            />
            {/* Abstract Control: Up Arrow for "Add Source" */}
            <button 
              onClick={() => setLinkingType('anterior')}
              className="p-2 text-gray-200 hover:text-black hover:bg-gray-50 rounded-full transition-all"
            >
              <Plus size={24} />
            </button>
          </div>

          {/* CURRENT NOTE (The Anchor) */}
          <article className="max-w-prose py-4 border-y border-transparent">
             <p className="text-2xl md:text-4xl leading-relaxed text-[#1a1a1a] font-light">
               {selectedNote.content}
             </p>
          </article>

          {/* POSTERIOR SECTION (Extension) */}
          <div className="flex flex-col">
             {/* Abstract Control: Down Arrow for "Add Extension" */}
            <button 
              onClick={() => setLinkingType('posterior')}
              className="p-2 text-gray-200 hover:text-black hover:bg-gray-50 rounded-full transition-all"
            >
              <Plus size={24} />
            </button>
            <ConnectionStack 
              title="Posterior" 
              linkedNotes={getLinkedNotes('posterior')} 
              onSelectNote={onSelectNote}
            />
          </div>

        </div>
      </main>
    </>
  );
};

export default FocusView;
