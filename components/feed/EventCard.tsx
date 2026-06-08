'use client';

import { useState, useEffect } from 'react';
import { Heart, Share2, Calendar, Clock, Bookmark } from 'lucide-react';
import { SpaceEvent } from '@/types/event';
import { toggleLikeEvent, hasUserLikedEvent, toggleSaveEvent, hasUserSavedEvent } from '@/lib/events';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const getTypeGradient = (type: string) => {
  switch (type) {
    case 'meteor_shower': return 'from-accent/20 to-transparent';
    case 'eclipse': return 'from-[#FFB067]/20 to-transparent';
    case 'conjunction': return 'from-[#4E85BF]/20 to-transparent';
    case 'close_approach': return 'from-[#89AACC]/20 to-transparent';
    default: return 'from-white/10 to-transparent';
  }
};

export function EventCard({ event }: { event: SpaceEvent }) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(event.likesCount || 0);
  const [isSaved, setIsSaved] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (user) {
      hasUserLikedEvent(event.id, user.uid).then(setIsLiked);
      hasUserSavedEvent(event.id, user.uid).then(setIsSaved);
    }
  }, [user, event.id]);

  // Countdown timer logic
  useEffect(() => {
    const eventDate = new Date(event.date).getTime();
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = eventDate - now;

      if (distance < 0) {
        setTimeLeft('Happening Now / Passed');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [event.date]);

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like events!');
      return;
    }
    
    // Optimistic UI update
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount(prev => Math.max(0, newLikedState ? prev + 1 : prev - 1));
    
    try {
      await toggleLikeEvent(event.id, user.uid);
    } catch (e) {
      // Revert on failure
      setIsLiked(!newLikedState);
      setLikesCount(prev => Math.max(0, !newLikedState ? prev + 1 : prev - 1));
      toast.error('Failed to like event');
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Please login to save events!');
      return;
    }
    
    // Optimistic UI update
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    
    try {
      const result = await toggleSaveEvent(event, user.uid);
      if (result) {
        toast.success('Event saved to your Space!');
      } else {
        toast.info('Event removed from your Space.');
      }
    } catch (e) {
      // Revert on failure
      setIsSaved(!newSavedState);
      toast.error('Failed to save event');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${event.title} - ${window.location.href}`);
      toast.success('Link copied to clipboard!');
    }
  };

  // Strip emojis from title
  const cleanTitle = event.title.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F251}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '').trim();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="liquid-glass rounded-[2rem] overflow-hidden mb-12 group"
    >
      <div className={`absolute top-0 right-0 w-full md:w-1/2 h-full bg-gradient-to-l ${getTypeGradient(event.type)} pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity duration-700`} />
      
      <div className="p-8 md:p-12 relative z-10">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div>
              <span className="px-3 py-1 bg-white/5 border border-white/10 text-accent text-[10px] md:text-xs font-semibold rounded-full uppercase tracking-[0.2em] mb-4 inline-block">
                {event.type.replace('_', ' ')}
              </span>
              <h2 className="text-3xl md:text-4xl font-body font-light text-white tracking-tight leading-tight">
                {cleanTitle}
              </h2>
            </div>
          </div>
          
          <button 
            onClick={handleSave}
            className={`p-4 rounded-full transition-all duration-300 ${
              isSaved ? 'bg-accent text-bg shadow-[0_0_20px_rgba(var(--color-accent-rgb),0.5)]' : 'bg-white/5 text-muted hover:text-white hover:bg-white/10 border border-white/5 hover:border-white/20'
            }`}
            title={isSaved ? "Saved" : "Save Event"}
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} strokeWidth={isSaved ? 2 : 1.5} />
          </button>
        </div>

        <p className="text-text-secondary text-lg md:text-xl font-light leading-relaxed mb-10 max-w-3xl">
          {event.description}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full animate-pulse" />
              <Clock className="w-8 h-8 text-accent relative z-10" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[10px] text-muted uppercase tracking-[0.2em] font-medium mb-1">T-Minus</p>
              <p className="text-2xl md:text-3xl font-body font-light text-white tabular-nums">{timeLeft}</p>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl flex items-center justify-between gap-5">
            <div>
              <p className="text-[10px] text-muted uppercase tracking-[0.2em] font-medium mb-1">Date of Event</p>
              <div className="flex items-center gap-3 text-white">
                <Calendar className="w-5 h-5 text-muted" strokeWidth={1.5} />
                <span className="text-xl md:text-2xl font-light">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 pt-8 border-t border-white/10">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-300 font-medium ${
              isLiked ? 'bg-[#FF6B6B]/20 text-[#FF6B6B] border border-[#FF6B6B]/30' : 'bg-transparent text-text-secondary hover:bg-white/5 border border-white/10 hover:border-white/20'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} strokeWidth={1.5} />
            <span>{likesCount} Likes</span>
          </button>
          
          <button 
            onClick={handleShare}
            className="flex items-center gap-3 px-6 py-3 rounded-full bg-transparent border border-white/10 text-text-secondary hover:text-white hover:bg-white/5 hover:border-white/20 transition-all duration-300 ml-auto font-medium"
          >
            <Share2 className="w-5 h-5" strokeWidth={1.5} />
            <span>Share</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
