import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import FooterWithYear from './components/FooterWithYear';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Least-Watched Media',
  description:
    'Identify unwatched or least-watched media from your Emby server',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${inter.className} bg-gray-900 text-white min-h-screen`}
        suppressHydrationWarning
      >
        <div className='flex flex-col min-h-screen'>
          <header className='bg-gray-800 border-b border-gray-700'>
            <div className='container mx-auto px-4 py-4'>
              <div className='flex flex-col md:flex-row justify-between items-center'>
                <div className='flex items-center mb-4 md:mb-0'>
                  <Link
                    href='/'
                    className='text-2xl font-bold text-blue-400 hover:text-blue-300 transition-colors'
                  >
                    Least-Watched
                  </Link>
                </div>
                <nav className='flex space-x-4'>
                  <Link
                    href='/'
                    className='px-3 py-2 rounded hover:bg-gray-700 transition-colors'
                  >
                    Dashboard
                  </Link>
                  <Link
                    href='/scan'
                    className='px-3 py-2 rounded hover:bg-gray-700 transition-colors'
                  >
                    Scan
                  </Link>
                  <Link
                    href='/settings'
                    className='px-3 py-2 rounded hover:bg-gray-700 transition-colors'
                  >
                    Settings
                  </Link>
                </nav>
              </div>
            </div>
          </header>
          <main className='flex-grow'>{children}</main>
          <footer className='bg-gray-800 border-t border-gray-700 py-4'>
            <div className='container mx-auto px-4'>
              <div className='flex flex-col md:flex-row justify-between items-center'>
                <FooterWithYear />
                <div className='flex space-x-4'>
                  <a
                    href='https://github.com/yourusername/least-watched'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-sm text-gray-400 hover:text-white transition-colors'
                  >
                    GitHub
                  </a>
                  <a
                    href='https://emby.media/'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-sm text-gray-400 hover:text-white transition-colors'
                  >
                    Emby
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
