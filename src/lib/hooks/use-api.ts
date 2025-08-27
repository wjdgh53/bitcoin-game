// API hooks with React Query for efficient ChromaDB data loading

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthUser } from '@/types/auth';
import { Portfolio, Trade, EducationalContent, Achievement } from '@/types/game';

// API client with error handling
class ApiClient {
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{ success: boolean; user: AuthUser; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, username: string, password: string) {
    return this.request<{ success: boolean; user: AuthUser; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    });
  }

  async logout() {
    return this.request<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request<{ success: boolean; user: AuthUser }>('/api/auth/me');
  }

  // Portfolio endpoints
  async getPortfolio() {
    return this.request<{ success: boolean; portfolio: Portfolio; stats: any }>('/api/portfolio');
  }

  async resetPortfolio() {
    return this.request<{ success: boolean; portfolio: Portfolio }>('/api/portfolio/reset', {
      method: 'POST',
    });
  }

  // Trading endpoints
  async executeTrade(type: 'buy' | 'sell', amount: number, price?: number) {
    return this.request<{ success: boolean; trade: Trade; portfolio: Portfolio }>('/api/trade', {
      method: 'POST',
      body: JSON.stringify({ type, amount, price }),
    });
  }

  async getTradeHistory(limit: number = 100) {
    return this.request<{ success: boolean; trades: Trade[]; total: number }>(`/api/trade/history?limit=${limit}`);
  }

  // Chart endpoints
  async getChartData(timeRange: string = '1d', indicators?: string) {
    const params = new URLSearchParams({ timeRange });
    if (indicators) params.set('indicators', indicators);
    
    return this.request<{
      success: boolean;
      data: any;
      config: any;
      metadata: {
        timeRange: string;
        dataPoints: number;
        latestPrice: number;
        priceChange24h: number;
        volume24h: number;
        lastUpdated: string;
      };
    }>(`/api/chart?${params}`);
  }

  // Education endpoints
  async getEducationalContent(category?: string, difficulty?: number) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (difficulty) params.set('difficulty', difficulty.toString());
    
    return this.request<{ success: boolean; content: EducationalContent[]; total: number }>(`/api/education?${params}`);
  }

  async searchEducationalContent(query: string, filters?: any) {
    return this.request<{ success: boolean; content: EducationalContent[]; total: number }>('/api/education/search', {
      method: 'POST',
      body: JSON.stringify({ query, filters }),
    });
  }

  // Achievement endpoints
  async getUserAchievements() {
    return this.request<{ success: boolean; achievements: Achievement[]; stats: any }>('/api/achievements');
  }

  async getLeaderboard(limit: number = 10) {
    return this.request<{ success: boolean; leaderboard: any[]; userRank: number }>(`/api/leaderboard?limit=${limit}`);
  }
}

export const apiClient = new ApiClient();

// Simple HTTP methods for direct API usage (used by custom hooks like watchlist)
export function useApi() {
  const makeRequest = async (url: string, options?: RequestInit) => {
    try {
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token', // Mock auth for demo
          ...options?.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  };

  return {
    get: (url: string) => makeRequest(url, { method: 'GET' }),
    post: (url: string, body?: any) => makeRequest(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
    put: (url: string, body?: any) => makeRequest(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
    del: (url: string) => makeRequest(url, { method: 'DELETE' }),
  };
}

// React Query hooks with optimized caching

// Auth hooks
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiClient.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      apiClient.login(email, password),
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data);
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ email, username, password }: { email: string; username: string; password: string }) =>
      apiClient.register(email, username, password),
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data);
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

// Portfolio hooks
export function usePortfolio() {
  return useQuery({
    queryKey: ['portfolio'],
    queryFn: () => apiClient.getPortfolio(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 2,
  });
}

export function useResetPortfolio() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiClient.resetPortfolio(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['tradeHistory'] });
    },
  });
}

// Trading hooks
export function useExecuteTrade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ type, amount, price }: { type: 'buy' | 'sell'; amount: number; price?: number }) =>
      apiClient.executeTrade(type, amount, price),
    onSuccess: (data) => {
      // Update portfolio data immediately
      queryClient.setQueryData(['portfolio'], (old: any) => ({
        ...old,
        portfolio: data.portfolio,
      }));
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tradeHistory'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
  });
}

export function useTradeHistory(limit: number = 100) {
  return useQuery({
    queryKey: ['tradeHistory', limit],
    queryFn: () => apiClient.getTradeHistory(limit),
    staleTime: 60 * 1000, // 1 minute
  });
}

// Chart hooks
export function useChartData(timeRange: string = '1d', indicators?: string) {
  return useQuery({
    queryKey: ['chartData', timeRange, indicators],
    queryFn: () => apiClient.getChartData(timeRange, indicators),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute for real-time updates
  });
}

// Real-time price hook with WebSocket simulation
export function useRealTimePrice() {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['realTimePrice'],
    queryFn: () => apiClient.getChartData('1h'), // Get latest price from chart data
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    onSuccess: (data) => {
      // Update chart data cache when price updates
      queryClient.invalidateQueries({ queryKey: ['chartData'] });
    },
  });
}

// Education hooks
export function useEducationalContent(category?: string, difficulty?: number) {
  return useQuery({
    queryKey: ['educationalContent', category, difficulty],
    queryFn: () => apiClient.getEducationalContent(category, difficulty),
    staleTime: 10 * 60 * 1000, // 10 minutes (education content doesn't change often)
  });
}

export function useSearchEducationalContent() {
  return useMutation({
    mutationFn: ({ query, filters }: { query: string; filters?: any }) =>
      apiClient.searchEducationalContent(query, filters),
  });
}

// Achievement hooks
export function useUserAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: () => apiClient.getUserAchievements(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useLeaderboard(limit: number = 10) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: () => apiClient.getLeaderboard(limit),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Optimized data prefetching
export function usePrefetchData() {
  const queryClient = useQueryClient();
  
  return {
    prefetchPortfolio: () => {
      queryClient.prefetchQuery({
        queryKey: ['portfolio'],
        queryFn: () => apiClient.getPortfolio(),
        staleTime: 30 * 1000,
      });
    },
    
    prefetchChartData: (timeRange: string = '1d') => {
      queryClient.prefetchQuery({
        queryKey: ['chartData', timeRange],
        queryFn: () => apiClient.getChartData(timeRange),
        staleTime: 30 * 1000,
      });
    },
    
    prefetchEducation: () => {
      queryClient.prefetchQuery({
        queryKey: ['educationalContent'],
        queryFn: () => apiClient.getEducationalContent(),
        staleTime: 10 * 60 * 1000,
      });
    },
  };
}

// Error boundary hook for handling API errors
export function useApiError() {
  const queryClient = useQueryClient();
  
  const clearErrorQueries = () => {
    queryClient.invalidateQueries({ type: 'all' });
  };
  
  const retryFailedQueries = () => {
    queryClient.refetchQueries({ type: 'all' });
  };
  
  return { clearErrorQueries, retryFailedQueries };
}