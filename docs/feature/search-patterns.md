# ChromaDB Search Patterns for Bitcoin Trading Game

This document outlines search patterns and ChromaDB integration strategies for the Bitcoin Trading Game project.

## ChromaDB Collection Strategy

### Collection Naming Convention
```typescript
const COLLECTION_NAMES = {
  BITCOIN_HISTORICAL_DATA: 'bitcoin_historical_data',
  USER_PORTFOLIOS: 'user_portfolios',
  TRADES: 'trades', 
  AI_REPORTS: 'ai_analysis_reports',
  MARKET_ANALYSIS: 'market_analysis',
  FEATURE_DATA: 'feature_collection', // Replace with specific name
  DEV_PATTERNS: 'bitcoin_game_dev_patterns'
};
```

### Collection Metadata Standards
```typescript
const collectionMetadata = {
  description: 'Descriptive purpose of the collection',
  category: 'data_type', // e.g., 'trading_data', 'user_data', 'ai_data'
  version: '1.0',
  created_by: 'feature_name',
  schema_version: '2024.1'
};
```

## Search Pattern Implementation

### 1. Basic Search Pattern
```typescript
export class SearchService {
  private chroma: ChromaClient;
  private collection: any = null;

  constructor(collectionName: string) {
    this.chroma = new ChromaClient({
      path: process.env.CHROMADB_PATH || './chroma_data'
    });
    this.collectionName = collectionName;
  }

  async initialize(): Promise<void> {
    try {
      this.collection = await this.chroma.getCollection({
        name: this.collectionName
      });
    } catch (error) {
      // Collection doesn't exist, create it
      this.collection = await this.chroma.createCollection({
        name: this.collectionName,
        metadata: {
          description: `Search collection for ${this.collectionName}`,
          category: 'search_data'
        }
      });
    }
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    await this.ensureInitialized();
    
    const {
      limit = 10,
      filters = {},
      includeMetadata = true,
      includeDistances = false
    } = options;

    const results = await this.collection.query({
      queryTexts: [query],
      nResults: limit,
      where: filters,
      include: [
        'documents',
        ...(includeMetadata ? ['metadatas'] : []),
        ...(includeDistances ? ['distances'] : [])
      ]
    });

    return this.processResults(results);
  }
}
```

### 2. Trading Data Search Pattern
```typescript
export class TradingDataSearch extends SearchService {
  constructor() {
    super(COLLECTION_NAMES.TRADES);
  }

  // Search trades by user and date range
  async searchUserTradesByDateRange(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<TradeSearchResult[]> {
    return await this.search(`user trades ${userId}`, {
      filters: {
        user_id: userId,
        timestamp: {
          $gte: startDate.toISOString(),
          $lte: endDate.toISOString()
        }
      },
      limit: 100
    });
  }

  // Search profitable trades
  async searchProfitableTrades(userId: string): Promise<TradeSearchResult[]> {
    return await this.search(`profitable trades for ${userId}`, {
      filters: {
        user_id: userId,
        profit: { $gt: 0 }
      }
    });
  }

  // Search by trade type and amount range
  async searchTradesByTypeAndAmount(
    type: 'buy' | 'sell',
    minAmount: number,
    maxAmount: number
  ): Promise<TradeSearchResult[]> {
    return await this.search(`${type} trades between ${minAmount} and ${maxAmount} BTC`, {
      filters: {
        type,
        amount: {
          $gte: minAmount,
          $lte: maxAmount
        }
      }
    });
  }
}
```

### 3. AI Reports Search Pattern
```typescript
export class AIReportsSearch extends SearchService {
  constructor() {
    super(COLLECTION_NAMES.AI_REPORTS);
  }

  // Semantic search for similar market analyses
  async findSimilarAnalyses(
    marketCondition: string, 
    agentType?: string
  ): Promise<ReportSearchResult[]> {
    const query = `market analysis ${marketCondition} ${agentType || ''}`;
    
    return await this.search(query, {
      filters: agentType ? { agent_type: agentType } : {},
      limit: 5
    });
  }

  // Search reports by confidence level
  async searchByConfidence(
    minConfidence: number,
    recommendation?: 'buy' | 'sell' | 'hold'
  ): Promise<ReportSearchResult[]> {
    return await this.search(`high confidence ${recommendation || ''} recommendation`, {
      filters: {
        confidence: { $gte: minConfidence },
        ...(recommendation ? { recommendation } : {})
      }
    });
  }

  // Find reports during specific price movements
  async searchReportsByPriceMovement(
    priceChangePercent: number,
    direction: 'up' | 'down'
  ): Promise<ReportSearchResult[]> {
    const operator = direction === 'up' ? '$gte' : '$lte';
    const searchTerm = `reports during ${direction}ward price movement ${Math.abs(priceChangePercent)}%`;
    
    return await this.search(searchTerm, {
      filters: {
        price_change_24h: { [operator]: direction === 'down' ? -Math.abs(priceChangePercent) : priceChangePercent }
      }
    });
  }
}
```

