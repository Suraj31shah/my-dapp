'use client';

import { useState } from 'react';
import { Ticket, QrCode, Tag, ExternalLink, MapPin, Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

export default function Dashboard() {
  const { tickets, initialized } = useStore();
  const [activeTab, setActiveTab] = useState<'owned' | 'listed'>('owned');
  const [selectedQR, setSelectedQR] = useState<string | null>(null);

  if (!initialized) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  const filteredTickets = tickets.filter(t => 
    activeTab === 'owned' ? t.status === 'Owner' : t.status === 'Listed'
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">My <span className="text-indigo-500">Tickets</span></h1>
          <p className="text-slate-400">Manage your event access and secondary market listings.</p>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 self-start">
          <button 
            onClick={() => setActiveTab('owned')}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'owned' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Owned
          </button>
          <button 
            onClick={() => setActiveTab('listed')}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'listed' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Listed
          </button>
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="glass rounded-[2.5rem] p-20 text-center border-dashed border-white/10 flex flex-col items-center space-y-6">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
            <Ticket className="w-8 h-8 text-slate-500" />
          </div>
          <div className="max-w-xs space-y-2">
            <h3 className="text-xl font-bold">No tickets found</h3>
            <p className="text-slate-500 text-sm">You haven't purchased any tickets yet. Explore trending events to get started.</p>
          </div>
          <Link href="/" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all">
            Explore Events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredTickets.map((ticket) => (
            <div key={ticket.tokenId} className="group glass rounded-[2rem] overflow-hidden border-white/5 hover:border-indigo-500/30 transition-all duration-500">
              <div className="aspect-[4/3] relative overflow-hidden">
                <img 
                  src={ticket.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1000'} 
                  className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100" 
                  alt={ticket.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                
                <div className="absolute top-6 left-6 flex space-x-2">
                  <div className="bg-black/60 backdrop-blur-md text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10">
                    ID #{ticket.tokenId}
                  </div>
                  {ticket.isUsed && (
                    <div className="bg-rose-500/20 backdrop-blur-md text-rose-500 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-rose-500/30">
                      USED
                    </div>
                  )}
                </div>

                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="text-xl font-black mb-2 leading-tight">{ticket.name}</h3>
                  <div className="flex items-center text-slate-300 text-xs font-bold uppercase tracking-wider">
                    <MapPin className="w-3 h-3 mr-1.5 text-indigo-500" />
                    {ticket.venue}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block mb-1">Date</span>
                    <span className="text-sm font-bold truncate block">{ticket.date}</span>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block mb-1">Seat</span>
                    <span className="text-sm font-bold truncate block">{ticket.seat}</span>
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <button 
                    onClick={() => setSelectedQR(ticket.tokenId)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold py-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/10 transition-all group-hover:scale-[1.02]">
                    <QrCode className="w-5 h-5" />
                    <span>View Access Pass</span>
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="glass border-white/10 hover:bg-white/10 font-bold py-3.5 rounded-xl text-sm flex items-center justify-center space-x-2 transition-all">
                      <Tag className="w-4 h-4" />
                      <span>{activeTab === 'owned' ? 'List Resale' : 'Update Price'}</span>
                    </button>
                    <button className="glass border-white/10 hover:bg-white/10 font-bold py-3.5 rounded-xl text-sm flex items-center justify-center space-x-2 transition-all">
                      <ExternalLink className="w-4 h-4" />
                      <span>Scan Explorer</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-[2.5rem] p-10 max-w-sm w-full text-center space-y-8 shadow-2xl shadow-indigo-500/20 relative">
            <button 
              onClick={() => setSelectedQR(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
            >
              <Ticket className="w-6 h-6 rotate-45" />
            </button>
            <div className="space-y-4">
              <h3 className="text-2xl font-black">Hold at Scanner</h3>
              <p className="text-slate-400 text-sm">Present this secure pass at the venue entrance.</p>
            </div>
            <div className="bg-white p-6 rounded-3xl mx-auto w-fit shadow-xl shadow-white/10">
              <QRCodeSVG 
                value={selectedQR}
                size={200}
                level="H"
                className="mx-auto"
              />
            </div>
            <div className="bg-white/5 border border-white/10 py-3 rounded-xl font-bold font-mono tracking-widest text-indigo-400">
              ID: {selectedQR}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
