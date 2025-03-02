'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Config {
  emby_url: string;
  emby_token: string;
  sonarr_url: string;
  sonarr_api_key: string;
  radarr_url: string;
  radarr_api_key: string;
  timezone: string;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<Config>({
    emby_url: '',
    emby_token: '',
    sonarr_url: '',
    sonarr_api_key: '',
    radarr_url: '',
    radarr_api_key: '',
    timezone: 'UTC',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/config');
        if (!response.ok) {
          throw new Error('Failed to fetch configuration');
        }
        const data = await response.json();
        setConfig(data);
      } catch (err) {
        setError(
          'Error fetching configuration. Make sure the backend server is running.'
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setConfig({
      ...config,
      [name]: value,
    });
  };

  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      setSaveSuccess(true);
    } catch (err) {
      setError(
        'Error saving configuration. Make sure the backend server is running.'
      );
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center p-24'>
        <div className='max-w-7xl mx-auto w-full text-center'>
          <h2 className='text-2xl font-semibold mb-4'>Loading Settings...</h2>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto'></div>
        </div>
      </main>
    );
  }

  return (
    <main className='flex min-h-screen flex-col p-8'>
      <div className='max-w-7xl mx-auto w-full'>
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8'>
          <h1 className='text-4xl font-bold mb-4 md:mb-0'>Settings</h1>
          <div className='flex space-x-2'>
            <Link
              href='/'
              className='bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors'
            >
              Dashboard
            </Link>
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

        {saveSuccess && (
          <div
            className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6'
            role='alert'
          >
            <strong className='font-bold'>Success! </strong>
            <span className='block sm:inline'>
              Settings saved successfully.
            </span>
          </div>
        )}

        <div className='bg-gray-800 rounded-lg shadow-lg p-6'>
          <form onSubmit={saveConfig}>
            <div className='mb-8'>
              <h2 className='text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2'>
                Application Settings
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label
                    htmlFor='timezone'
                    className='block text-sm font-medium text-gray-300 mb-2'
                  >
                    Timezone
                  </label>
                  <select
                    id='timezone'
                    name='timezone'
                    className='bg-gray-700 focus:ring-blue-500 focus:border-blue-500 block w-full py-2 px-3 border border-gray-600 rounded-md shadow-sm text-white'
                    value={config.timezone}
                    onChange={handleInputChange}
                  >
                    <option value='UTC'>UTC</option>
                    <option value='America/New_York'>Eastern Time (ET)</option>
                    <option value='America/Chicago'>Central Time (CT)</option>
                    <option value='America/Denver'>Mountain Time (MT)</option>
                    <option value='America/Los_Angeles'>
                      Pacific Time (PT)
                    </option>
                    <option value='Europe/London'>London</option>
                    <option value='Europe/Paris'>Paris</option>
                    <option value='Asia/Tokyo'>Tokyo</option>
                    <option value='Australia/Sydney'>Sydney</option>
                  </select>
                  <p className='mt-1 text-sm text-gray-400'>
                    Timezone for displaying dates and times
                  </p>
                </div>
              </div>
            </div>

            <div className='mb-8'>
              <h2 className='text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2'>
                Emby Configuration
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label
                    htmlFor='emby_url'
                    className='block text-sm font-medium text-gray-300 mb-2'
                  >
                    Emby Server URL
                  </label>
                  <input
                    type='text'
                    name='emby_url'
                    id='emby_url'
                    className='bg-gray-700 focus:ring-blue-500 focus:border-blue-500 block w-full py-2 px-3 border border-gray-600 rounded-md shadow-sm text-white'
                    placeholder='http://your-emby-server:8096'
                    value={config.emby_url}
                    onChange={handleInputChange}
                  />
                  <p className='mt-1 text-sm text-gray-400'>
                    The URL of your Emby server including port
                  </p>
                </div>
                <div>
                  <label
                    htmlFor='emby_token'
                    className='block text-sm font-medium text-gray-300 mb-2'
                  >
                    Emby API Token
                  </label>
                  <input
                    type='password'
                    name='emby_token'
                    id='emby_token'
                    className='bg-gray-700 focus:ring-blue-500 focus:border-blue-500 block w-full py-2 px-3 border border-gray-600 rounded-md shadow-sm text-white'
                    placeholder='Your Emby API token'
                    value={config.emby_token}
                    onChange={handleInputChange}
                  />
                  <p className='mt-1 text-sm text-gray-400'>
                    API token from Emby Dashboard {'>'} API Keys
                  </p>
                </div>
              </div>
            </div>

            <div className='mb-8'>
              <h2 className='text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2'>
                Sonarr Configuration
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label
                    htmlFor='sonarr_url'
                    className='block text-sm font-medium text-gray-300 mb-2'
                  >
                    Sonarr Server URL
                  </label>
                  <input
                    type='text'
                    name='sonarr_url'
                    id='sonarr_url'
                    className='bg-gray-700 focus:ring-blue-500 focus:border-blue-500 block w-full py-2 px-3 border border-gray-600 rounded-md shadow-sm text-white'
                    placeholder='http://your-sonarr-server:8989'
                    value={config.sonarr_url}
                    onChange={handleInputChange}
                  />
                  <p className='mt-1 text-sm text-gray-400'>
                    The URL of your Sonarr server including port
                  </p>
                </div>
                <div>
                  <label
                    htmlFor='sonarr_api_key'
                    className='block text-sm font-medium text-gray-300 mb-2'
                  >
                    Sonarr API Key
                  </label>
                  <input
                    type='password'
                    name='sonarr_api_key'
                    id='sonarr_api_key'
                    className='bg-gray-700 focus:ring-blue-500 focus:border-blue-500 block w-full py-2 px-3 border border-gray-600 rounded-md shadow-sm text-white'
                    placeholder='Your Sonarr API key'
                    value={config.sonarr_api_key}
                    onChange={handleInputChange}
                  />
                  <p className='mt-1 text-sm text-gray-400'>
                    API key from Sonarr Settings {'>'} General
                  </p>
                </div>
              </div>
            </div>

            <div className='mb-8'>
              <h2 className='text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2'>
                Radarr Configuration
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <label
                    htmlFor='radarr_url'
                    className='block text-sm font-medium text-gray-300 mb-2'
                  >
                    Radarr Server URL
                  </label>
                  <input
                    type='text'
                    name='radarr_url'
                    id='radarr_url'
                    className='bg-gray-700 focus:ring-blue-500 focus:border-blue-500 block w-full py-2 px-3 border border-gray-600 rounded-md shadow-sm text-white'
                    placeholder='http://your-radarr-server:7878'
                    value={config.radarr_url}
                    onChange={handleInputChange}
                  />
                  <p className='mt-1 text-sm text-gray-400'>
                    The URL of your Radarr server including port
                  </p>
                </div>
                <div>
                  <label
                    htmlFor='radarr_api_key'
                    className='block text-sm font-medium text-gray-300 mb-2'
                  >
                    Radarr API Key
                  </label>
                  <input
                    type='password'
                    name='radarr_api_key'
                    id='radarr_api_key'
                    className='bg-gray-700 focus:ring-blue-500 focus:border-blue-500 block w-full py-2 px-3 border border-gray-600 rounded-md shadow-sm text-white'
                    placeholder='Your Radarr API key'
                    value={config.radarr_api_key}
                    onChange={handleInputChange}
                  />
                  <p className='mt-1 text-sm text-gray-400'>
                    API key from Radarr Settings {'>'} General
                  </p>
                </div>
              </div>
            </div>

            <div className='flex justify-center'>
              <button
                type='submit'
                disabled={saving}
                className={`flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${
                  saving ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors w-full md:w-1/2`}
              >
                {saving ? (
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
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
