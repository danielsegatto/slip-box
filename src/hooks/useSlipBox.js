import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  query, 
  where, 
  writeBatch, 
  getDocs,
  arrayUnion,
  arrayRemove,
  setDoc
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { extractTags } from '../utils/textProcessor';

// NEW: Accept 'uid' to scope data to the user
const useSlipBox = (uid) => {
  const [notes, setNotes] = useState([]);

  // 1. SYNC: Real-time listener (User Scoped)
  useEffect(() => {
    if (!uid) {
      setNotes([]); // Clear notes if no user
      return;
    }

    // CHANGED: Added 'where("uid", "==", uid)' clause
    const q = query(collection(db, "notes"), where("uid", "==", uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotes(notesData.sort((a, b) => b.timestamp - a.timestamp));
    });

    return () => unsubscribe();
  }, [uid]); // Re-run if user changes

  // 2. CREATE: Add 'uid' field to new notes
  const addNote = (content = '') => {
    if (!uid) return; // Guard clause

    const newNoteRef = doc(collection(db, "notes"));
    
    const newNote = {
      id: newNoteRef.id,
      uid: uid, // NEW: Ownership field
      content: content,
      timestamp: Date.now(),
      tags: extractTags(content),
      links: { anterior: [], posterior: [] }
    };

    setDoc(newNoteRef, newNote).catch(console.error);
    return newNote; 
  };

  const updateNote = async (id, newContent) => {
    const noteRef = doc(db, "notes", id);
    await updateDoc(noteRef, {
      content: newContent,
      tags: extractTags(newContent)
    });
  };

  const deleteNote = async (id) => {
    const batch = writeBatch(db);
    const noteRef = doc(db, "notes", id);

    batch.delete(noteRef);

    // Ensure we only clean up links in OUR notes (though IDs are unique anyway)
    const antQuery = query(collection(db, "notes"), where("uid", "==", uid), where("links.anterior", "array-contains", id));
    const antSnap = await getDocs(antQuery);
    antSnap.forEach(doc => {
      batch.update(doc.ref, { "links.anterior": arrayRemove(id) });
    });

    const postQuery = query(collection(db, "notes"), where("uid", "==", uid), where("links.posterior", "array-contains", id));
    const postSnap = await getDocs(postQuery);
    postSnap.forEach(doc => {
      batch.update(doc.ref, { "links.posterior": arrayRemove(id) });
    });

    await batch.commit();
  };

  const addLink = async (sourceId, targetId, type) => {
    const batch = writeBatch(db);
    const sourceRef = doc(db, "notes", sourceId);
    const targetRef = doc(db, "notes", targetId);
    const reverseType = type === 'anterior' ? 'posterior' : 'anterior';

    batch.update(sourceRef, { [`links.${type}`]: arrayUnion(targetId) });
    batch.update(targetRef, { [`links.${reverseType}`]: arrayUnion(sourceId) });

    await batch.commit();
  };

  const removeLink = async (sourceId, targetId, type) => {
    const batch = writeBatch(db);
    const sourceRef = doc(db, "notes", sourceId);
    const targetRef = doc(db, "notes", targetId);
    const reverseType = type === 'anterior' ? 'posterior' : 'anterior';

    batch.update(sourceRef, { [`links.${type}`]: arrayRemove(targetId) });
    batch.update(targetRef, { [`links.${reverseType}`]: arrayRemove(sourceId) });

    await batch.commit();
  };

  return { notes, addNote, updateNote, deleteNote, addLink, removeLink };
};

export default useSlipBox;