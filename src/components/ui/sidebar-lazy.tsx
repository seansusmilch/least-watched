'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Skeleton } from './skeleton';

// Lazy load the main sidebar component
const SidebarComponent = dynamic(() => import('./sidebar').then(mod => ({ default: mod.Sidebar })), {
  loading: () => <Skeleton className="h-full w-64" />,
  ssr: false,
});

// Lazy load sidebar content components
const SidebarContent = dynamic(() => import('./sidebar').then(mod => ({ default: mod.SidebarContent })), {
  ssr: false,
});

const SidebarHeader = dynamic(() => import('./sidebar').then(mod => ({ default: mod.SidebarHeader })), {
  ssr: false,
});

const SidebarFooter = dynamic(() => import('./sidebar').then(mod => ({ default: mod.SidebarFooter })), {
  ssr: false,
});

const SidebarGroup = dynamic(() => import('./sidebar').then(mod => ({ default: mod.SidebarGroup })), {
  ssr: false,
});

const SidebarMenu = dynamic(() => import('./sidebar').then(mod => ({ default: mod.SidebarMenu })), {
  ssr: false,
});

const SidebarMenuItem = dynamic(() => import('./sidebar').then(mod => ({ default: mod.SidebarMenuItem })), {
  ssr: false,
});

const SidebarMenuButton = dynamic(() => import('./sidebar').then(mod => ({ default: mod.SidebarMenuButton })), {
  ssr: false,
});

const SidebarTrigger = dynamic(() => import('./sidebar').then(mod => ({ default: mod.SidebarTrigger })), {
  ssr: false,
});

const SidebarProvider = dynamic(() => import('./sidebar').then(mod => ({ default: mod.SidebarProvider })), {
  ssr: false,
});

const useSidebar = dynamic(() => import('./sidebar').then(mod => ({ default: mod.useSidebar })), {
  ssr: false,
});

// Wrapper component that provides lazy loading
export function LazySidebar({ children, ...props }: React.ComponentProps<typeof SidebarComponent>) {
  return (
    <Suspense fallback={<Skeleton className="h-full w-64" />}>
      <SidebarComponent {...props}>
        {children}
      </SidebarComponent>
    </Suspense>
  );
}

// Export all the lazy components
export {
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarProvider,
  useSidebar,
};