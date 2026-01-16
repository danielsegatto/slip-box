import React from 'react';
import ConnectionStack from './ConnectionStack';

// Component for the Narrative Thread (Focus Mode)
const FocusView = ({ selectedNote, getLinkedNotes, onBack, onSelectNote }) => {
  return (
    <main className="max-w-2xl mx-auto px-6 py-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Back button */}
      <button 
        onClick={onBack}
        className="mb-16 text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
      >
        ←
      </button>
      
      <div className="flex flex-col gap-16">
        {/* The Source / Basis */}
        <ConnectionStack 
          title="Anterior" 
          linkedNotes={getLinkedNotes('anterior')} 
          onSelectNote={onSelectNote}
        />

        {/* Current Atomic Note */}
        <article className="max-w-prose">
           <p className="text-2xl md:text-4xl border-l-2 border-black pl-8 leading-relaxed text-[#1a1a1a] font-light">
             {selectedNote.content}
           </p>
        </article>

        {/* The Extension / Branch */}
        <ConnectionStack 
          title="Posterior" 
          linkedNotes={getLinkedNotes('posterior')} 
          onSelectNote={onSelectNote}
        />
      </div>
    </main>
  );
};

export default FocusView;
