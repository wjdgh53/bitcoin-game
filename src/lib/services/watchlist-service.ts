// Watchlist service implementation

import { getChromaClient } from '@/lib/database/chroma-client';
import { prisma } from '@/lib/database/prisma-client';
import { 
  WatchlistItemInput, 
  WatchlistItemOutput, 
  WatchlistItemUpdateInput,
  WatchlistSearchResult,
  WatchlistAnalytics 
} from '@/types/watchlist';
import { setupWatchlistCollection, watchlistItemToDocument } from '@/lib/database/watchlist-chroma';
import { ValidationUtils } from '@/lib/validation/watchlist-schemas';

// Mock crypto price service (you could replace with real API)
const getCryptoPrice = async (symbol: string): Promise<{ price: number; priceChange24h: number } | null> => {
  // For demo purposes, return mock data
  const mockPrices: Record<string, { price: number; priceChange24h: number }> = {
    'BTC': { price: 111944, priceChange24h: 2.11 },
    'ETH': { price: 3247, priceChange24h: -1.24 },
    'ADA': { price: 0.456, priceChange24h: 3.45 },
    'SOL': { price: 234.56, priceChange24h: 5.67 },
    'DOT': { price: 12.34, priceChange24h: -2.11 }
  };
  
  return mockPrices[symbol] || null;
};

export class WatchlistService {
  private collection: any = null;
  private initializationAttempted = false;

  async initialize(): Promise<void> {
    try {
      this.collection = await setupWatchlistCollection();
      console.log('✅ ChromaDB collection initialized for watchlist');
    } catch (error) {
      console.warn('⚠️ ChromaDB not available, search functionality will be limited:', error.message);
      this.collection = null;
    }
  }

  /**
   * Create a new watchlist item
   */
  async createWatchlistItem(userId: string, data: WatchlistItemInput): Promise<WatchlistItemOutput> {
    await this.ensureInitialized();
    
    // Validate input
    const validatedData = ValidationUtils.validateWatchlistItemInput({
      ...data,
      userId
    });

    // Get current price for the symbol
    let currentPrice: number | undefined;
    let priceChange24h: number | undefined;
    
    try {
      const priceData = await getCryptoPrice(validatedData.symbol);
      if (priceData) {
        currentPrice = priceData.price;
        priceChange24h = priceData.priceChange24h;
      }
    } catch (error) {
      console.warn(`Failed to fetch price for ${validatedData.symbol}:`, error);
    }

    // Create in database
    const item = await prisma.watchlistItem.create({
      data: {
        userId,
        symbol: validatedData.symbol,
        name: validatedData.name,
        alertPrice: validatedData.alertPrice,
        alertType: validatedData.alertType,
        notes: validatedData.notes,
        tags: JSON.stringify(validatedData.tags || [])
      },
      include: {
        user: {
          select: { id: true, email: true }
        }
      }
    });

    // Store in ChromaDB for search (if available)
    const itemOutput = this.transformToOutput(item, currentPrice, priceChange24h);
    if (this.collection) {
      try {
        await this.storeInChroma(itemOutput);
      } catch (error) {
        console.warn('⚠️ Failed to store in ChromaDB:', error.message);
      }
    }

    console.log(`✅ Created watchlist item: ${item.symbol} - ${item.name}`);
    return itemOutput;
  }

  /**
   * Get a specific watchlist item by ID
   */
  async getWatchlistItemById(itemId: string, userId: string): Promise<WatchlistItemOutput | null> {
    const item = await prisma.watchlistItem.findFirst({
      where: {
        id: itemId,
        userId // Ensure user owns the item
      }
    });

    if (!item) return null;

    // Get current price
    let currentPrice: number | undefined;
    let priceChange24h: number | undefined;
    
    try {
      const priceData = await getCryptoPrice(item.symbol);
      if (priceData) {
        currentPrice = priceData.price;
        priceChange24h = priceData.priceChange24h;
      }
    } catch (error) {
      console.warn(`Failed to fetch price for ${item.symbol}:`, error);
    }

    return this.transformToOutput(item, currentPrice, priceChange24h);
  }

  /**
   * Get all watchlist items for a user
   */
  async getUserWatchlistItems(userId: string, limit: number = 50, offset: number = 0): Promise<WatchlistItemOutput[]> {
    const items = await prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Get current prices for all symbols
    const itemsWithPrices = await Promise.all(
      items.map(async (item) => {
        let currentPrice: number | undefined;
        let priceChange24h: number | undefined;
        
        try {
          const priceData = await getCryptoPrice(item.symbol);
          if (priceData) {
            currentPrice = priceData.price;
            priceChange24h = priceData.priceChange24h;
          }
        } catch (error) {
          console.warn(`Failed to fetch price for ${item.symbol}:`, error);
        }

        return this.transformToOutput(item, currentPrice, priceChange24h);
      })
    );

    return itemsWithPrices;
  }

