'use client';

import { useState, useEffect } from 'react';
import { Heart, Share2, Bookmark, Clock, CalendarDays, Lock } from 'lucide-react';
import { SpaceEvent } from '@/types/event';
import { toggleLikeEvent, hasUserLikedEvent, toggleSaveEvent, hasUserSavedEvent } from '@/lib/events';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Link from 'next/link';

// Event type config — color, label
const typeConfig: Record<string, { color: string; glow: string; label: string }> = {
  meteor_shower: {
    color: 'text-cyan-300 bg-cyan-400/10 border-cyan-400/20',
    glow: 'shadow-[0_0_40px_rgba(34,211,238,0.12)]',
    label: 'Meteor Shower',
  },
  eclipse: {
    color: 'text-amber-300 bg-amber-400/10 border-amber-400/20',
    glow: 'shadow-[0_0_40px_rgba(251,191,36,0.12)]',
    label: 'Eclipse',
  },
  conjunction: {
    color: 'text-violet-300 bg-violet-400/10 border-violet-400/20',
    glow: 'shadow-[0_0_40px_rgba(167,139,250,0.12)]',
    label: 'Conjunction',
  },
  close_approach: {
    color: 'text-sky-300 bg-sky-400/10 border-sky-400/20',
    glow: 'shadow-[0_0_40px_rgba(125,211,252,0.12)]',
    label: 'Close Approach',
  },
  other: {
    color: 'text-white/60 bg-white/5 border-white/10',
    glow: '',
    label: 'Space Event',
  },
};

function useCountdown(dateStr: string) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    const update = () => {
      const dist = new Date(dateStr).getTime() - Date.now();
      if (dist <= 0) {
        setIsPast(true);
        setTimeLeft('Live Now');
        return;
      }
      const d = Math.floor(dist / 86400000);
      const h = Math.floor((dist % 86400000) / 3600000);
      const m = Math.floor((dist % 3600000) / 60000);
      const s = Math.floor((dist % 60000) / 1000);
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [dateStr]);

  return { timeLeft, isPast };
}

export function EventCard({ event }: { event: SpaceEvent }) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(Math.max(0, event.likesCount || 0));
  const [isSaved, setIsSaved] = useState(false);
  const { timeLeft, isPast } = useCountdown(event.date);

  useEffect(() => {
    if (user) {
      hasUserLikedEvent(event.id, user.uid).then(setIsLiked);
      hasUserSavedEvent(event.id, user.uid).then(setIsSaved);
    }
  }, [user, event.id]);

  const requireLogin = (action: string) => {
    toast.error(`Sign in to ${action}`, {
      action: { label: 'Sign In', onClick: () => window.location.href = '/auth/login' },
    });
  };

  const handleLike = async () => {
    if (!user) return requireLogin('like events');
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount(p => Math.max(0, next ? p + 1 : p - 1));
    try {
      await toggleLikeEvent(event.id, user.uid);
    } catch {
      setIsLiked(!next);
      setLikesCount(p => Math.max(0, !next ? p + 1 : p - 1));
      toast.error('Failed to update like');
    }
  };

  const handleSave = async () => {
    if (!user) return requireLogin('save events');
    const next = !isSaved;
    setIsSaved(next);
    try {
      const saved = await toggleSaveEvent(event, user.uid);
      toast.success(saved ? 'Saved to your Space!' : 'Removed from Space.');
    } catch {
      setIsSaved(!next);
      toast.error('Failed to save event');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: event.title, text: event.description, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  const cleanTitle = event.title.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  const cfg = typeConfig[event.type] ?? typeConfig.other;
  const dateStr = new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`relative rounded-2xl overflow-hidden border border-white/8 bg-white/[0.03] backdrop-blur-md ${cfg.glow}`}
    >
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-current to-transparent opacity-40 ${cfg.color.split(' ')[0]}`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Type badge */}
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-widest uppercase border ${cfg.color}`}>
            {cfg.label}
          </span>

          {/* Save button — blurred lock if not logged in */}
          {user ? (
            <button
              onClick={handleSave}
              className={`p-2 rounded-full transition-all duration-200 border ${
                isSaved
                  ? 'bg-cyan-400/20 border-cyan-400/30 text-cyan-300'
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
              }`}
              aria-label={isSaved ? 'Saved' : 'Save event'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} strokeWidth={1.5} />
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="p-2 rounded-full bg-white/5 border border-white/10 text-white/30 hover:text-white/60 transition-colors"
              title="Sign in to save"
            >
              <Lock className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          )}
        </div>

        {/* Title */}
        <h2 className="font-display text-[1.4rem] leading-tight text-white mb-3 tracking-tight">
          {cleanTitle}
        </h2>

        {/* Description — clamped to 3 lines on mobile */}
        <p className="font-body text-white/50 text-sm leading-relaxed line-clamp-3 mb-5">
          {event.description}
        </p>

        {/* Countdown + Date chips */}
        <div className="flex gap-2 mb-5 flex-wrap">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${
            isPast ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-300' : 'bg-white/5 border-white/10 text-white/70'
          }`}>
            <Clock className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            <span className="tabular-nums font-mono">{timeLeft}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50">
            <CalendarDays className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            <span>{dateStr}</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-white/8">
          {/* Like */}
          {user ? (
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                isLiked
                  ? 'bg-rose-400/15 border-rose-400/25 text-rose-300'
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} strokeWidth={1.5} />
              <span>{likesCount}</span>
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/5 border border-white/10 text-white/30 hover:text-white/60 transition-colors"
            >
              <Lock className="w-4 h-4" strokeWidth={1.5} />
              <span>Like</span>
            </Link>
          )}

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 ml-auto"
          >
            <Share2 className="w-4 h-4" strokeWidth={1.5} />
            <span className="hidden xs:inline">Share</span>
          </button>
        </div>

        {/* Not logged in CTA strip */}
        {!user && (
          <Link
            href="/auth/login"
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/15 text-xs text-cyan-300/80 hover:text-cyan-200 hover:border-cyan-400/30 transition-all duration-200"
          >
            <Lock className="w-3 h-3" />
            Sign in to like, save & get personalized alerts
          </Link>
        )}
      </div>
    </motion.article>
  );
}
