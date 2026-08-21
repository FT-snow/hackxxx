import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'grader.ai',
  description:
    'Grader.ai is an AI-powered platform that helps you grade your papers faster and easier.',
  keywords: ['AI', 'education', 'learning', 'tutoring', 'programming', 'study'],
  authors: [{ name: 'Syndication' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`h-full antialiased text-white ${outfit.className}`}
        style={{ backgroundColor: '#000000' }}
      >
        <div id="root" className="h-full">
          {children}
        </div>
      </body>
    </html>
  );
}
