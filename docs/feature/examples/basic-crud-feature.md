# Complete CRUD Feature Example: Trading Notes

This document demonstrates a complete CRUD feature implementation following the Bitcoin Trading Game development patterns.

## Feature Overview

**Trading Notes** allows users to create, read, update, and delete personal notes about their trading decisions, market observations, and strategies. The feature includes:
- Full CRUD operations with database persistence
- ChromaDB integration for semantic search
- Real-time search across all user notes
- Integration with Bitcoin price data
- AI agent analysis capabilities

## 1. Database Schema (Prisma)

```prisma
// prisma/schema.prisma - Add to existing schema

model TradingNote {
  id          String   @id @default(cuid())
  userId      String
  title       String
  content     String
  tags        String[] // Array of tags for categorization
  bitcoinPrice Float?  // BTC price when note was created
  priceChange24h Float? // Price change percentage
  sentiment   String?  // 'bullish', 'bearish', 'neutral'
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([createdAt])
  @@index([sentiment])
  @@map("trading_notes")
}

// Update User model to include relation
model User {
  // ... existing fields ...
  tradingNotes TradingNote[]
}
```

## 2. TypeScript Types

```typescript
// src/types/trading-notes.ts

export interface TradingNoteInput {
  title: string;
  content: string;
  tags?: string[];
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  isPublic?: boolean;
}

export interface TradingNoteOutput {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  bitcoinPrice?: number;
  priceChange24h?: number;
  sentiment?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TradingNoteSearchResult {
  id: string;
  title: string;
  content: string;
  tags: string[];
  sentiment?: string;
  relevanceScore?: number;
  createdAt: Date;
}

export interface TradingNoteUpdateInput {
  title?: string;
  content?: string;
  tags?: string[];
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  isPublic?: boolean;
}

export interface TradingNotesAnalytics {
  totalNotes: number;
  sentimentBreakdown: {
    bullish: number;
    bearish: number;
    neutral: number;
  };
  topTags: Array<{ tag: string; count: number }>;
  averageNotesPerDay: number;
}
```

## 3. ChromaDB Setup

```typescript
// src/lib/database/trading-notes-chroma.ts

import { ChromaClient } from 'chromadb';
import { TradingNoteOutput } from '@/types/trading-notes';

const COLLECTION_NAME = 'trading_notes';

export async function setupTradingNotesCollection() {
  const chroma = new ChromaClient({
    path: process.env.CHROMADB_PATH || './chroma_data'
  });

  try {
    return await chroma.getCollection({ name: COLLECTION_NAME });
  } catch {
    return await chroma.createCollection({
      name: COLLECTION_NAME,
      metadata: {
        description: 'User trading notes and observations',
        category: 'user_content',
        version: '1.0',
        searchable_fields: ['title', 'content', 'tags', 'sentiment']
      }
    });
  }
}

export function tradingNoteToDocument(note: TradingNoteOutput) {
  return {
    id: note.id,
    document: `${note.title}\n\n${note.content}\n\nTags: ${note.tags.join(', ')}\nSentiment: ${note.sentiment || 'neutral'}`,
    metadata: {
      user_id: note.userId,
      title: note.title,
      sentiment: note.sentiment || 'neutral',
      tags: note.tags.join(','),
      bitcoin_price: note.bitcoinPrice || 0,
      price_change_24h: note.priceChange24h || 0,
      is_public: note.isPublic,
      created_at: note.createdAt.toISOString(),
      updated_at: note.updatedAt.toISOString()
    }
  };
}
```

## 4. Service Layer

