import './globals.css';
import { Hind_Siliguri } from 'next/font/google';
import Providers from './providers';
import SiteHeader from '@/components/layout/SiteHeader';
import Footer from '@/components/layout/Footer';
import AssistantWidget from '@/features/assistant/AssistantWidget';
import { SITE } from '@/lib/site';

const font = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Bright Smart Shop | Quality products, meaningful value',
    template: '%s | Bright Smart Shop',
  },
  description: SITE.description,
  openGraph: { siteName: SITE.name, type: 'website', locale: 'en_BD' },
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={font.variable}>
      <body className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
        <Providers>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <Footer />
          <AssistantWidget />
        </Providers>
      </body>
    </html>
  );
}