### 4. Portfolio Analysis Search Pattern
```typescript
export class PortfolioSearch extends SearchService {
  constructor() {
    super(COLLECTION_NAMES.USER_PORTFOLIOS);
  }

  // Find portfolios with similar performance
  async findSimilarPerformingPortfolios(
    referencePortfolioId: string,
    tolerance: number = 5
  ): Promise<PortfolioSearchResult[]> {
    const referencePortfolio = await this.getPortfolioById(referencePortfolioId);
    if (!referencePortfolio) return [];

    const profitPercent = referencePortfolio.profitPercentage;
    
    return await this.search(`portfolios with similar ${profitPercent}% profit performance`, {
      filters: {
        profit_percentage: {
          $gte: profitPercent - tolerance,
          $lte: profitPercent + tolerance
        },
        id: { $ne: referencePortfolioId } // Exclude reference portfolio
      }
    });
  }

  // Search top performing portfolios by timeframe
  async searchTopPerformers(
    timeframe: 'week' | 'month' | 'quarter',
    limit: number = 10
  ): Promise<PortfolioSearchResult[]> {
    const timeframeDate = this.getTimeframeDate(timeframe);
    
    return await this.search(`top performing portfolios ${timeframe}`, {
      filters: {
        updated_at: { $gte: timeframeDate.toISOString() },
        profit_percentage: { $gt: 0 }
      },
      limit
    });
  }
}
```

### 5. Market Data Search Pattern
```typescript
export class MarketDataSearch extends SearchService {
  constructor() {
    super(COLLECTION_NAMES.BITCOIN_HISTORICAL_DATA);
  }

  // Search for specific price patterns
  async searchPricePatterns(
    patternType: 'volatility' | 'trend' | 'support' | 'resistance',
    timeframe: string
  ): Promise<PriceSearchResult[]> {
    return await this.search(`Bitcoin ${patternType} pattern ${timeframe}`, {
      limit: 50
    });
  }

  // Find price data during market events
  async searchByMarketEvent(
    eventDescription: string,
    startDate: Date,
    endDate: Date
  ): Promise<PriceSearchResult[]> {
    return await this.search(`Bitcoin price during ${eventDescription}`, {
      filters: {
        timestamp: {
          $gte: startDate.toISOString(),
          $lte: endDate.toISOString()
        }
      }
    });
  }

  // Search for price ranges and volume patterns
  async searchPriceVolumePatterns(
    minPrice: number,
    maxPrice: number,
    minVolume?: number
  ): Promise<PriceSearchResult[]> {
    const filters: any = {
      price: { $gte: minPrice, $lte: maxPrice }
    };
    
    if (minVolume) {
      filters.volume = { $gte: minVolume };
    }

    return await this.search(`Bitcoin price ${minPrice} to ${maxPrice} with volume analysis`, {
      filters,
      limit: 100
    });
  }
}
```

## Advanced Search Techniques

### 1. Multi-Collection Search
```typescript
export class CrossCollectionSearch {
  private collections: Map<string, SearchService>;

  constructor() {
    this.collections = new Map([
      ['trades', new TradingDataSearch()],
      ['reports', new AIReportsSearch()],
      ['portfolios', new PortfolioSearch()],
      ['market', new MarketDataSearch()]
    ]);
  }

  // Search across multiple collections
  async searchAcrossCollections(
    query: string,
    collections: string[] = ['trades', 'reports', 'portfolios']
  ): Promise<CrossCollectionResult> {
    const results: CrossCollectionResult = {
      query,
      timestamp: new Date(),
      collections: {}
    };

    await Promise.all(
      collections.map(async (collectionName) => {
        const service = this.collections.get(collectionName);
        if (service) {
          try {
            results.collections[collectionName] = await service.search(query);
          } catch (error) {
            results.collections[collectionName] = [];
            console.warn(`Search failed for collection ${collectionName}:`, error);
          }
        }
      })
    );

    return results;
  }
}
```

### 2. Contextual Search with AI Agents
```typescript
export class AIContextualSearch {
  private aiReportsSearch: AIReportsSearch;
  private tradingDataSearch: TradingDataSearch;

  constructor() {
    this.aiReportsSearch = new AIReportsSearch();
    this.tradingDataSearch = new TradingDataSearch();
  }

  // Search with AI agent context
  async searchWithAgentContext(
    query: string,
    agentType: string,
    userId: string
  ): Promise<ContextualSearchResult> {
    // Get user's trading history for context
    const userTrades = await this.tradingDataSearch.search(`user ${userId} trades`, {
      filters: { user_id: userId },
      limit: 20
    });

    // Get relevant AI reports from the same agent type
    const agentReports = await this.aiReportsSearch.findSimilarAnalyses(query, agentType);

    // Combine and rank results based on relevance
    return this.combineContextualResults(query, userTrades, agentReports);
  }
}
```

