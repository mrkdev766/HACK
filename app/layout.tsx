import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/features/auth/auth-context';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'Wanderly — Not just a trip. An adventure.',
  description:
    'Wanderly is an AI-powered real-world travel adventure that turns exploring places into a progressive mystery quest. Plan, explore, capture, complete, and unlock.',
  keywords: ['travel', 'adventure', 'ai travel planner', 'real-world quest', 'itinerary', 'missions'],
  openGraph: {
    title: 'Wanderly — Real Places. Real Missions.',
    description: 'Not just a trip. An adventure.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#143D30',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${playfair.variable}`}>
      <body className="bg-[#07130E] text-ink antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
