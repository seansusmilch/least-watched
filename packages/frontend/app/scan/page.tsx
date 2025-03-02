'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ScanProgress {
  total_items: number;
  processed_items: number;
  percent_complete: number;
  current_item: string;
  unwatched_found: number;
}

interface ScanStatus {
  in_progress: boolean;
  complete: boolean;
  progress: ScanProgress;
  results: {
    total_count: number;
    total_size: number;
  } | null;
  last_updated: string | null;
}

interface Config {
  timezone: string;
  emby_url: string;
  emby_token: string;
  sonarr_url: string;
  sonarr_api_key: string;
  radarr_url: string;
  radarr_api_key: string;
  days_threshold: number;
  ignore_newer_than_days: number;
  concurrent_limit: number;
  batch_size: number;
}

// Client-side only component for date formatting
function FormattedDate({ dateString }: { dateString: string }) {
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('');

  useEffect(() => {
    // Fetch the configured timezone
    const fetchTimezone = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/config');
        if (response.ok) {
          const config: Config = await response.json();
          setTimezone(config.timezone || 'UTC');
        }
      } catch (error) {
        console.error('Error fetching timezone:', error);
      }
    };

    fetchTimezone();
  }, []);

  useEffect(() => {
    if (!dateString) return;

    try {
      // Format the date on the client side only
      const date = new Date(dateString);

      // Use the configured timezone if available
      if (timezone) {
        const options: Intl.DateTimeFormatOptions = {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: timezone,
        };

        setFormattedDate(
          new Intl.DateTimeFormat('en-US', options).format(date)
        );
      } else {
        // Fallback to local timezone
        setFormattedDate(date.toLocaleString());
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      setFormattedDate(dateString);
    }
  }, [dateString, timezone]);

  return <span>{formattedDate}</span>;
}

