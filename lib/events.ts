import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  increment,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { SpaceEvent } from '@/types/event';

export async function getUpcomingEvents(): Promise<SpaceEvent[]> {
  const eventsRef = collection(db, 'events_feed');
  // Order by date to get closest events
  const q = query(eventsRef, orderBy('date', 'asc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as SpaceEvent[];
}

export async function toggleLikeEvent(eventId: string, uid: string): Promise<boolean> {
  if (!uid) return false;
  
  const eventRef = doc(db, 'events_feed', eventId);
  const userLikeRef = doc(db, 'users', uid, 'liked_events', eventId);
  
  const likeDoc = await getDoc(userLikeRef);
  if (!likeDoc.exists()) {
    // Add like
    await setDoc(userLikeRef, { likedAt: new Date().toISOString() });
    await updateDoc(eventRef, {
      likesCount: increment(1)
    });
    return true; // isLiked
  } else {
    // Remove like
    await deleteDoc(userLikeRef);
    await updateDoc(eventRef, {
      likesCount: increment(-1)
    });
    return false; // not liked
  }
}

export async function hasUserLikedEvent(eventId: string, uid: string): Promise<boolean> {
  if (!uid) return false;
  const userLikeRef = doc(db, 'users', uid, 'liked_events', eventId);
  const snap = await getDoc(userLikeRef);
  return snap.exists();
}

// ----------------------------------------
// SAVE EVENTS LOGIC
// ----------------------------------------

export async function hasUserSavedEvent(eventId: string, uid: string): Promise<boolean> {
  if (!uid) return false;
  const userSaveRef = doc(db, 'users', uid, 'saved_events', eventId);
  const snap = await getDoc(userSaveRef);
  return snap.exists();
}

export async function toggleSaveEvent(event: SpaceEvent, uid: string): Promise<boolean> {
  if (!uid) return false;
  
  const userSaveRef = doc(db, 'users', uid, 'saved_events', event.id);
  const saveDoc = await getDoc(userSaveRef);
  
  if (!saveDoc.exists()) {
    // Add save
    await setDoc(userSaveRef, {
      ...event,
      savedAt: new Date().toISOString()
    });
    return true; // isSaved
  } else {
    // Remove save
    await deleteDoc(userSaveRef);
    return false; // not saved
  }
}

export async function getSavedEvents(uid: string): Promise<SpaceEvent[]> {
  if (!uid) return [];
  const savedEventsRef = collection(db, 'users', uid, 'saved_events');
  const q = query(savedEventsRef, orderBy('savedAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as SpaceEvent[];
}