```typescript
// src/lib/services/trading-notes-service.ts

import { ChromaClient } from 'chromadb';
import { prisma } from '@/lib/database/prisma-client';
import { bitcoinAPI } from './bitcoin-api';
import { 
  TradingNoteInput, 
  TradingNoteOutput, 
  TradingNoteUpdateInput,
  TradingNoteSearchResult,
  TradingNotesAnalytics 
} from '@/types/trading-notes';
import { setupTradingNotesCollection, tradingNoteToDocument } from '@/lib/database/trading-notes-chroma';
import { ValidationUtils } from '@/lib/validation/schemas';

export class TradingNotesService {
  private chroma: ChromaClient;
  private collection: any = null;
  private collectionName = 'trading_notes';

  constructor() {
    this.chroma = new ChromaClient({
      path: process.env.CHROMADB_PATH || './chroma_data'
    });
  }

  async initialize(): Promise<void> {
    this.collection = await setupTradingNotesCollection();
  }

  /**
   * Create a new trading note
   */
  async createNote(userId: string, data: TradingNoteInput): Promise<TradingNoteOutput> {
    await this.ensureInitialized();
    
    // Validate input
    const validatedData = ValidationUtils.validateTradingNoteInput({
      ...data,
      userId
    });

    // Get current Bitcoin price for context
    let bitcoinPrice: number | undefined;
    let priceChange24h: number | undefined;
    
    try {
      const currentPriceData = await bitcoinAPI.getCurrentPrice();
      bitcoinPrice = currentPriceData.price;
      priceChange24h = currentPriceData.priceChange24h;
    } catch (error) {
      console.warn('Failed to fetch Bitcoin price for note:', error);
    }

    // Create in database
    const note = await prisma.tradingNote.create({
      data: {
        ...validatedData,
        bitcoinPrice,
        priceChange24h
      },
      include: {
        user: {
          select: { id: true, email: true }
        }
      }
    });

    // Store in ChromaDB for search
    await this.storeInChroma(note);

    console.log(`✅ Created trading note: ${note.title}`);
    return this.transformToOutput(note);
  }

  /**
   * Get a specific note by ID
   */
  async getNoteById(noteId: string, userId: string): Promise<TradingNoteOutput | null> {
    const note = await prisma.tradingNote.findFirst({
      where: {
        id: noteId,
        OR: [
          { userId }, // User's own note
          { isPublic: true } // Public note
        ]
      }
    });

    return note ? this.transformToOutput(note) : null;
  }

  /**
   * Get all notes for a user
   */
  async getUserNotes(userId: string, limit: number = 50, offset: number = 0): Promise<TradingNoteOutput[]> {
    const notes = await prisma.tradingNote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    return notes.map(note => this.transformToOutput(note));
  }

  /**
   * Update a trading note
   */
  async updateNote(noteId: string, userId: string, data: TradingNoteUpdateInput): Promise<TradingNoteOutput | null> {
    await this.ensureInitialized();
    
    // Validate input
    const validatedData = ValidationUtils.validateTradingNoteUpdateInput(data);

    // Update in database
    try {
      const updatedNote = await prisma.tradingNote.update({
        where: {
          id: noteId,
          userId // Ensure user owns the note
        },
        data: validatedData
      });

      // Update in ChromaDB
      await this.updateInChroma(updatedNote);

      console.log(`✅ Updated trading note: ${updatedNote.title}`);
      return this.transformToOutput(updatedNote);
    } catch (error) {
      console.error('Failed to update note:', error);
      return null;
    }
  }

  /**
   * Delete a trading note
   */
  async deleteNote(noteId: string, userId: string): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      // Delete from database
      await prisma.tradingNote.delete({
        where: {
          id: noteId,
          userId // Ensure user owns the note
        }
      });

      // Delete from ChromaDB
      await this.deleteFromChroma(noteId);

      console.log(`✅ Deleted trading note: ${noteId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete note:', error);
      return false;
    }
  }

  /**
   * Search notes using ChromaDB semantic search
   */
  async searchNotes(
    userId: string, 
    query: string, 
    includePublic: boolean = false,
    limit: number = 10
  ): Promise<TradingNoteSearchResult[]> {
    await this.ensureInitialized();

    try {
      const whereClause = includePublic 
        ? { $or: [{ user_id: userId }, { is_public: true }] }
        : { user_id: userId };

      const results = await this.collection.query({
        queryTexts: [query],
        nResults: limit,
        where: whereClause,
        include: ['documents', 'metadatas', 'distances']
      });

      if (!results.documents || !results.documents[0] || !results.metadatas || !results.metadatas[0]) {
        return [];
      }

      const searchResults: TradingNoteSearchResult[] = [];
      
      for (let i = 0; i < results.documents[0].length; i++) {
        const metadata = results.metadatas[0][i];
        const relevanceScore = results.distances ? (1 - results.distances[0][i]) : undefined;
        
        searchResults.push({
          id: metadata.id,
          title: metadata.title,
          content: results.documents[0][i].split('\n\n')[1] || '', // Extract content part
          tags: metadata.tags ? metadata.tags.split(',') : [],
          sentiment: metadata.sentiment,
          relevanceScore,
          createdAt: new Date(metadata.created_at)
        });
      }

      return searchResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  /**
   * Get notes by sentiment
   */
  async getNotesBySentiment(
    userId: string, 
    sentiment: 'bullish' | 'bearish' | 'neutral'
  ): Promise<TradingNoteOutput[]> {
    const notes = await prisma.tradingNote.findMany({
      where: {
        userId,
        sentiment
      },
      orderBy: { createdAt: 'desc' }
    });

    return notes.map(note => this.transformToOutput(note));
  }

  /**
   * Get analytics for user's notes
   */
  async getNotesAnalytics(userId: string): Promise<TradingNotesAnalytics> {
    const notes = await prisma.tradingNote.findMany({
      where: { userId },
      select: {
        sentiment: true,
        tags: true,
        createdAt: true
      }
    });

    // Calculate sentiment breakdown
    const sentimentBreakdown = {
      bullish: notes.filter(n => n.sentiment === 'bullish').length,
      bearish: notes.filter(n => n.sentiment === 'bearish').length,
      neutral: notes.filter(n => n.sentiment === 'neutral' || !n.sentiment).length
    };

    // Calculate top tags
    const tagCounts = new Map<string, number>();
    notes.forEach(note => {
      note.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const topTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate average notes per day
    const firstNote = notes[notes.length - 1];
    const daysSinceFirst = firstNote 
      ? Math.max(1, Math.floor((Date.now() - firstNote.createdAt.getTime()) / (1000 * 60 * 60 * 24)))
      : 1;
    const averageNotesPerDay = notes.length / daysSinceFirst;

    return {
      totalNotes: notes.length,
      sentimentBreakdown,
      topTags,
      averageNotesPerDay: Math.round(averageNotesPerDay * 100) / 100
    };
  }

  /**
   * Get public notes (for community features)
   */
  async getPublicNotes(limit: number = 20, offset: number = 0): Promise<TradingNoteOutput[]> {
    const notes = await prisma.tradingNote.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: { email: true } // Only include email for attribution
        }
      }
    });

    return notes.map(note => ({
      ...this.transformToOutput(note),
      // Add user email for public notes
      userEmail: note.user.email
    }));
  }

  // Private helper methods
  private async storeInChroma(note: any): Promise<void> {
    const document = tradingNoteToDocument(note);
    
    await this.collection.add({
      ids: [document.id],
      documents: [document.document],
      metadatas: [document.metadata]
    });
  }

  private async updateInChroma(note: any): Promise<void> {
    const document = tradingNoteToDocument(note);
    
    await this.collection.update({
      ids: [document.id],
      documents: [document.document],
      metadatas: [document.metadata]
    });
  }

  private async deleteFromChroma(noteId: string): Promise<void> {
    await this.collection.delete({ ids: [noteId] });
  }

  private transformToOutput(note: any): TradingNoteOutput {
    return {
      id: note.id,
      userId: note.userId,
      title: note.title,
      content: note.content,
      tags: note.tags,
      bitcoinPrice: note.bitcoinPrice,
      priceChange24h: note.priceChange24h,
      sentiment: note.sentiment,
      isPublic: note.isPublic,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    };
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.collection) {
      await this.initialize();
    }
  }
}

