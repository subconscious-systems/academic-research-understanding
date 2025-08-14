import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { ConvexClientProvider } from './ConvexClientProvider';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Arxiv GigaResearch',
  description: 'Is your paper novel? We wanted to know. Powered by Subconscious.dev',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} antialiased`}>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
