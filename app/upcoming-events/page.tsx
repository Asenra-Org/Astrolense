'use client';

import { useEffect, useState } from 'react';
import { getUpcomingEvents } from '@/lib/events';
import { SpaceEvent } from '@/types/event';
import { EventCard } from '@/components/feed/EventCard';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HlsVideo from '@/components/ui/HlsVideo';

export default function FeedPage() {
  const [events, setEvents] = useState<SpaceEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUpcomingEvents().then(data => {
      // Filter out events that have passed by more than 1 day
      const now = new Date().getTime();
      const upcoming = data.filter(e => new Date(e.date).getTime() > now - 86400000);
      setEvents(upcoming);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <div className="relative min-h-screen bg-black overflow-hidden selection:bg-accent/30">
      <div className="absolute top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

      {/* Full-screen video background from Home Page */}
      <div className="fixed inset-0 z-0">
        <HlsVideo 
          src="https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8"
          autoPlay 
          muted 
          loop 
          playsInline
          preload="auto"
          className="min-w-full min-h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-bg to-transparent" />
      </div>

      <main className="relative z-10 flex flex-col min-h-screen pt-32 pb-12 px-4 bg-gradient-to-t from-black via-black/40 to-transparent">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 w-full">
        <div className="text-center mb-16 relative">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-medium text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50 tracking-tight mb-6"
          >
            Space Events
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="text-xl md:text-2xl text-text-secondary font-light max-w-2xl mx-auto leading-relaxed"
          >
            An automated, real-time timeline of upcoming astronomical phenomena, meteor showers, and planetary conjunctions.
          </motion.p>
        </div>

        {loading ? (
          <div className="space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-full h-96 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-8">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-12 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md"
          >
            <p className="text-text-secondary text-lg">No upcoming events found right now.</p>
            <p className="text-text-muted mt-2">The AI is currently scanning the skies. Check back soon!</p>
          </motion.div>
        )}
      </div>
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
