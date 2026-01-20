import { useState, useEffect } from 'react';

const STORAGE_KEY = 'slip-box-atoms';

export const useSlipBox = () => {
  const [notes, setNotes] = useState([]);

  // 1. Sync with LocalStorage (Load)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setNotes(JSON.parse(saved));
  }, []);

  // 2. Sync with LocalStorage (Save)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  // 3. Logic: Extract Tags
  const extractTags = (text) => {
    const regex = /#(\w+)/g;
    const matches = text.match(regex);
    return matches ? matches.map(m => m.slice(1)) : [];
  };

  // 4. Action: Add Note
  const addNote = (content) => {
    if (!content.trim()) return;
    const newNote = {
      id: Date.now().toString(),
      content: content.trim(),
      timestamp: new Date().toISOString(),
      tags: extractTags(content),
      links: { anterior: [], posterior: [] }
    };
    setNotes(prev => [newNote, ...prev]);
  };

  // 5. Action: Delete Note
  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  // 6. Action: The Synapse (Link Notes)
  const addLink = (sourceId, targetId, type) => {
    setNotes(prevNotes => prevNotes.map(note => {
      // Update the Source Note
      if (note.id === sourceId) {
        return { 
          ...note, 
          links: { 
            ...note.links, 
            [type]: [...new Set([...note.links[type], targetId])] 
          } 
        };
      }
      // Update the Target Note (Inverse Link)
      if (note.id === targetId) {
        const inverseType = type === 'anterior' ? 'posterior' : 'anterior';
        return { 
          ...note, 
          links: { 
            ...note.links, 
            [inverseType]: [...new Set([...note.links[inverseType], sourceId])] 
          } 
        };
      }
      return note;
    }));
  };

  return {
    notes,
    addNote,
    deleteNote,
    addLink
  };
};
