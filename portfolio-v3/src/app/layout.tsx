import type { Metadata } from 'next';
import { Geist, Geist_Mono, Cabin } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Subash S | Portfolio',
  description: 'Portfolio of Subash S, a software engineer specializing in web development and design.',
  keywords: [
    'Subash S',
    'Portfolio',
    'Software Engineer',
    'Web Development',
    'Design',
    'Next.js',
    'React',
    'JavaScript',
    'TypeScript',
  ],
};

const cabin = Cabin({
  subsets: ['latin'],
  variable: '--font-cabin',
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${cabin.variable} antialiased`}>{children}</body>
    </html>
  );
}
