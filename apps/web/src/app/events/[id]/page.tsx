'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Ticket, ShieldCheck, ChevronRight, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useStore, EventData } from '@/lib/store';
import { useWriteContract, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { TicketNFT_ABI } from '@/lib/abi';

export default function EventDetails({ params }: { params: { id: string } }) {
  const { events, addTicket, initialized } = useStore();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  useEffect(() => {
    if (initialized) {
      const found = events.find(e => e.id === parseInt(params.id));
      setEvent(found || null);
    }
  }, [params.id, events, initialized]);

  const handleMint = async () => {
    if (!event) return;
    setLoading(true);

    try {
      if (address && process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) {
        // Actual Web3 Transaction
        await writeContractAsync({
          address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
          abi: TicketNFT_ABI,
          functionName: 'buyTicket',
          account: address,
          args: [event.id, `ipfs://mockCID/${event.id}`],
          value: parseEther(event.price.replace(' ETH', '')),
        });
      } else {
        // Fallback simulation for easy UI testing without wallet
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const tokenId = Math.floor(Math.random() * 10000).toString();
      addTicket({
        tokenId,
        eventId: event.id,
        name: event.name,
        date: event.date,
        venue: event.venue,
        status: 'Owner',
        image: event.image,
        seat: `Section A, Row ${Math.floor(Math.random() * 20) + 1}, Seat ${Math.floor(Math.random() * 30) + 1}`,
        isUsed: false,
        price: event.price,
      });

      setSuccess(true);
    } catch (error) {
      console.error("Minting failed", error);
    } finally {
      setLoading(false);
    }
  };

  if (!initialized) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
        <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
        <Link href="/" className="text-indigo-400 font-bold hover:underline">Back to Events</Link>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
      <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-8">
        <Link href="/" className="hover:text-white transition-colors">Events</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-300">{event.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Image and Details */}
        <div className="lg:col-span-2 space-y-12">
          <div className="relative aspect-video rounded-3xl overflow-hidden glass border-white/10 group">
            <img 
              src={event.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1000'} 
              alt={event.name} 
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-1000" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-10 left-10 right-10">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{event.name}</h1>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center text-slate-200">
                  <Calendar className="w-5 h-5 mr-2 text-indigo-500" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center text-slate-200">
                  <MapPin className="w-5 h-5 mr-2 text-indigo-500" />
                  <span>{event.venue}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center">
              <Info className="w-6 h-6 mr-2 text-indigo-500" />
              About the Event
            </h2>
            <p className="text-slate-400 leading-relaxed text-lg">
              {event.description || 'Welcome to this exclusive NFT-ticketed event. This event features verifiably unique tickets powered by Arbitrum Stylus, ensuring zero fraud and fair resale possibilities.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              'Verifiable NFT Ownership',
              'Exclusive VIP Lounge Access',
              'Proof of Attendance Protocol (POAP)',
              'Resale Market Protected',
            ].map((feature, i) => (
              <div key={i} className="flex items-center p-4 rounded-xl glass border-white/5 space-x-3">
                <ShieldCheck className="text-emerald-500 w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Checkout Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-32 glass border-indigo-500/20 rounded-3xl p-8 space-y-8 animate-float shadow-2xl shadow-indigo-500/10">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 font-medium">Original Price</span>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">Primary</span>
              </div>
              <div className="text-4xl font-black">{event.price}</div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Service Fee</span>
                <span className="text-slate-300">0.001 ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total</span>
                <span className="text-slate-100 font-bold">{(parseFloat(event.price.split(' ')[0]) + 0.001).toFixed(3)} ETH</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
                <span>Availability</span>
                <span>{event.total_supply - event.minted} Left</span>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-1000 shadow-glow"
                  style={{ width: `${(event.minted / event.total_supply) * 100}%` }}
                />
              </div>
            </div>

            {success ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                  <ShieldCheck className="text-white w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Ticket Secured!</h3>
                  <p className="text-sm text-slate-400">Your NFT is being minted on Arbitrum.</p>
                </div>
                <Link 
                  href="/dashboard"
                  className="block w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-emerald-500/20"
                >
                  View in Dashboard
                </Link>
              </div>
            ) : (
              <button
                onClick={handleMint}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Minting NFT...</span>
                  </>
                ) : (
                  <>
                    <Ticket className="w-5 h-5" />
                    <span>Purchase Ticket</span>
                  </>
                )}
              </button>
            )}

            <p className="text-[10px] text-center text-slate-500 px-4 leading-relaxed">
              By purchasing, you agree to our terms. This transaction will incur gas fees on the Arbitrum network.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
