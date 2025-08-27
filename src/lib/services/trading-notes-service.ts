// Trading Notes service implementation

import { getChromaClient } from '@/lib/database/chroma-client';
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
  private collection: any = null;

  async initialize(): Promise<void> {
    try {
      this.collection = await setupTradingNotesCollection();
      console.log('✅ ChromaDB collection initialized');
    } catch (error) {
      console.warn('⚠️ ChromaDB not available, search functionality will be limited:', error.message);
      this.collection = null;
    }
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
        userId,
        title: validatedData.title,
        content: validatedData.content,
        tags: JSON.stringify(validatedData.tags || []),
        sentiment: validatedData.sentiment,
        isPublic: validatedData.isPublic || false,
        bitcoinPrice,
        priceChange24h
      },
      include: {
        user: {
          select: { id: true, email: true }
        }
      }
    });

    // Store in ChromaDB for search (if available)
    const noteOutput = this.transformToOutput(note);
    if (this.collection) {
      try {
        await this.storeInChroma(noteOutput);
      } catch (error) {
        console.warn('⚠️ Failed to store in ChromaDB:', error.message);
      }
    }

    console.log(`✅ Created trading note: ${note.title}`);
    return noteOutput;
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
        data: {
          ...(validatedData.title && { title: validatedData.title }),
          ...(validatedData.content && { content: validatedData.content }),
          ...(validatedData.tags && { tags: JSON.stringify(validatedData.tags) }),
          ...(validatedData.sentiment && { sentiment: validatedData.sentiment }),
          ...(validatedData.isPublic !== undefined && { isPublic: validatedData.isPublic })
        }
      });

      // Update in ChromaDB (if available)
      const noteOutput = this.transformToOutput(updatedNote);
      if (this.collection) {
        try {
          await this.updateInChroma(noteOutput);
        } catch (error) {
          console.warn('⚠️ Failed to update in ChromaDB:', error.message);
        }
      }

      console.log(`✅ Updated trading note: ${updatedNote.title}`);
      return noteOutput;
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

      // Delete from ChromaDB (if available)
      if (this.collection) {
        try {
          await this.deleteFromChroma(noteId);
        } catch (error) {
          console.warn('⚠️ Failed to delete from ChromaDB:', error.message);
        }
      }

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

    // Try ChromaDB search first
    if (this.collection) {
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

        if (results.documents && results.documents[0] && results.metadatas && results.metadatas[0]) {
          const searchResults: TradingNoteSearchResult[] = [];
          
          for (let i = 0; i < results.documents[0].length; i++) {
            const metadata = results.metadatas[0][i];
            const relevanceScore = results.distances ? (1 - results.distances[0][i]) : undefined;
            
            // Parse tags
            const tags = metadata.tags ? metadata.tags.split(',').filter((tag: string) => tag.trim()) : [];
            
            searchResults.push({
              id: metadata.id || results.ids?.[0]?.[i] || '',
              title: metadata.title || '',
              content: results.documents[0][i].split('\n\n')[1] || '', // Extract content part
              tags,
              sentiment: metadata.sentiment,
              relevanceScore,
              createdAt: new Date(metadata.created_at)
            });
          }

          return searchResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        }
      } catch (error) {
        console.warn('⚠️ ChromaDB search failed, falling back to database search:', error.message);
      }
    }

    // Fallback to simple database text search
    console.log('🔍 Using database text search fallback');
    const whereConditions: any = {
      OR: [
        { title: { contains: query } },
        { content: { contains: query } }
      ]
    };

    if (!includePublic) {
      whereConditions.userId = userId;
    } else {
      whereConditions.AND = {
        OR: [
          { userId },
          { isPublic: true }
        ]
      };
    }

    const notes = await prisma.tradingNote.findMany({
      where: whereConditions,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return notes.map(note => ({
      id: note.id,
      title: note.title,
      content: note.content,
      tags: JSON.parse(note.tags || '[]'),
      sentiment: note.sentiment,
      relevanceScore: 0.5, // Default relevance score for database search
      createdAt: note.createdAt
    }));
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
      let tags: string[] = [];
      try {
        tags = JSON.parse(note.tags || '[]');
      } catch {
        // If parsing fails, treat as empty array
      }
      
      tags.forEach(tag => {
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
      userEmail: (note as any).user?.email
    }));
  }

  // Private helper methods
  private async storeInChroma(note: TradingNoteOutput): Promise<void> {
    const document = tradingNoteToDocument(note);
    
    await this.collection.add({
      ids: [document.id],
      documents: [document.document],
      metadatas: [document.metadata]
    });
  }

  private async updateInChroma(note: TradingNoteOutput): Promise<void> {
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
    // Parse tags from JSON string
    let tags: string[] = [];
    try {
      if (note.tags) {
        tags = JSON.parse(note.tags);
      }
    } catch {
      tags = [];
    }

    return {
      id: note.id,
      userId: note.userId,
      title: note.title,
      content: note.content,
      tags,
      bitcoinPrice: note.bitcoinPrice,
      priceChange24h: note.priceChange24h,
      sentiment: note.sentiment,
      isPublic: note.isPublic,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    };
  }

  private async ensureInitialized(): Promise<void> {
    // We only initialize once, ChromaDB may not be available
    if (this.collection === null && !this.initializationAttempted) {
      await this.initialize();
      this.initializationAttempted = true;
    }
  }

  private initializationAttempted = false;
}

// Export singleton instance
export const tradingNotesService = new TradingNotesService();