'use client';

import { QueryClient } from '@tanstack/react-query';
import { create } from 'zustand';

interface QueryClientStore {
  queryClient: QueryClient;
}

export const useQueryClientStore = create<QueryClientStore>(() => ({
  queryClient: new QueryClient(),
}));
