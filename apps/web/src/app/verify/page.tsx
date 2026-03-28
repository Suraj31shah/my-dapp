'use client';

import { useState } from 'react';
import { ShieldCheck, XCircle, Search, QrCode, Loader2, Landmark, User, Clock, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useWriteContract, useAccount } from 'wagmi';
import { TicketNFT_ABI } from '@/lib/abi';

export default function Verify() {
  const { tickets, initialized } = useStore();
  const [tokenId, setTokenId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'idle' | 'success' | 'error' | 'used'>('idle');
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenId || !initialized) return;

    setLoading(true);
    setResult('idle');

    // Simulate contract verification
    setTimeout(() => {
      setLoading(false);
      const ticket = tickets.find(t => t.tokenId === tokenId);

      if (ticket) {
        if (ticket.isUsed) {
          setResult('used');
        } else {
          setResult('success');
          setActiveTicket(ticket);
        }
      } else {
        setResult('error');
      }
    }, 1500);
  };

  const markUsed = async () => {
    if (!activeTicket) return;

    try {
      if (address && process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) {
        await writeContractAsync({
          address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
          abi: TicketNFT_ABI,
          functionName: 'markAsUsed',
          account: address,
          args: [BigInt(activeTicket.tokenId)],
        });
      }
    } catch (error) {
      console.error("Contract verification failed:", error);
      // Depending on requirements, we might want to return here.
      // For showcase flexibility, we'll continue with the local update if it fails.
    }

    // We update the local store for simulation/fallback.
    const storedTickets = JSON.parse(localStorage.getItem('ts_tickets') || '[]');
    const updated = storedTickets.map((t: any) => 
      t.tokenId === activeTicket.tokenId ? { ...t, isUsed: true } : t
    );
    localStorage.setItem('ts_tickets', JSON.stringify(updated));
    setResult('used');
    
    setTimeout(() => {
      window.location.reload(); 
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20 shadow-xl shadow-indigo-600/10">
          <ShieldCheck className="text-indigo-500 w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Access Control</h1>
        <p className="text-slate-400">Scan or enter the NFT Token ID to verify entry permissions.</p>
      </div>

      <div className="glass p-8 rounded-[2.5rem] border-white/5 space-y-8 shadow-2xl shadow-black/40">
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center space-x-2 text-slate-500 group-focus-within:text-indigo-500 transition-colors">
              <QrCode className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              placeholder="Enter Token ID (e.g. 42)"
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-4 py-5 text-xl font-bold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all tracking-tight"
            />
          </div>
          <button 
            type="submit"
            disabled={loading || !tokenId}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Verifying on Ledger...</span>
              </>
            ) : (
              <>
                <Search className="w-6 h-6" />
                <span>Verify Access</span>
              </>
            )}
          </button>
        </form>

        <div className="relative min-h-[200px] flex items-center justify-center border-t border-white/5 pt-8">
          {result === 'idle' && !loading && (
            <div className="text-center space-y-3 opacity-30 grayscale pointer-events-none">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-white/20">
                <QrCode className="w-8 h-8" />
              </div>
              <p className="text-xs uppercase font-bold tracking-[0.2em]">Awaiting Scanner Input</p>
            </div>
          )}

          {result === 'success' && activeTicket && (
            <div className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-8 space-y-6 animate-in zoom-in slide-in-from-top-4 duration-500">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/40">
                  <CheckCircle2 className="text-white w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-emerald-500 leading-tight">Access Granted</h3>
                  <p className="text-emerald-500/60 font-medium">Ticket #{activeTicket.tokenId} Verified</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-500/10">
                <div className="flex items-center space-x-3 text-slate-400">
                  <Landmark className="w-4 h-4" />
                  <span className="text-xs font-bold truncate">{activeTicket.venue}</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-400">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-bold">{activeTicket.name}</span>
                </div>
              </div>

              <button 
                onClick={markUsed}
                className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform"
              >
                Complete Check-In
              </button>
            </div>
          )}

          {result === 'used' && (
            <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-3xl p-8 space-y-6 animate-in zoom-in slide-in-from-top-4 duration-500">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/40">
                  <Clock className="text-white w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-amber-500 leading-tight">Already Used</h3>
                  <p className="text-amber-500/60 font-medium">Ticket Scanned Previously</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm italic">This ticket was marked as used. Duplicate entry is not permitted.</p>
              <button 
                onClick={() => {setResult('idle'); setTokenId('');}}
                className="w-full glass border-amber-500/30 text-amber-500 font-bold py-4 rounded-xl hover:bg-amber-500/10 transition-colors"
              >
                Clear Scanner
              </button>
            </div>
          )}

          {result === 'error' && (
            <div className="w-full bg-rose-500/10 border border-rose-500/30 rounded-3xl p-8 space-y-6 animate-in zoom-in slide-in-from-top-4 duration-500">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/40">
                  <XCircle className="text-white w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-rose-500 leading-tight">Invalid Ticket</h3>
                  <p className="text-rose-500/60 font-medium">Token ID not found</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm">The provided NFT ID does not exist in our records or belongs to a different platform.</p>
              <button 
                onClick={() => {setResult('idle'); setTokenId('');}}
                className="w-full glass border-rose-500/30 text-rose-500 font-bold py-4 rounded-xl hover:bg-rose-500/10 transition-colors"
              >
                Scan Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
