import './globals.css';
import { Bebas_Neue, IBM_Plex_Mono, DM_Sans } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bebas',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  title: 'MatchIQ — Paris intelligents, automatisés',
  description:
    'Surveillez chaque match en direct et déclenchez vos stratégies de paris automatiquement — au bon moment, à chaque fois.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${bebasNeue.variable} ${ibmPlexMono.variable} ${dmSans.variable}`}>
      <body className="bg-[#060A08] text-[#E0EBD8] font-body antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
