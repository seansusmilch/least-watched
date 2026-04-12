'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingDown, Library, ScrollText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Home', href: '/', icon: TrendingDown },
  { name: 'Library', href: '/media', icon: Library },
  { name: 'Events', href: '/events', icon: ScrollText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className='fixed bottom-0 inset-x-0 z-50 sm:hidden'>
      {/* Glass bar */}
      <div
        className={cn(
          'mx-3 mb-3 rounded-2xl',
          'bg-background/70 backdrop-blur-xl',
          'border border-border/50',
          'shadow-lg shadow-black/10',
          'dark:bg-background/60 dark:border-white/10 dark:shadow-black/40'
        )}
      >
        <div className='flex items-center justify-around px-2 py-1.5'>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className='flex flex-col items-center gap-0.5 flex-1 py-1 min-w-0'
                aria-current={isActive ? 'page' : undefined}
              >
                <span
                  className={cn(
                    'flex items-center justify-center rounded-xl w-12 h-7 transition-all duration-200',
                    isActive
                      ? 'bg-primary/15 dark:bg-primary/25'
                      : 'bg-transparent'
                  )}
                >
                  <item.icon
                    className={cn(
                      'size-5 transition-colors duration-200',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                    strokeWidth={isActive ? 2.2 : 1.7}
                  />
                </span>
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors duration-200 truncate',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
