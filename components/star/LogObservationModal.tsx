'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { addObservation } from '@/lib/firestore';
import { Telescope, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface LogObservationModalProps {
  slug: string;
  name: string;
  type: string;
}

export default function LogObservationModal({ slug, name, type }: LogObservationModalProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [conditions, setConditions] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to log observations');
      return;
    }

    setLoading(true);
    try {
      await addObservation(user.uid, {
        starSlug: slug,
        starName: name,
        starType: type,
        notes,
        conditions,
      });
      toast.success('Observation logged successfully!');
      setIsOpen(false);
      setNotes('');
      setConditions('');
    } catch (error) {
      console.error('Error logging observation:', error);
      toast.error('Failed to log observation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 sm:p-2.5 rounded-full bg-surface border border-stroke text-text-primary hover:bg-stroke/50 transition-all hover:scale-105 active:scale-95"
        aria-label="Log Observation"
        title="Log Observation"
      >
        <Telescope size={20} className="text-muted" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-surface border border-stroke rounded-2xl p-6 shadow-2xl"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-muted hover:text-text-primary transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="font-display text-2xl text-text-primary mb-2">
                Log Observation
              </h2>
              <p className="text-muted font-body text-sm mb-6">
                Record your viewing details for <strong className="text-accent">{name}</strong>.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="conditions" className="block text-sm font-body text-text-primary mb-1">
                    Viewing Conditions
                  </label>
                  <input
                    type="text"
                    id="conditions"
                    placeholder="e.g., Clear sky, slight light pollution, using 8-inch Dobsonian"
                    value={conditions}
                    onChange={(e) => setConditions(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-lg px-4 py-2.5 text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors font-body text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-body text-text-primary mb-1">
                    Observation Notes
                  </label>
                  <textarea
                    id="notes"
                    rows={4}
                    placeholder="Describe what you saw, interesting features, colors..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-lg px-4 py-2.5 text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors font-body text-sm custom-scrollbar resize-none"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-full font-body text-sm text-muted hover:text-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !user}
                    className="px-6 py-2 rounded-full bg-accent text-bg font-body text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Observation'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