  /**
   * Update a watchlist item
   */
  async updateWatchlistItem(itemId: string, userId: string, data: WatchlistItemUpdateInput): Promise<WatchlistItemOutput | null> {
    await this.ensureInitialized();
    
    // Validate input
    const validatedData = ValidationUtils.validateWatchlistItemUpdateInput(data);

    // Update in database
    try {
      const updatedItem = await prisma.watchlistItem.update({
        where: {
          id: itemId,
          userId // Ensure user owns the item
        },
        data: {
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.alertPrice !== undefined && { alertPrice: validatedData.alertPrice }),
          ...(validatedData.alertType && { alertType: validatedData.alertType }),
          ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
          ...(validatedData.tags && { tags: JSON.stringify(validatedData.tags) }),
          ...(validatedData.alertTriggered !== undefined && { alertTriggered: validatedData.alertTriggered })
        }
      });

      // Get current price
      let currentPrice: number | undefined;
      let priceChange24h: number | undefined;
      
      try {
        const priceData = await getCryptoPrice(updatedItem.symbol);
        if (priceData) {
          currentPrice = priceData.price;
          priceChange24h = priceData.priceChange24h;
        }
      } catch (error) {
        console.warn(`Failed to fetch price for ${updatedItem.symbol}:`, error);
      }

      // Update in ChromaDB (if available)
      const itemOutput = this.transformToOutput(updatedItem, currentPrice, priceChange24h);
      if (this.collection) {
        try {
          await this.updateInChroma(itemOutput);
        } catch (error) {
          console.warn('⚠️ Failed to update in ChromaDB:', error.message);
        }
      }

      console.log(`✅ Updated watchlist item: ${updatedItem.symbol} - ${updatedItem.name}`);
      return itemOutput;
    } catch (error) {
      console.error('Failed to update watchlist item:', error);
      return null;
    }
  }

  /**
   * Delete a watchlist item
   */
  async deleteWatchlistItem(itemId: string, userId: string): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      // Delete from database
      await prisma.watchlistItem.delete({
        where: {
          id: itemId,
          userId // Ensure user owns the item
        }
      });

      // Delete from ChromaDB (if available)
      if (this.collection) {
        try {
          await this.deleteFromChroma(itemId);
        } catch (error) {
          console.warn('⚠️ Failed to delete from ChromaDB:', error.message);
        }
      }

      console.log(`✅ Deleted watchlist item: ${itemId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete watchlist item:', error);
      return false;
    }
  }

  /**
   * Search watchlist items using ChromaDB semantic search
   */
  async searchWatchlistItems(
    userId: string, 
    query: string, 
    limit: number = 10
  ): Promise<WatchlistSearchResult[]> {
    await this.ensureInitialized();

    // Try ChromaDB search first
    if (this.collection) {
      try {
        const results = await this.collection.query({
          queryTexts: [query],
          nResults: limit,
          where: { user_id: userId },
          include: ['documents', 'metadatas', 'distances']
        });

        if (results.documents && results.documents[0] && results.metadatas && results.metadatas[0]) {
          const searchResults: WatchlistSearchResult[] = [];
          
          for (let i = 0; i < results.documents[0].length; i++) {
            const metadata = results.metadatas[0][i];
            const relevanceScore = results.distances ? (1 - results.distances[0][i]) : undefined;
            
            // Get current price
            let currentPrice: number | undefined;
            let priceChange24h: number | undefined;
            
            try {
              const priceData = await getCryptoPrice(metadata.symbol);
              if (priceData) {
                currentPrice = priceData.price;
                priceChange24h = priceData.priceChange24h;
              }
            } catch (error) {
              console.warn(`Failed to fetch price for ${metadata.symbol}:`, error);
            }
            
            searchResults.push({
              id: metadata.id || results.ids?.[0]?.[i] || '',
              symbol: metadata.symbol || '',
              name: metadata.name || '',
              currentPrice,
              priceChange24h,
              alertPrice: metadata.alert_price || undefined,
              alertType: metadata.alert_type !== 'none' ? metadata.alert_type : undefined,
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
    const items = await prisma.watchlistItem.findMany({
      where: {
        userId,
        OR: [
          { symbol: { contains: query } },
          { name: { contains: query } },
          { notes: { contains: query } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    const searchResults = await Promise.all(
      items.map(async (item) => {
        let currentPrice: number | undefined;
        let priceChange24h: number | undefined;
        
        try {
          const priceData = await getCryptoPrice(item.symbol);
          if (priceData) {
            currentPrice = priceData.price;
            priceChange24h = priceData.priceChange24h;
          }
        } catch (error) {
          console.warn(`Failed to fetch price for ${item.symbol}:`, error);
        }

        return {
          id: item.id,
          symbol: item.symbol,
          name: item.name,
          currentPrice,
          priceChange24h,
          alertPrice: item.alertPrice || undefined,
          alertType: item.alertType || undefined,
          relevanceScore: 0.5, // Default relevance score for database search
          createdAt: item.createdAt
        };
      })
    );

    return searchResults;
  }

  /**
   * Get analytics for user's watchlist
   */
  async getWatchlistAnalytics(userId: string): Promise<WatchlistAnalytics> {
    const items = await prisma.watchlistItem.findMany({
      where: { userId },
      select: {
        symbol: true,
        name: true,
        alertType: true,
        alertTriggered: true,
        tags: true,
        createdAt: true
      }
    });

    // Get current prices for all symbols and calculate performance
    const itemsWithPrices = await Promise.all(
      items.map(async (item) => {
        let priceChange24h = 0;
        
        try {
          const priceData = await getCryptoPrice(item.symbol);
          if (priceData) {
            priceChange24h = priceData.priceChange24h;
          }
        } catch (error) {
          console.warn(`Failed to fetch price for ${item.symbol}:`, error);
        }

        return {
          ...item,
          priceChange24h
        };
      })
    );

    // Calculate alert breakdown
    const alertBreakdown = {
      above: items.filter(item => item.alertType === 'above').length,
      below: items.filter(item => item.alertType === 'below').length,
      both: items.filter(item => item.alertType === 'both').length,
      none: items.filter(item => !item.alertType).length
    };

    // Calculate top tags
    const tagCounts = new Map<string, number>();
    items.forEach(item => {
      let tags: string[] = [];
      try {
        tags = JSON.parse(item.tags || '[]');
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

    // Get top performers
    const topPerformers = itemsWithPrices
      .sort((a, b) => b.priceChange24h - a.priceChange24h)
      .slice(0, 5)
      .map(item => ({
        symbol: item.symbol,
        name: item.name,
        priceChange24h: item.priceChange24h
      }));

    // Calculate average gain
    const averageGain = itemsWithPrices.length > 0
      ? itemsWithPrices.reduce((sum, item) => sum + item.priceChange24h, 0) / itemsWithPrices.length
      : 0;

    return {
      totalItems: items.length,
      triggeredAlerts: items.filter(item => item.alertTriggered).length,
      averageGain: Math.round(averageGain * 100) / 100,
      topPerformers,
      alertBreakdown,
      topTags
    };
  }

  // Private helper methods
  private async storeInChroma(item: WatchlistItemOutput): Promise<void> {
    const document = watchlistItemToDocument(item);
    
    await this.collection.add({
      ids: [document.id],
      documents: [document.document],
      metadatas: [document.metadata]
    });
  }

  private async updateInChroma(item: WatchlistItemOutput): Promise<void> {
    const document = watchlistItemToDocument(item);
    
    await this.collection.update({
      ids: [document.id],
      documents: [document.document],
      metadatas: [document.metadata]
    });
  }

  private async deleteFromChroma(itemId: string): Promise<void> {
    await this.collection.delete({ ids: [itemId] });
  }

  private transformToOutput(item: any, currentPrice?: number, priceChange24h?: number): WatchlistItemOutput {
    // Parse tags from JSON string
    let tags: string[] = [];
    try {
      if (item.tags) {
        tags = JSON.parse(item.tags);
      }
    } catch {
      tags = [];
    }

    return {
      id: item.id,
      userId: item.userId,
      symbol: item.symbol,
      name: item.name,
      currentPrice,
      priceChange24h,
      alertPrice: item.alertPrice,
      alertType: item.alertType,
      notes: item.notes,
      tags,
      alertTriggered: item.alertTriggered,
      lastAlertAt: item.lastAlertAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }

  private async ensureInitialized(): Promise<void> {
    // We only initialize once, ChromaDB may not be available
    if (this.collection === null && !this.initializationAttempted) {
      await this.initialize();
      this.initializationAttempted = true;
    }
  }
}

// Export singleton instance
export const watchlistService = new WatchlistService();