'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface EventData {
  id: number;
  name: string;
  date: string;
  venue: string;
  price: string;
  image: string;
  supply: string;
  type: string;
  description?: string;
  minted: number;
  total_supply: number;
}

export interface TicketData {
  tokenId: string;
  eventId: number;
  name: string;
  date: string;
  venue: string;
  status: string;
  image: string;
  seat: string;
  isUsed: boolean;
  price?: string;
}

interface StoreContextType {
  events: EventData[];
  tickets: TicketData[];
  balance: number;
  initialized: boolean;
  addEvent: (event: Omit<EventData, 'id' | 'supply' | 'minted'>) => void;
  addTicket: (ticket: TicketData) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const DEFAULT_EVENTS: EventData[] = [
  {
    id: 1,
    name: 'Techno Night: Arbitrum Edition',
    date: 'April 15, 2026',
    venue: 'Berlin Cyber Bunker, DE',
    price: '0.05 ETH',
    image: 'https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?auto=format&fit=crop&q=80&w=2000',
    supply: '124/500 left',
    type: 'Music',
    description: 'Join us for an electrifying night of techno in the heart of Berlin.',
    minted: 376,
    total_supply: 500,
  },
  {
    id: 2,
    name: 'Web3 Builders Summit',
    date: 'May 22, 2026',
    venue: 'New York Convention Center, US',
    price: '0.12 ETH',
    image: 'https://images.unsplash.com/photo-1540575861501-7c0011e74504?auto=format&fit=crop&q=80&w=2000',
    supply: '42/150 left',
    type: 'Conference',
    description: 'The ultimate gathering for Web3 innovators.',
    minted: 108,
    total_supply: 150,
  },
];

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [balance, setBalance] = useState<number>(1.00); // Initial credits
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/events');
        if (response.ok) {
          const dbEvents = await response.json();
          // Transform DB events to match EventData
          const formattedDbEvents: EventData[] = dbEvents.map((evt: any) => ({
            id: evt.id,
            name: evt.name,
            date: evt.date,
            venue: evt.venue,
            price: evt.price,
            image: evt.image,
            supply: `${evt.totalSupply}/${evt.totalSupply} left`,
            type: evt.type,
            description: evt.description,
            minted: 0,
            total_supply: evt.totalSupply,
          }));
          
          if (formattedDbEvents.length > 0) {
            setEvents(formattedDbEvents);
          } else {
            setEvents(DEFAULT_EVENTS);
          }
        }
      } catch (error) {
        console.error("Failed to fetch events from DB", error);
        const storedEvents = localStorage.getItem('ts_events');
        if (storedEvents) setEvents(JSON.parse(storedEvents));
        else setEvents(DEFAULT_EVENTS);
      }

      const storedTickets = localStorage.getItem('ts_tickets');
      const storedBalance = localStorage.getItem('ts_balance');

      if (storedTickets) setTickets(JSON.parse(storedTickets));
      if (storedBalance) setBalance(parseFloat(storedBalance));
      else localStorage.setItem('ts_balance', '1.00');

      setInitialized(true);
    };

    loadData();
  }, []);

  const addEvent = (event: Omit<EventData, 'id' | 'supply' | 'minted'>) => {
    const newEvent: EventData = {
      ...event,
      id: events.length + 1,
      minted: 0,
      supply: `${event.total_supply}/${event.total_supply} left`,
    };
    const updated = [...events, newEvent];
    setEvents(updated);
    localStorage.setItem('ts_events', JSON.stringify(updated));
  };

  const addTicket = (ticket: TicketData) => {
    // 1. Add ticket to dashboard
    const updatedTickets = [...tickets, ticket];
    setTickets(updatedTickets);
    localStorage.setItem('ts_tickets', JSON.stringify(updatedTickets));

    // 2. Deduct from balance
    const ticketPrice = parseFloat(ticket.price?.split(' ')[0] || '0') || 0;
    const finalPrice = ticketPrice + 0.001; // With service fee
    const newBalance = Math.max(0, balance - finalPrice);
    setBalance(newBalance);
    localStorage.setItem('ts_balance', newBalance.toString());

    // 3. Update event availability (minted count)
    const updatedEvents = events.map(ev => {
      if (ev.id === ticket.eventId) {
        const newMinted = ev.minted + 1;
        return {
          ...ev,
          minted: newMinted,
          supply: `${ev.total_supply - newMinted}/${ev.total_supply} left`
        };
      }
      return ev;
    });
    setEvents(updatedEvents);
    localStorage.setItem('ts_events', JSON.stringify(updatedEvents));
  };

  return (
    <StoreContext.Provider value={{ events, tickets, balance, initialized, addEvent, addTicket }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