// Export singleton instance
export const tradingNotesService = new TradingNotesService();
```

## 5. API Routes

```typescript
// src/app/api/trading-notes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { tradingNotesService } from '@/lib/services/trading-notes-service';
import { validateAuth } from '@/lib/middleware/auth';
import { z } from 'zod';

const CreateNoteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  tags: z.array(z.string()).optional().default([]),
  sentiment: z.enum(['bullish', 'bearish', 'neutral']).optional(),
  isPublic: z.boolean().optional().default(false)
});

const SearchSchema = z.object({
  query: z.string().min(1),
  includePublic: z.boolean().optional().default(false),
  limit: z.number().min(1).max(50).optional().default(10)
});

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const user = await validateAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreateNoteSchema.parse(body);

    const note = await tradingNotesService.createNote(user.id, validatedData);

    return NextResponse.json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Note creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await validateAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (query) {
      // Search notes
      const searchData = SearchSchema.parse({
        query,
        includePublic: searchParams.get('includePublic') === 'true',
        limit: Math.min(limit, 50)
      });

      const results = await tradingNotesService.searchNotes(
        user.id,
        searchData.query,
        searchData.includePublic,
        searchData.limit
      );

      return NextResponse.json({
        success: true,
        data: results
      });
    } else {
      // Get all user notes
      const notes = await tradingNotesService.getUserNotes(user.id, limit, offset);

      return NextResponse.json({
        success: true,
        data: notes
      });
    }
  } catch (error) {
    console.error('Notes retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve notes' },
      { status: 500 }
    );
  }
}
```

```typescript
// src/app/api/trading-notes/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { tradingNotesService } from '@/lib/services/trading-notes-service';
import { validateAuth } from '@/lib/middleware/auth';
import { z } from 'zod';

const UpdateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(5000).optional(),
  tags: z.array(z.string()).optional(),
  sentiment: z.enum(['bullish', 'bearish', 'neutral']).optional(),
  isPublic: z.boolean().optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await validateAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const note = await tradingNotesService.getNoteById(params.id, user.id);
    
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Note retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve note' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await validateAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UpdateNoteSchema.parse(body);

    const updatedNote = await tradingNotesService.updateNote(
      params.id,
      user.id,
      validatedData
    );

    if (!updatedNote) {
      return NextResponse.json({ error: 'Note not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedNote
    });
  } catch (error) {
    console.error('Note update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await validateAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deleted = await tradingNotesService.deleteNote(params.id, user.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Note not found or deletion failed' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Note deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
```

```typescript
// src/app/api/trading-notes/analytics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { tradingNotesService } from '@/lib/services/trading-notes-service';
import { validateAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await validateAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analytics = await tradingNotesService.getNotesAnalytics(user.id);

    return NextResponse.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Analytics retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics' },
      { status: 500 }
    );
  }
}
```

## 6. React Hook

```typescript
// src/lib/hooks/use-trading-notes.ts

import { useState, useEffect, useCallback } from 'react';
import { useApi } from './use-api';
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

export function useTradingNotes(options: UseTradingNotesOptions = {}) {
  const [notes, setNotes] = useState<TradingNoteOutput[]>([]);
  const [searchResults, setSearchResults] = useState<TradingNoteSearchResult[]>([]);
  const [analytics, setAnalytics] = useState<TradingNotesAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { post, get, put, del } = useApi();

  const createNote = useCallback(async (data: TradingNoteInput): Promise<TradingNoteOutput> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await post('/api/trading-notes', data);
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
  }, [post]);

  const loadNotes = useCallback(async (limit: number = 50, offset: number = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await get(`/api/trading-notes?limit=${limit}&offset=${offset}`);
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
  }, [get]);

  const updateNote = useCallback(async (
    noteId: string, 
    data: TradingNoteUpdateInput
  ): Promise<TradingNoteOutput> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await put(`/api/trading-notes/${noteId}`, data);
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
  }, [put]);

  const deleteNote = useCallback(async (noteId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await del(`/api/trading-notes/${noteId}`);
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
  }, [del]);

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
      
      const response = await get(`/api/trading-notes?${params.toString()}`);
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
      const response = await get('/api/trading-notes/analytics');
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (err) {
      console.warn('Failed to load analytics:', err);
    }
  }, [get]);

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
```

## 7. Tests

```typescript
// tests/services/trading-notes-service.test.ts

import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { tradingNotesService } from '@/lib/services/trading-notes-service';
import { prisma } from '@/lib/database/prisma-client';
import { TradingNoteInput } from '@/types/trading-notes';

