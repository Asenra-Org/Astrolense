import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { type User } from 'firebase/auth';
import { db } from './firebase';
import type { SavedStar } from '@/types/user';
import type { Observation } from '@/types/observation';

// ─── MOCKED FIRESTORE (Database Skipped) ─────────────────────────

export async function createUserDoc(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      starsExplored: 0,
    });
  }
}

export async function getUserDoc(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function incrementStarsExplored(uid: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    await updateDoc(userRef, {
      starsExplored: (snap.data().starsExplored || 0) + 1
    });
  }
}

export async function getSavedStars(uid: string): Promise<any[]> {
  const starsRef = collection(db, 'users', uid, 'saved_stars');
  const snap = await getDocs(starsRef);
  return snap.docs.map(doc => ({
    starId: doc.id,
    starName: doc.data().name,
    type: doc.data().type,
    ...doc.data()
  }));
}

export async function addObservation(uid: string, obs: any): Promise<string> {
  const obsRef = collection(db, 'users', uid, 'observations');
  const newDoc = await addDoc(obsRef, {
    ...obs,
    createdAt: serverTimestamp(),
  });
  return newDoc.id;
}

export function subscribeObservations(uid: string, callback: (obs: any[]) => void): Unsubscribe {
  const obsRef = collection(db, 'users', uid, 'observations');
  const q = query(obsRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(data);
  });
}

export async function deleteObservation(uid: string, obsId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'observations', obsId));
}

export async function addWebsiteReview(review: any): Promise<string> {
  const reviewRef = collection(db, 'website_reviews');
  const newDoc = await addDoc(reviewRef, {
    ...review,
    createdAt: serverTimestamp(),
  });
  return newDoc.id;
}

export function subscribeWebsiteReviews(callback: (reviews: any[]) => void): Unsubscribe {
  const reviewRef = collection(db, 'website_reviews');
  const q = query(reviewRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(data);
  });
}
