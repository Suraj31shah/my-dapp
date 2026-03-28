'use client';

import { useState } from 'react';
import { PlusCircle, Calendar, MapPin, DollarSign, Users, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function Organizer() {
  const { addEvent } = useStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    price: '',
    venue: '',
    total_supply: '',
    type: 'Music',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Simulate blockchain deployment (or use Wagmi useWriteContract)
      await new Promise(resolve => setTimeout(resolve, 2000));
      const simulatedOnchainEventId = Math.floor(Math.random() * 1000);

      // 2. Upload metadata to Pinata / IPFS (Simulated)
      const imageUrl = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1000';

      // 3. Persist Event off-chain in Postgres/SQLite via Prisma
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizer: '0x0000000000000000000000000000000000000000', // Connect via Wagmi actual address later
          name: formData.name,
          date: new Date(formData.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          venue: formData.venue,
          price: `${formData.price} ETH`,
          totalSupply: formData.total_supply,
          type: formData.type,
          description: "Exclusive NFT-ticketed event secured by TicketShield.",
          image: imageUrl
        })
      });

      if (!response.ok) throw new Error("Database sync failed");
      const dbEvent = await response.json();

      // 4. Fallback to addEvent for instant local UI update
      addEvent({
        name: dbEvent.name,
        date: dbEvent.date,
        venue: dbEvent.venue,
        price: dbEvent.price,
        total_supply: dbEvent.totalSupply,
        type: dbEvent.type,
        image: dbEvent.image,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 1500);

    } catch (error) {
      console.error("Failed to create event", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Host Your <span className="text-indigo-500">Event</span></h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Create verifiably unique NFT tickets for your next event. Enforce fair rules and receive instant secondary market royalties.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {success ? (
            <div className="glass p-12 rounded-3xl border-emerald-500/20 text-center space-y-6 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <ShieldCheck className="text-white w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Event Created!</h3>
                <p className="text-slate-400">Your event has been deployed to the blockchain and listed.</p>
              </div>
              <div className="flex items-center justify-center space-x-2 text-emerald-500 font-bold animate-pulse">
                <span>Redirecting to Home</span>
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="glass p-8 rounded-3xl border-white/5 space-y-8 shadow-2xl shadow-black/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">Event Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. World Web3 Summit"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">Date & Time</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                    <input 
                      type="datetime-local" 
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">Ticket Price (ETH)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                    <input 
                      type="number" 
                      step="0.001"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="0.05"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">Venue Name</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                    <input 
                      type="text" 
                      required
                      value={formData.venue}
                      onChange={(e) => setFormData({...formData, venue: e.target.value})}
                      placeholder="New York City, US"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">Total Supply</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                    <input 
                      type="number" 
                      required
                      value={formData.total_supply}
                      onChange={(e) => setFormData({...formData, total_supply: e.target.value})}
                      placeholder="500"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 py-4 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-xl shadow-indigo-600/20 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Deploying Contract...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5" />
                    <span>Create NFT Event</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass p-8 rounded-3xl border-white/5 space-y-6 flex flex-col items-center text-center group">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-all">
              <ShieldCheck className="text-emerald-500 w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Stylus Optimized</h3>
              <p className="text-sm text-slate-400">Deployed events use ultra-low gas Rust contracts for maximum efficiency.</p>
            </div>
          </div>

          <div className="glass p-8 rounded-3xl border-white/5 space-y-6">
            <h3 className="font-bold text-lg text-indigo-400">Why TicketShield?</h3>
            <ul className="space-y-4">
              {[
                { title: 'Fixed Royalties', desc: 'Auto-collect from every resale.' },
                { title: 'Anti-Scalper Caps', desc: 'Optional price caps on secondary.' },
                { title: 'Verifiably Unique', desc: 'Secure entry for all attendees.' }
              ].map((item, i) => (
                <li key={i} className="flex items-start space-x-3 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 flex-shrink-0 group-hover:scale-150 transition-all" />
                  <div>
                    <h4 className="text-sm font-bold">{item.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
