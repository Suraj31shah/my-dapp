'use client';

import Link from 'next/link';
import { WalletButton } from './wallet-button';
import { Ticket, LayoutDashboard, PlusCircle, ShieldCheck } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { useStore } from '@/lib/store';
import { Coins } from 'lucide-react';

const navItems = [
  { name: 'Events', href: '/', icon: Ticket },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Create', href: '/organizer', icon: PlusCircle },
  { name: 'Verify', href: '/verify', icon: ShieldCheck },
];

export function Navbar() {
  const pathname = usePathname();
  const { balance } = useStore();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Ticket className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            TicketShield
          </span>
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-white',
                  isActive ? 'text-white' : 'text-slate-400'
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center space-x-6">
          <div className="hidden sm:flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl">
            <Coins className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-bold text-indigo-400">
              {balance.toFixed(3)} ETH
            </span>
          </div>
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}
