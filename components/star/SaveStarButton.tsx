'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';

interface SaveStarButtonProps {
  slug: string;
  name: string;
  type: string;
}

export default function SaveStarButton({ slug, name, type }: SaveStarButtonProps) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const checkSaved = async () => {
      try {
        const docRef = doc(db, 'users', user.uid, 'saved_stars', slug);
        const docSnap = await getDoc(docRef);
        setIsSaved(docSnap.exists());
      } catch (err) {
        console.error('Error checking saved status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSaved();
  }, [user, slug]);

  const toggleSave = async () => {
    if (!user) {
      toast.error('Please sign in to save stars');
      return;
    }

    setLoading(true);
    const docRef = doc(db, 'users', user.uid, 'saved_stars', slug);

    try {
      if (isSaved) {
        await deleteDoc(docRef);
        setIsSaved(false);
        toast.success(`Removed ${name} from your collection`);
      } else {
        await setDoc(docRef, {
          slug,
          name,
          type,
          savedAt: new Date().toISOString(),
        });
        setIsSaved(true);
        toast.success(`Saved ${name} to your collection!`);
      }
    } catch (err) {
      console.error('Error saving star:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleSave}
      disabled={loading}
      aria-label={isSaved ? "Remove from saved" : "Save to collection"}
      className="p-2 sm:p-2.5 rounded-full bg-surface border border-stroke text-text-primary hover:bg-stroke/50 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
    >
      <Heart 
        size={20} 
        className={isSaved ? "fill-accent text-accent" : "text-muted"} 
      />
    </button>
  );
}
