import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import FooterWithYear from '../components/FooterWithYear';

export const Route = createRootRoute({
  component: () => (
    <div className='flex flex-col min-h-screen'>
      <header className='bg-gray-800 border-b border-gray-700'>
        <div className='container mx-auto px-4 py-4'>
          <div className='flex flex-col md:flex-row justify-between items-center'>
            <div className='flex items-center mb-4 md:mb-0'>
              <Link
                to='/'
                className='text-2xl font-bold text-blue-400 hover:text-blue-300 transition-colors'
              >
                Least-Watched
              </Link>
            </div>
            <nav className='flex space-x-4'>
              <Link
                to='/'
                className='px-3 py-2 rounded hover:bg-gray-700 transition-colors [&.active]:bg-gray-700'
              >
                Dashboard
              </Link>
              <Link
                to='/scan'
                className='px-3 py-2 rounded hover:bg-gray-700 transition-colors [&.active]:bg-gray-700'
              >
                Scan
              </Link>
              <Link
                to='/settings'
                className='px-3 py-2 rounded hover:bg-gray-700 transition-colors [&.active]:bg-gray-700'
              >
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className='flex-grow'>
        <Outlet />
      </main>
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
      <TanStackRouterDevtools />
    </div>
  ),
});