export default function ScanPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    days_threshold: 365,
    ignore_newer_than_days: 270,
    concurrent_limit: 5,
    batch_size: 40,
  });
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseInt(value, 10),
    });
  };

  const startScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScanning(true);
    setScanComplete(false);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/scan/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to start scan');
      }

      // Poll for scan completion
      const checkScanStatus = async () => {
        try {
          const statsResponse = await fetch('http://localhost:8000/api/stats');
          if (statsResponse.ok) {
            const data = await statsResponse.json();
            if (data.last_updated) {
              setIsScanning(false);
              setScanComplete(true);
              setScanStatus(data as ScanStatus);
            } else {
              // Continue polling
              setTimeout(checkScanStatus, 2000);
            }
          }
        } catch (err) {
          console.error('Error checking scan status:', err);
        }
      };

      // Start polling
      setTimeout(checkScanStatus, 2000);
    } catch (err) {
      setIsScanning(false);
      setError('Error starting scan. Make sure the backend server is running.');
      console.error(err);
    }
  };

  return (
    <main className='flex min-h-screen flex-col p-8'>
      <div className='max-w-7xl mx-auto w-full'>
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8'>
          <h1 className='text-4xl font-bold mb-4 md:mb-0'>Scan Media</h1>
          <div className='flex space-x-2'>
            <Link
              href='/media'
              className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors'
            >
              View Media
            </Link>
          </div>
        </div>

        {error && (
          <div
            className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6'
            role='alert'
          >
            <strong className='font-bold'>Error: </strong>
            <span className='block sm:inline'>{error}</span>
          </div>
        )}

        {scanComplete && scanStatus?.last_updated && (
          <div
            className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6'
            role='alert'
          >
            <strong className='font-bold'>Success! </strong>
            <span className='block sm:inline'>
              Scan completed successfully at{' '}
              <FormattedDate dateString={scanStatus.last_updated} />. Found{' '}
              {scanStatus?.results?.total_count || 0} unwatched items totaling{' '}
              {scanStatus?.results?.total_size?.toFixed(1) || 0} GB.
            </span>
          </div>
        )}

        <div className='bg-gray-800 rounded-lg shadow-lg p-6 mb-8'>
          <form onSubmit={startScan}>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
              <div>
                <label
                  htmlFor='days_threshold'
                  className='block text-sm font-medium text-gray-300 mb-2'
                >
                  Days Threshold
                </label>
                <div className='mt-1 relative rounded-md shadow-sm'>
                  <input
                    type='number'
                    name='days_threshold'
                    id='days_threshold'
                    className='bg-gray-700 focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-12 py-2 sm:text-sm border-gray-600 rounded-md text-white'
                    placeholder='365'
                    value={formData.days_threshold}
                    onChange={handleInputChange}
                    min='1'
                    max='3650'
                  />
                  <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
                    <span className='text-gray-400 sm:text-sm'>days</span>
                  </div>
                </div>
                <p className='mt-1 text-sm text-gray-400'>
                  Consider media unwatched if not watched in this many days
                </p>
              </div>

              <div>
                <label
                  htmlFor='ignore_newer_than_days'
                  className='block text-sm font-medium text-gray-300 mb-2'
                >
                  Ignore Newer Than
                </label>
                <div className='mt-1 relative rounded-md shadow-sm'>
                  <input
                    type='number'
                    name='ignore_newer_than_days'
                    id='ignore_newer_than_days'
                    className='bg-gray-700 focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-12 py-2 sm:text-sm border-gray-600 rounded-md text-white'
                    placeholder='270'
                    value={formData.ignore_newer_than_days}
                    onChange={handleInputChange}
                    min='0'
                    max='3650'
                  />
                  <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
                    <span className='text-gray-400 sm:text-sm'>days</span>
                  </div>
                </div>
                <p className='mt-1 text-sm text-gray-400'>
                  Ignore media added within this many days
                </p>
              </div>

              <div>
                <label
                  htmlFor='concurrent_limit'
                  className='block text-sm font-medium text-gray-300 mb-2'
                >
                  Concurrent Limit
                </label>
                <input
                  type='number'
                  name='concurrent_limit'
                  id='concurrent_limit'
                  className='bg-gray-700 focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 py-2 sm:text-sm border-gray-600 rounded-md text-white'
                  placeholder='5'
                  value={formData.concurrent_limit}
                  onChange={handleInputChange}
                  min='1'
                  max='20'
                />
                <p className='mt-1 text-sm text-gray-400'>
                  Number of concurrent API requests
                </p>
              </div>

              <div>
                <label
                  htmlFor='batch_size'
                  className='block text-sm font-medium text-gray-300 mb-2'
                >
                  Batch Size
                </label>
                <input
                  type='number'
                  name='batch_size'
                  id='batch_size'
                  className='bg-gray-700 focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 py-2 sm:text-sm border-gray-600 rounded-md text-white'
                  placeholder='40'
                  value={formData.batch_size}
                  onChange={handleInputChange}
                  min='1'
                  max='100'
                />
                <p className='mt-1 text-sm text-gray-400'>
                  Number of items to process in each batch
                </p>
              </div>
            </div>

            <div className='flex justify-center'>
              <button
                type='submit'
                disabled={isScanning}
                className={`flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${
                  isScanning ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors w-full md:w-1/2`}
              >
                {isScanning ? (
                  <>
                    <svg
                      className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      ></circle>
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      ></path>
                    </svg>
                    Scanning...
                  </>
                ) : (
                  'Start Scan'
                )}
              </button>
            </div>
          </form>
        </div>

        {isScanning && (
          <div className='bg-gray-800 rounded-lg shadow-lg p-6'>
            <h2 className='text-xl font-semibold text-white mb-4'>
              Scan in Progress
            </h2>
            <div className='w-full bg-gray-700 rounded-full h-4 mb-4'>
              <div className='bg-blue-600 h-4 rounded-full animate-pulse'></div>
            </div>
            <p className='text-gray-300 text-center'>
              Scanning your media library. This may take a few minutes...
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
