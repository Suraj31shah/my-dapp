'use client';

import { ERC721InteractionPanel } from '@/lib/erc721-stylus/src/ERC721InteractionPanel';
import { Ticket, Calendar, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/lib/store';

export default function Home() {
  const { events, initialized } = useStore();

  const scrollToEvents = () => {
    const element = document.getElementById('events-grid');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden rounded-3xl bg-indigo-600/10 border border-indigo-500/20 px-8 flex flex-col items-center text-center">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-50" />
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            The Future of <span className="text-indigo-500">Ticketing</span> is Here.
          </h1>
          <p className="text-xl text-slate-400 mb-10 leading-relaxed">
            Secure, fraud-proof event tickets as NFTs. No duplications, 
            fair secondary markets, and exclusive rewards for real fans.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={scrollToEvents}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2"
            >
              <span>Explore Events</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link 
              href="/organizer"
              className="glass hover:bg-white/10 text-white px-8 py-4 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2"
            >
              List Your Event
            </Link>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section id="events-grid">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold">Trending Events</h2>
          <div className="flex space-x-2">
            {['All', 'Music', 'Conference', 'Sports'].map((t) => (
              <button key={t} className="px-4 py-2 rounded-full text-sm font-medium glass hover:text-white transition-colors">
                {t}
              </button>
            ))}
          </div>
        </div>

        {!initialized ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <Link 
                href={`/events/${event.id}`} 
                key={event.id}
                className="group glass rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300 card-shine"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={event.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1000'} 
                    alt={event.name} 
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-indigo-600 text-xs font-bold px-3 py-1 rounded-full text-white shadow-lg">
                    {event.type}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 line-clamp-1">{event.name}</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-slate-400 text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                      {event.date}
                    </div>
                    <div className="flex items-center text-slate-400 text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-indigo-500" />
                      {event.venue}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Price</span>
                      <span className="text-lg font-bold text-indigo-400">{event.price}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block mb-1">Availability</span>
                      <span className="text-sm font-medium text-slate-300">{event.supply}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10">
        <div className="p-8 rounded-2xl glass border-indigo-500/10">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6">
            <Ticket className="text-emerald-500 w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold mb-3">Anti-Fraud Engine</h4>
          <p className="text-slate-400 text-sm leading-relaxed">
            Every ticket is a unique NFT on Arbitrum. Impossible to duplicate or fake.
          </p>
        </div>
        <div className="p-8 rounded-2xl glass border-indigo-500/10">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6">
            <Calendar className="text-indigo-500 w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold mb-3">Fair Marketplace</h4>
          <p className="text-slate-400 text-sm leading-relaxed">
            Smart contracts enforce price caps to stop scalping and ensure fans pay fair prices.
          </p>
        </div>
        <div className="p-8 rounded-2xl glass border-indigo-500/10">
          <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6">
            <MapPin className="text-amber-500 w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold mb-3">Instant Royalties</h4>
          <p className="text-slate-400 text-sm leading-relaxed">
            Organizers receive a slice of every secondary sale automatically via royalty contracts.
          </p>
        </div>
      </section>
    </div>
  );
}