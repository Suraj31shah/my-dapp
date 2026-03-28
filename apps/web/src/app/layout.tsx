import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TicketShield NFT | Event Ticketing Platform',
  description: 'Decentralized event ticketing with secure NFT tickets and fair resales.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-950 text-slate-50 antialiased`}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow pt-24 pb-12 px-6">
              <div className="max-w-7xl mx-auto text-balance">
                {children}
              </div>
            </main>
            <footer className="py-12 border-t border-white/5 text-center text-slate-500 text-sm">
              <p>&copy; 2026 TicketShield Platform. Built on Arbitrum Stylus.</p>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}