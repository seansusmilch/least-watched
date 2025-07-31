import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/providers/query-provider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap', // Optimize font loading
  preload: true,
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap', // Optimize font loading
  preload: true,
});

export const metadata: Metadata = {
  title: 'Least Watched',
  description: 'Track your least watched media',
  // Performance optimizations
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  // Preload critical resources
  other: {
    'dns-prefetch': '//fonts.googleapis.com',
    'preconnect': '//fonts.googleapis.com',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </QueryProvider>
        <Toaster
          toastOptions={{
            className: 'toast-item',
            // Add test ID for individual toasts
            ...(process.env.NODE_ENV === 'test' && {
              'data-testid': 'toast-item',
            }),
          }}
        />
      </body>
    </html>
  );
}
