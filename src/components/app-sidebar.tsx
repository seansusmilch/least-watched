'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  TrendingDown,
  Settings,
  ScrollText,
  Library,
  Eye,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const navigation = [
  { name: 'Least Watched', href: '/', icon: TrendingDown },
  { name: 'Media Library', href: '/media', icon: Library },
  { name: 'Events', href: '/events', icon: ScrollText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible='icon' className='border-r'>
      <SidebarHeader className='pb-4'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <Link href='/'>
                <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0'>
                  <Eye className='size-4' />
                </div>
                <div className='grid flex-1 text-left leading-tight'>
                  <span className='truncate font-semibold tracking-tight text-sm'>
                    Least Watched
                  </span>
                  <span className='truncate text-[11px] text-muted-foreground font-medium uppercase tracking-widest'>
                    Media Manager
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className='text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 px-2'>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className='gap-0.5'>
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={
                        isActive
                          ? 'text-primary font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      }
                    >
                      <Link href={item.href}>
                        <item.icon
                          className={isActive ? 'text-primary' : undefined}
                        />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
