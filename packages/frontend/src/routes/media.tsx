import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useFilteredMediaItems, useMediaStats } from '../hooks/useMediaQueries';
import { MediaItem, MediaStats } from '../lib/api';

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

export const Route = createFileRoute('/media')({
  component: MediaPage,
});

function MediaPage() {
  const [filter, setFilter] = useState<string>('all');

  // Use TanStack Query hooks for data fetching
  const {
    data: stats,
    isPending: statsLoading,
    isError: statsError,
    error: statsErrorObj,
  } = useMediaStats();

  const {
    data: filteredMediaItems,
    isPending: itemsLoading,
    isError: itemsError,
    error: itemsErrorObj,
  } = useFilteredMediaItems(filter);

  // Determine overall loading and error states
  const isLoading = statsLoading || itemsLoading;
  const isError = statsError || itemsError;
  const error = statsErrorObj || itemsErrorObj;

  if (isLoading) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center p-24'>
        <div className='max-w-7xl mx-auto w-full text-center'>
          <h2 className='text-2xl font-semibold mb-4'>Loading...</h2>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto'></div>
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center p-24'>
        <div className='max-w-7xl mx-auto w-full'>
          <div
            className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative'
            role='alert'
          >
            <strong className='font-bold'>Error: </strong>
            <span className='block sm:inline'>
              {error?.message ||
                'Error fetching data. Make sure the backend server is running.'}
            </span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className='flex min-h-screen flex-col p-8'>
      <div className='max-w-7xl mx-auto w-full'>
        <h1 className='text-4xl font-bold mb-8'>Least-Watched Media</h1>

        {/* Stats Section */}
        {stats && (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
            <div className='bg-gray-700 p-6 rounded-lg'>
              <h3 className='text-lg font-semibold mb-2'>Total Items</h3>
              <p className='text-3xl font-bold text-blue-400'>
                {stats.total_count}
              </p>
            </div>
            <div className='bg-gray-700 p-6 rounded-lg'>
              <h3 className='text-lg font-semibold mb-2'>Total Size</h3>
              <p className='text-3xl font-bold text-green-400'>
                {(stats.total_size / 1024).toFixed(1)} TB
              </p>
            </div>
            <div className='bg-gray-700 p-6 rounded-lg'>
              <h3 className='text-lg font-semibold mb-2'>Last Updated</h3>
              <p className='text-sm text-gray-300'>
                <FormattedDate dateString={stats.last_updated} />
              </p>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className='mb-6'>
          <label htmlFor='filter' className='block text-sm font-medium mb-2'>
            Filter by Type:
          </label>
          <select
            id='filter'
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className='bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          >
            <option value='all'>All Media</option>
            <option value='movie'>Movies</option>
            <option value='show'>TV Shows</option>
          </select>
        </div>

        {/* Media Items List */}
        <div className='bg-gray-700 rounded-lg overflow-hidden'>
          <div className='px-6 py-4 border-b border-gray-600'>
            <h2 className='text-xl font-semibold'>
              Media Items{' '}
              {filteredMediaItems && `(${filteredMediaItems.length})`}
            </h2>
          </div>

          {filteredMediaItems && filteredMediaItems.length > 0 ? (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-600'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                      Title
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                      Type
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                      Size (GB)
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                      Date Added
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-600'>
                  {filteredMediaItems.map((item) => (
                    <tr key={item.id} className='hover:bg-gray-600'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm font-medium text-white'>
                          {item.title}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.media_type === 'movie'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {item.media_type}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>
                        {item.size_gb.toFixed(2)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>
                        <FormattedDate dateString={item.date_created} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className='px-6 py-8 text-center text-gray-400'>
              {filter === 'all'
                ? 'No media items found.'
                : `No ${filter}s found.`}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
