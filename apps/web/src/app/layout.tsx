import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bible Games - JW Edition',
  description: 'Family-friendly Bible trivia games including Jeopardy and Family Feud',
  keywords: ['bible', 'jeopardy', 'family feud', 'trivia', 'jw', 'game'],
  authors: [{ name: 'AIQSO' }],
  openGraph: {
    title: 'Bible Games - JW Edition',
    description: 'Family-friendly Bible trivia games',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
