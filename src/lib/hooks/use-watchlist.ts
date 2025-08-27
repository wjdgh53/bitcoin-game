// React hook for Watchlist management

import { useState, useEffect, useCallback } from 'react';
import { useApi } from './use-api';
import { 
  WatchlistItemInput, 
  WatchlistItemOutput, 
  WatchlistItemUpdateInput,
  WatchlistSearchResult,
  WatchlistAnalytics 
} from '@/types/watchlist';

interface UseWatchlistOptions {
  autoLoad?: boolean;
  initialLimit?: number;
}

export function useWatchlist(options: UseWatchlistOptions = {}) {
  const [items, setItems] = useState<WatchlistItemOutput[]>([]);
  const [searchResults, setSearchResults] = useState<WatchlistSearchResult[]>([]);
  const [analytics, setAnalytics] = useState<WatchlistAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { post, get, put, del } = useApi();

  const createWatchlistItem = useCallback(async (data: WatchlistItemInput): Promise<WatchlistItemOutput> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await post('/api/watchlist', data);
      if (response.success) {
        // Add to local state
        setItems(prev => [response.data, ...prev]);
        return response.data;
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create watchlist item';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [post]);

  const loadWatchlistItems = useCallback(async (limit: number = 50, offset: number = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await get(`/api/watchlist?limit=${limit}&offset=${offset}`);
      if (response.success) {
        if (offset === 0) {
          setItems(response.data);
        } else {
          setItems(prev => [...prev, ...response.data]);
        }
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load watchlist items';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [get]);

  const updateWatchlistItem = useCallback(async (
    itemId: string, 
    data: WatchlistItemUpdateInput
  ): Promise<WatchlistItemOutput> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await put(`/api/watchlist/${itemId}`, data);
      if (response.success) {
        // Update local state
        setItems(prev => prev.map(item => 
          item.id === itemId ? response.data : item
        ));
        return response.data;
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update watchlist item';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [put]);

  const deleteWatchlistItem = useCallback(async (itemId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await del(`/api/watchlist/${itemId}`);
      if (response.success) {
        // Remove from local state
        setItems(prev => prev.filter(item => item.id !== itemId));
        setSearchResults(prev => prev.filter(result => result.id !== itemId));
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete watchlist item';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [del]);

  const searchWatchlistItems = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        query,
        limit: '20'
      });
      
      const response = await get(`/api/watchlist?${params.toString()}`);
      if (response.success) {
        setSearchResults(response.data);
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
    } finally {
      setSearchLoading(false);
    }
  }, [get]);

  const loadAnalytics = useCallback(async () => {
    try {
      const response = await get('/api/watchlist/analytics');
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (err) {
      console.warn('Failed to load watchlist analytics:', err);
    }
  }, [get]);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
  }, []);

  // Auto-load items on mount if requested
  useEffect(() => {
    if (options.autoLoad) {
      loadWatchlistItems(options.initialLimit);
      loadAnalytics();
    }
  }, [options.autoLoad, options.initialLimit, loadWatchlistItems, loadAnalytics]);

  return {
    // Data
    items,
    searchResults,
    analytics,
    
    // Loading states
    loading,
    searchLoading,
    error,
    
    // Actions
    createWatchlistItem,
    loadWatchlistItems,
    updateWatchlistItem,
    deleteWatchlistItem,
    searchWatchlistItems,
    clearSearch,
    loadAnalytics
  };
}