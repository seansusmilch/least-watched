'use client';

import { useEffect, useState } from 'react';

export default function FooterWithYear() {
  const [year, setYear] = useState<string>('');

  useEffect(() => {
    setYear(new Date().getFullYear().toString());
  }, []);

  return (
    <div className='text-sm text-gray-400 mb-2 md:mb-0'>
      &copy; {year} Least-Watched Media
    </div>
  );
}
