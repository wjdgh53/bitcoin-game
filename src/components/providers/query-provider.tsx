// React Query provider with optimized configuration

'use client';

import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface QueryProviderProps {
  children: ReactNode;
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time - how long data is considered fresh
        staleTime: 30 * 1000, // 30 seconds
        
        // Cache time - how long data stays in cache after being unused
        gcTime: 5 * 60 * 1000, // 5 minutes
        
        // Retry configuration
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        
        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Refetch on window focus for real-time data
        refetchOnWindowFocus: true,
        
        // Refetch on reconnect
        refetchOnReconnect: true,
        
        // Background refetch interval for critical data
        refetchInterval: false, // Set per query as needed
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
      },
    },
  });
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create a stable query client instance
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Development tools (only in development)
export function QueryDevtools() {
  if (process.env.NODE_ENV === 'development') {
    // Lazy load devtools to avoid including in production bundle
    const { ReactQueryDevtools } = require('@tanstack/react-query-devtools');
    return <ReactQueryDevtools initialIsOpen={false} />;
  }
  return null;
}