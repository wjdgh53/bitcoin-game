// React hook for Trading Notes management

import { useState, useEffect, useCallback } from 'react';
import { 
  TradingNoteInput, 
  TradingNoteOutput, 
  TradingNoteUpdateInput,
  TradingNoteSearchResult,
  TradingNotesAnalytics 
} from '@/types/trading-notes';

interface UseTradingNotesOptions {
  autoLoad?: boolean;
  initialLimit?: number;
}

// API helper functions
const apiRequest = async (url: string, options?: RequestInit) => {
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
};

export function useTradingNotes(options: UseTradingNotesOptions = {}) {
  const [notes, setNotes] = useState<TradingNoteOutput[]>([]);
  const [searchResults, setSearchResults] = useState<TradingNoteSearchResult[]>([]);
  const [analytics, setAnalytics] = useState<TradingNotesAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNote = useCallback(async (data: TradingNoteInput): Promise<TradingNoteOutput> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest('/api/trading-notes', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (response.success) {
        // Add to local state
        setNotes(prev => [response.data, ...prev]);
        return response.data;
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create note';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNotes = useCallback(async (limit: number = 50, offset: number = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest(`/api/trading-notes?limit=${limit}&offset=${offset}`);
      if (response.success) {
        if (offset === 0) {
          setNotes(response.data);
        } else {
          setNotes(prev => [...prev, ...response.data]);
        }
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load notes';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateNote = useCallback(async (
    noteId: string, 
    data: TradingNoteUpdateInput
  ): Promise<TradingNoteOutput> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest(`/api/trading-notes/${noteId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (response.success) {
        // Update local state
        setNotes(prev => prev.map(note => 
          note.id === noteId ? response.data : note
        ));
        return response.data;
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update note';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteNote = useCallback(async (noteId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest(`/api/trading-notes/${noteId}`, {
        method: 'DELETE',
      });
      if (response.success) {
        // Remove from local state
        setNotes(prev => prev.filter(note => note.id !== noteId));
        setSearchResults(prev => prev.filter(result => result.id !== noteId));
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete note';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchNotes = useCallback(async (
    query: string, 
    includePublic: boolean = false
  ) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        query,
        includePublic: includePublic.toString()
      });
      
      const response = await apiRequest(`/api/trading-notes?${params.toString()}`);
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
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const response = await apiRequest('/api/trading-notes/analytics');
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (err) {
      console.warn('Failed to load analytics:', err);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
  }, []);

  // Auto-load notes on mount if requested
  useEffect(() => {
    if (options.autoLoad) {
      loadNotes(options.initialLimit);
      loadAnalytics();
    }
  }, [options.autoLoad, options.initialLimit, loadNotes, loadAnalytics]);

  return {
    // Data
    notes,
    searchResults,
    analytics,
    
    // Loading states
    loading,
    searchLoading,
    error,
    
    // Actions
    createNote,
    loadNotes,
    updateNote,
    deleteNote,
    searchNotes,
    clearSearch,
    loadAnalytics
  };
}