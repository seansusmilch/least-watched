'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

interface MediaItem {
  id: number;
  title: string;
  media_type: string;
  size_gb: number;
  date_created: string;
  root_folder: string;
}

interface MediaStats {
  total_size: number;
  last_updated: string | null;
  counts: {
    movie?: number;
    show?: number;
    [key: string]: number | undefined;
  };
  total_count: number;
}

// Client-side only component for date formatting
function FormattedDate({ dateString }: { dateString: string | null }) {
  if (!dateString) {
    return <span>Not available</span>;
  }

  try {
    const date = new Date(dateString);

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };

    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(
      date
    );
    return <span>{formattedDate}</span>;
  } catch (error) {
    console.error('Error formatting date:', error);
    return <span>{dateString || 'Not available'}</span>;
  }
}

export default function MediaPage() {
  const [allMediaItems, setAllMediaItems] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<MediaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  // Filter media items client-side based on the selected filter
  const filteredMediaItems = useMemo(() => {
    if (filter === 'all') {
      return allMediaItems;
    }
    return allMediaItems.filter((item) => item.media_type === filter);
  }, [allMediaItems, filter]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats
        const statsResponse = await fetch('http://localhost:8000/api/stats');
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch stats');
        }
        const statsData = await statsResponse.json();
        setStats(statsData);

        // Fetch all media items at once
        const mediaResponse = await fetch('http://localhost:8000/api/media');
        if (!mediaResponse.ok) {
          throw new Error('Failed to fetch media items');
        }
        const mediaData = await mediaResponse.json();
        setAllMediaItems(mediaData.media_items || []);
      } catch (err) {
        setError(
          'Error fetching data. Make sure the backend server is running.'
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Only fetch once on component mount

  if (loading) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center p-24'>
        <div className='max-w-7xl mx-auto w-full text-center'>
          <h2 className='text-2xl font-semibold mb-4'>Loading...</h2>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto'></div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center p-24'>
        <div className='max-w-7xl mx-auto w-full'>
          <div
            className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative'
            role='alert'
          >
            <strong className='font-bold'>Error: </strong>
            <span className='block sm:inline'>{error}</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className='flex min-h-screen flex-col p-8'>
      <div className='max-w-7xl mx-auto w-full'>
        <h1 className='text-4xl font-bold mb-8'>Least-Watched Media</h1>

        {stats && (
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
            <div className='bg-gray-800 rounded-lg shadow-lg p-6'>
              <h2 className='text-lg font-semibold text-gray-400 mb-2'>
                Total Unwatched
              </h2>
              <p className='text-4xl font-bold text-white'>
                {stats.total_count}
              </p>
              <p className='text-sm text-gray-400'>Media Items</p>
            </div>

            <div className='bg-gray-800 rounded-lg shadow-lg p-6'>
              <h2 className='text-lg font-semibold text-gray-400 mb-2'>
                Total Size
              </h2>
              <p className='text-4xl font-bold text-white'>
                {stats.total_size.toFixed(1)}
              </p>
              <p className='text-sm text-gray-400'>GB</p>
            </div>

            <div className='bg-gray-800 rounded-lg shadow-lg p-6'>
              <h2 className='text-lg font-semibold text-gray-400 mb-2'>
                Movies
              </h2>
              <p className='text-4xl font-bold text-white'>
                {stats.counts.movie || 0}
              </p>
              <p className='text-sm text-gray-400'>Unwatched</p>
            </div>

            <div className='bg-gray-800 rounded-lg shadow-lg p-6'>
              <h2 className='text-lg font-semibold text-gray-400 mb-2'>
                TV Shows
              </h2>
              <p className='text-4xl font-bold text-white'>
                {stats.counts.show || 0}
              </p>
              <p className='text-sm text-gray-400'>Unwatched</p>
            </div>
          </div>
        )}

        {stats?.last_updated && (
          <div className='bg-blue-900/30 border-l-4 border-blue-500 p-4 mb-8 rounded'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-5 w-5 text-blue-500'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='ml-3'>
                <p className='text-sm text-blue-200'>
                  Last Updated:{' '}
                  <FormattedDate dateString={stats.last_updated} />
                </p>
              </div>
            </div>
          </div>
        )}

        <div className='bg-gray-800 rounded-lg shadow-lg overflow-hidden'>
          <div className='border-b border-gray-700'>
            <nav className='-mb-px flex'>
              <button
                onClick={() => setFilter('all')}
                className={`py-3 px-6 border-b-2 font-medium text-sm ${
                  filter === 'all'
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                All Media
              </button>
              <button
                onClick={() => setFilter('movie')}
                className={`py-3 px-6 border-b-2 font-medium text-sm ${
                  filter === 'movie'
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Movies
              </button>
              <button
                onClick={() => setFilter('show')}
                className={`py-3 px-6 border-b-2 font-medium text-sm ${
                  filter === 'show'
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                TV Shows
              </button>
            </nav>
          </div>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-700'>
              <thead className='bg-gray-900'>
                <tr>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
                  >
                    Title
                  </th>
                  {filter === 'all' && (
                    <th
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
                    >
                      Type
                    </th>
                  )}
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
                  >
                    Size (GB)
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
                  >
                    Date Added
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
                  >
                    Root Folder
                  </th>
                </tr>
              </thead>
              <tbody className='bg-gray-800 divide-y divide-gray-700'>
                {filteredMediaItems.length > 0 ? (
                  filteredMediaItems.map((item) => (
                    <tr key={item.id} className='hover:bg-gray-700'>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-white'>
                        {item.title}
                      </td>
                      {filter === 'all' && (
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.media_type === 'movie'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {item.media_type === 'movie' ? 'Movie' : 'TV Show'}
                          </span>
                        </td>
                      )}
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>
                        {item.size_gb.toFixed(1)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>
                        <FormattedDate dateString={item.date_created} />
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>
                        {item.root_folder}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={filter === 'all' ? 5 : 4}
                      className='px-6 py-4 text-center text-sm text-gray-400'
                    >
                      No media items found. Run a scan to find unwatched media.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className='mt-8 flex justify-center'>
          <Link
            href='/scan'
            className='bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors'
          >
            Run New Scan
          </Link>
        </div>
      </div>
    </main>
  );
}