### 3. Temporal Search Patterns
```typescript
export class TemporalSearch {
  // Search for patterns that repeat over time
  async findRecurringPatterns(
    pattern: string,
    intervalDays: number,
    collections: string[]
  ): Promise<RecurringPatternResult[]> {
    const intervals = this.generateTimeIntervals(intervalDays, 90); // Look back 90 days
    const results: RecurringPatternResult[] = [];

    for (const interval of intervals) {
      const intervalResults = await this.searchTimeInterval(
        pattern,
        interval.start,
        interval.end,
        collections
      );
      
      if (intervalResults.length > 0) {
        results.push({
          interval,
          results: intervalResults,
          confidence: this.calculatePatternConfidence(intervalResults)
        });
      }
    }

    return results.filter(r => r.confidence > 0.7); // Only return confident patterns
  }
}
```

## Performance Optimization

### 1. Collection Optimization
```typescript
export class CollectionOptimizer {
  // Optimize collection for better search performance
  async optimizeCollection(collectionName: string): Promise<void> {
    const collection = await this.chroma.getCollection({ name: collectionName });
    
    // Get collection stats
    const count = await collection.count();
    console.log(`Optimizing collection ${collectionName} with ${count} documents`);
    
    // Consider splitting large collections
    if (count > 100000) {
      await this.considerCollectionPartitioning(collectionName);
    }
    
    // Optimize metadata indexing
    await this.optimizeMetadataFields(collection);
  }

  private async optimizeMetadataFields(collection: any): Promise<void> {
    // Analyze frequently queried metadata fields
    const metadataAnalysis = await this.analyzeMetadataUsage(collection);
    
    // Suggest optimizations
    console.log('Metadata optimization suggestions:', metadataAnalysis);
  }
}
```

### 2. Caching Strategy
```typescript
export class SearchCache {
  private cache: Map<string, CachedResult>;
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  async cachedSearch(
    searchFn: () => Promise<any[]>,
    cacheKey: string
  ): Promise<any[]> {
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
      return cached.results;
    }

    const results = await searchFn();
    this.cache.set(cacheKey, {
      results,
      timestamp: Date.now()
    });

    return results;
  }
}
```

## Error Handling and Monitoring

### 1. Search Error Handling
```typescript
export class SearchErrorHandler {
  async safeSearch<T>(
    searchFn: () => Promise<T[]>,
    fallbackFn?: () => Promise<T[]>
  ): Promise<SearchResult<T>> {
    try {
      const results = await searchFn();
      return {
        success: true,
        results,
        error: null
      };
    } catch (error) {
      console.error('Search failed:', error);
      
      if (fallbackFn) {
        try {
          const fallbackResults = await fallbackFn();
          return {
            success: true,
            results: fallbackResults,
            error: null,
            fromFallback: true
          };
        } catch (fallbackError) {
          console.error('Fallback search also failed:', fallbackError);
        }
      }
      
      return {
        success: false,
        results: [],
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }
}
```

### 2. Search Performance Monitoring
```typescript
export class SearchMonitor {
  private metrics: Map<string, SearchMetrics>;

  async monitoredSearch(
    searchName: string,
    searchFn: () => Promise<any[]>
  ): Promise<any[]> {
    const startTime = performance.now();
    
    try {
      const results = await searchFn();
      const endTime = performance.now();
      
      this.recordMetrics(searchName, {
        duration: endTime - startTime,
        resultCount: results.length,
        success: true
      });
      
      return results;
    } catch (error) {
      const endTime = performance.now();
      
      this.recordMetrics(searchName, {
        duration: endTime - startTime,
        resultCount: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }
}
```

## Search Integration Examples

### API Route Integration
```typescript
// pages/api/search/[...params].ts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const collections = searchParams.get('collections')?.split(',') || ['trades'];
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    const crossSearch = new CrossCollectionSearch();
    const results = await crossSearch.searchAcrossCollections(query, collections);
    
    return NextResponse.json({
      success: true,
      data: results
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
```

### React Hook Integration
```typescript
// Custom hook for search functionality
export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, collections: string[] = ['trades']) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&collections=${collections.join(',')}`);
      const data = await response.json();
      
      if (data.success) {
        setResults(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Search request failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search };
}
```

This comprehensive search pattern documentation provides the foundation for implementing powerful search capabilities across the Bitcoin Trading Game project.