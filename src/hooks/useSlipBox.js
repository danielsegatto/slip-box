import { useState, useEffect } from 'react';
import { extractTags } from '../utils/textProcessor';

const useSlipBox = () => {
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('slip-box-notes');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('slip-box-notes', JSON.stringify(notes));
  }, [notes]);

  const addNote = (content = '') => {
    const newNote = {
      id: Date.now().toString(),
      content: content,
      timestamp: Date.now(),
      tags: extractTags(content),
      links: { anterior: [], posterior: [] }
    };
    setNotes(prev => [newNote, ...prev]);
    return newNote; // CHANGED: Return the note so we can use its ID immediately
  };

  const updateNote = (id, newContent) => {
    setNotes(prev => prev.map(note => 
      note.id === id 
        ? { ...note, content: newContent, tags: extractTags(newContent) }
        : note
    ));
  };

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id).map(note => ({
      ...note,
      links: {
        anterior: note.links.anterior.filter(l => l !== id),
        posterior: note.links.posterior.filter(l => l !== id)
      }
    })));
  };

  const addLink = (sourceId, targetId, type) => {
    setNotes(prev => prev.map(note => {
      if (note.id === sourceId) {
        return {
          ...note,
          links: { ...note.links, [type]: [...note.links[type], targetId] }
        };
      }
      if (note.id === targetId) {
        const reverseType = type === 'anterior' ? 'posterior' : 'anterior';
        return {
          ...note,
          links: { ...note.links, [reverseType]: [...note.links[reverseType], sourceId] }
        };
      }
      return note;
    }));
  };

  const removeLink = (sourceId, targetId, type) => {
      setNotes(prev => prev.map(note => {
          if (note.id === sourceId) {
              return {
                  ...note,
                  links: { ...note.links, [type]: note.links[type].filter(id => id !== targetId) }
              };
          }
          if (note.id === targetId) {
              const reverseType = type === 'anterior' ? 'posterior' : 'anterior';
              return {
                  ...note,
                  links: { ...note.links, [reverseType]: note.links[reverseType].filter(id => id !== sourceId) }
              };
          }
          return note;
      }));
  };

  return { 
    notes, 
    addNote, 
    updateNote, 
    deleteNote, 
    addLink,
    removeLink 
  };
};

export default useSlipBox;