describe('TradingNotesService', () => {
  const testUserId = 'test-user-123';
  const createdNoteIds: string[] = [];

  beforeAll(async () => {
    await tradingNotesService.initialize();
  });

  afterEach(async () => {
    // Clean up created notes
    for (const noteId of createdNoteIds) {
      try {
        await tradingNotesService.deleteNote(noteId, testUserId);
      } catch (error) {
        // Note may already be deleted
      }
    }
    createdNoteIds.length = 0;
  });

  describe('createNote', () => {
    test('should create note successfully', async () => {
      const input: TradingNoteInput = {
        title: 'Test Trading Note',
        content: 'This is a test note about Bitcoin trends.',
        tags: ['bitcoin', 'analysis', 'bullish'],
        sentiment: 'bullish',
        isPublic: false
      };

      const result = await tradingNotesService.createNote(testUserId, input);
      createdNoteIds.push(result.id);
      
      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.userId).toBe(testUserId);
      expect(result.title).toBe(input.title);
      expect(result.content).toBe(input.content);
      expect(result.tags).toEqual(input.tags);
      expect(result.sentiment).toBe(input.sentiment);
      expect(result.isPublic).toBe(input.isPublic);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    test('should include Bitcoin price data', async () => {
      const input: TradingNoteInput = {
        title: 'Price Context Note',
        content: 'Note with price context.',
        tags: ['price'],
        sentiment: 'neutral'
      };

      const result = await tradingNotesService.createNote(testUserId, input);
      createdNoteIds.push(result.id);
      
      // Bitcoin price should be included (mock may return undefined)
      expect(typeof result.bitcoinPrice).toBe('number');
    });
  });

  describe('searchNotes', () => {
    test('should find notes by semantic search', async () => {
      // Create test notes
      const note1 = await tradingNotesService.createNote(testUserId, {
        title: 'Bitcoin Bull Market Analysis',
        content: 'Bitcoin is showing strong upward momentum.',
        tags: ['bitcoin', 'bullish'],
        sentiment: 'bullish'
      });
      createdNoteIds.push(note1.id);

      const note2 = await tradingNotesService.createNote(testUserId, {
        title: 'Bear Market Concerns',
        content: 'Worried about potential downward trends.',
        tags: ['bearish', 'concerns'],
        sentiment: 'bearish'
      });
      createdNoteIds.push(note2.id);

      // Wait a bit for ChromaDB indexing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Search for bullish content
      const bullishResults = await tradingNotesService.searchNotes(testUserId, 'bull market upward');
      
      expect(bullishResults).toBeInstanceOf(Array);
      expect(bullishResults.length).toBeGreaterThan(0);
      
      const foundBullishNote = bullishResults.find(r => r.id === note1.id);
      expect(foundBullishNote).toBeDefined();
      expect(foundBullishNote?.sentiment).toBe('bullish');
    });

    test('should respect user privacy in search', async () => {
      const privateNote = await tradingNotesService.createNote(testUserId, {
        title: 'Private Trading Strategy',
        content: 'Secret strategy details.',
        tags: ['private'],
        isPublic: false
      });
      createdNoteIds.push(privateNote.id);

      const otherUserId = 'other-user-456';
      
      // Other user shouldn't find private notes
      const results = await tradingNotesService.searchNotes(otherUserId, 'trading strategy');
      const foundPrivateNote = results.find(r => r.id === privateNote.id);
      
      expect(foundPrivateNote).toBeUndefined();
    });
  });

  describe('updateNote', () => {
    test('should update note successfully', async () => {
      const original = await tradingNotesService.createNote(testUserId, {
        title: 'Original Title',
        content: 'Original content.',
        sentiment: 'neutral'
      });
      createdNoteIds.push(original.id);

      const updated = await tradingNotesService.updateNote(original.id, testUserId, {
        title: 'Updated Title',
        sentiment: 'bullish'
      });
      
      expect(updated).toBeDefined();
      expect(updated!.title).toBe('Updated Title');
      expect(updated!.content).toBe('Original content.'); // Should remain unchanged
      expect(updated!.sentiment).toBe('bullish');
      expect(updated!.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
    });
  });

  describe('getNotesAnalytics', () => {
    test('should calculate analytics correctly', async () => {
      // Create test notes with different sentiments
      const notes = [
        { sentiment: 'bullish', tags: ['bitcoin', 'moon'] },
        { sentiment: 'bullish', tags: ['bitcoin', 'hodl'] },
        { sentiment: 'bearish', tags: ['crash', 'sell'] },
        { sentiment: 'neutral', tags: ['analysis'] }
      ];

      for (const noteData of notes) {
        const note = await tradingNotesService.createNote(testUserId, {
          title: `Test Note ${noteData.sentiment}`,
          content: 'Test content',
          tags: noteData.tags,
          sentiment: noteData.sentiment as any
        });
        createdNoteIds.push(note.id);
      }

      const analytics = await tradingNotesService.getNotesAnalytics(testUserId);
      
      expect(analytics.totalNotes).toBe(4);
      expect(analytics.sentimentBreakdown.bullish).toBe(2);
      expect(analytics.sentimentBreakdown.bearish).toBe(1);
      expect(analytics.sentimentBreakdown.neutral).toBe(1);
      
      const bitcoinTag = analytics.topTags.find(t => t.tag === 'bitcoin');
      expect(bitcoinTag?.count).toBe(2);
    });
  });
});
```

```typescript
// tests/api/trading-notes.test.ts

import { describe, test, expect } from '@jest/globals';
import { POST, GET } from '@/app/api/trading-notes/route';
import { NextRequest } from 'next/server';

// Mock auth middleware
jest.mock('@/lib/middleware/auth', () => ({
  validateAuth: jest.fn().mockResolvedValue({ id: 'test-user-123', email: 'test@example.com' })
}));

describe('/api/trading-notes', () => {
  describe('POST', () => {
    test('should create note with valid data', async () => {
      const validNoteData = {
        title: 'Test API Note',
        content: 'This is a test note via API.',
        tags: ['test', 'api'],
        sentiment: 'neutral',
        isPublic: false
      };

      const request = new NextRequest('http://localhost/api/trading-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify(validNoteData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.title).toBe(validNoteData.title);
    });

    test('should reject invalid data', async () => {
      const invalidData = {
        title: '', // Empty title should fail
        content: 'Valid content'
      };

      const request = new NextRequest('http://localhost/api/trading-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
      expect(data.details).toBeDefined();
    });
  });

  describe('GET', () => {
    test('should return user notes', async () => {
      const request = new NextRequest('http://localhost/api/trading-notes?limit=10', {
        headers: { 'Authorization': 'Bearer valid-token' }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
    });

    test('should handle search queries', async () => {
      const request = new NextRequest('http://localhost/api/trading-notes?query=bitcoin&limit=5', {
        headers: { 'Authorization': 'Bearer valid-token' }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
    });
  });
});
```

## 8. Frontend Component Example

```tsx
// src/components/trading-notes/TradingNotesManager.tsx

'use client';

import { useState } from 'react';
import { useTradingNotes } from '@/lib/hooks/use-trading-notes';
import { TradingNoteInput, TradingNoteUpdateInput } from '@/types/trading-notes';
import { Search, Plus, Edit, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function TradingNotesManager() {
  const {
    notes,
    searchResults,
    analytics,
    loading,
    searchLoading,
    error,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
    clearSearch
  } = useTradingNotes({ autoLoad: true });

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [newNote, setNewNote] = useState<TradingNoteInput>({
    title: '',
    content: '',
    tags: [],
    sentiment: undefined,
    isPublic: false
  });

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await searchNotes(query, false);
    } else {
      clearSearch();
    }
  };

  const handleCreateNote = async () => {
    try {
      await createNote(newNote);
      setNewNote({
        title: '',
        content: '',
        tags: [],
        sentiment: undefined,
        isPublic: false
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(noteId);
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'bullish':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'bearish':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const displayNotes = searchQuery.trim() ? searchResults : notes;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Trading Notes</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </button>
        </div>

        {/* Analytics Summary */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold">Total Notes</h3>
              <p className="text-2xl font-bold text-blue-600">{analytics.totalNotes}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold">Bullish</h3>
              <p className="text-2xl font-bold text-green-600">{analytics.sentimentBreakdown.bullish}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold">Bearish</h3>
              <p className="text-2xl font-bold text-red-600">{analytics.sentimentBreakdown.bearish}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold">Avg/Day</h3>
              <p className="text-2xl font-bold text-purple-600">{analytics.averageNotesPerDay}</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search your trading notes..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Trading Note</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Note title..."
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Write your trading note..."
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-4">
                <select
                  value={newNote.sentiment || ''}
                  onChange={(e) => setNewNote({ ...newNote, sentiment: e.target.value as any })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select sentiment...</option>
                  <option value="bullish">Bullish</option>
                  <option value="bearish">Bearish</option>
                  <option value="neutral">Neutral</option>
                </select>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newNote.isPublic}
                    onChange={(e) => setNewNote({ ...newNote, isPublic: e.target.checked })}
                    className="mr-2"
                  />
                  Make public
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateNote}
                  disabled={!newNote.title.trim() || !newNote.content.trim() || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Note'}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        {loading && displayNotes.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-600">Loading notes...</p>
          </div>
        ) : displayNotes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">
              {searchQuery.trim() ? 'No notes found matching your search.' : 'No trading notes yet. Create your first note!'}
            </p>
          </div>
        ) : (
          displayNotes.map((note) => (
            <div key={note.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{note.title}</h3>
                <div className="flex items-center gap-2">
                  {getSentimentIcon(note.sentiment)}
                  <button
                    onClick={() => setEditingNote(note.id)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-gray-700 mb-3 whitespace-pre-wrap">{note.content}</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {note.tags && note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>
                  {note.bitcoinPrice && `BTC: $${note.bitcoinPrice.toLocaleString()}`}
                  {note.priceChange24h && (
                    <span className={note.priceChange24h >= 0 ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                      {note.priceChange24h >= 0 ? '+' : ''}{note.priceChange24h.toFixed(2)}%
                    </span>
                  )}
                </span>
                <span>{note.createdAt.toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

This complete example demonstrates all layers of a feature implementation following the Bitcoin Trading Game patterns. The Trading Notes feature includes full CRUD operations, semantic search, analytics, and a complete user interface.
