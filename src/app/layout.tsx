import type { Metadata } from 'next';
import { Cinzel } from 'next/font/google';
import ConvexClientProvider from '@/components/ConvexClientProvider';
import './globals.css';

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-cinzel',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mimir — your notes, connected',
  description:
    'Mimir digitizes handwritten notes into a searchable, self-linking concept mesh. OCR, concept tagging, and semantic recall for every subject.',
  keywords: [
    'handwritten notes',
    'OCR',
    'concept index',
    'knowledge graph',
    'revision',
    'AI',
  ],
  authors: [{ name: 'Syndication' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cinzel.variable}>
      <body
        className="antialiased text-white"
        style={{ backgroundColor: '#000000' }}
      >
        <ConvexClientProvider>
          <div id="root">
            {children}
          </div>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
