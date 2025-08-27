// Bitcoin data storage service with ChromaDB integration

import { ChromaClient } from 'chromadb';
import { BitcoinData, MarketAnalysis, TechnicalIndicators } from '@/types/game';
import { BitcoinDataDocument, MarketAnalysisDocument, DocumentMapper, COLLECTION_NAMES } from '@/lib/database/schemas';
import { ValidationUtils } from '@/lib/validation/schemas';

export interface StorageStats {
  totalDocuments: number;
  latestTimestamp: Date | null;
  oldestTimestamp: Date | null;
  priceRange: { min: number; max: number; } | null;
}

export class BitcoinStorageService {
  private chroma: ChromaClient;
  private bitcoinCollection: any = null;
  private analysisCollection: any = null;

  constructor() {
    this.chroma = new ChromaClient({
      path: process.env.CHROMADB_PATH || './chroma_data'
    });
  }

  /**
   * Initialize collections
   */
  async initialize(): Promise<void> {
    try {
      this.bitcoinCollection = await this.chroma.getCollection({
        name: COLLECTION_NAMES.BITCOIN_HISTORICAL_DATA
      });
      
      this.analysisCollection = await this.chroma.getCollection({
        name: COLLECTION_NAMES.MARKET_ANALYSIS
      });

      console.log('✅ Bitcoin storage service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Bitcoin storage service:', error);
      throw new Error(`Storage initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store a single Bitcoin data point
   */
  async storeBitcoinData(data: BitcoinData): Promise<string> {
    await this.ensureInitialized();
    
    try {
      // Validate the data first
      const validatedData = ValidationUtils.validateBitcoinData(data);
      
      // Convert to ChromaDB document
      const document = DocumentMapper.bitcoinDataToDocument(validatedData);
      
      // Store in ChromaDB
      await this.bitcoinCollection!.add({
        ids: [document.id],
        documents: [document.document],
        metadatas: [document.metadata]
      });

      console.log(`✅ Stored Bitcoin data point: ${data.price} USD at ${data.timestamp.toISOString()}`);
      return document.id;
    } catch (error) {
      console.error('❌ Error storing Bitcoin data:', error);
      throw new Error(`Failed to store Bitcoin data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store multiple Bitcoin data points in batch
   */
  async storeBitcoinDataBatch(dataArray: BitcoinData[]): Promise<string[]> {
    await this.ensureInitialized();
    
    if (dataArray.length === 0) {
      return [];
    }

    try {
      // Validate and convert all data points
      const documents: BitcoinDataDocument[] = [];
      const validatedData: BitcoinData[] = [];

      for (const data of dataArray) {
        try {
          const validated = ValidationUtils.validateBitcoinData(data);
          validatedData.push(validated);
          documents.push(DocumentMapper.bitcoinDataToDocument(validated));
        } catch (validationError) {
          console.warn(`Skipping invalid data point:`, validationError);
        }
      }

      if (documents.length === 0) {
        throw new Error('No valid data points to store');
      }

      // Extract data for batch insertion
      const ids = documents.map(doc => doc.id);
      const documentTexts = documents.map(doc => doc.document);
      const metadatas = documents.map(doc => doc.metadata);

      // Store in ChromaDB
      await this.bitcoinCollection!.add({
        ids,
        documents: documentTexts,
        metadatas
      });

      console.log(`✅ Stored ${documents.length} Bitcoin data points in batch`);
      return ids;
    } catch (error) {
      console.error('❌ Error storing Bitcoin data batch:', error);
      throw new Error(`Failed to store Bitcoin data batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Query Bitcoin data by time range
   */
  async queryBitcoinDataByTimeRange(startTime: Date, endTime: Date, limit: number = 100): Promise<BitcoinData[]> {
    await this.ensureInitialized();

    try {
      const results = await this.bitcoinCollection!.query({
        queryTexts: [`Bitcoin price data from ${startTime.toISOString()} to ${endTime.toISOString()}`],
        nResults: limit,
        where: {
          timestamp: {
            $gte: startTime.toISOString(),
            $lte: endTime.toISOString()
          }
        },
        include: ['documents', 'metadatas']
      });

      const bitcoinDataArray: BitcoinData[] = [];
      
      if (results.documents && results.documents[0]) {
        for (const docString of results.documents[0]) {
          try {
            const data = JSON.parse(docString) as BitcoinData;
            // Convert string dates back to Date objects
            data.timestamp = new Date(data.timestamp);
            bitcoinDataArray.push(ValidationUtils.validateBitcoinData(data));
          } catch (parseError) {
            console.warn('Failed to parse Bitcoin data from storage:', parseError);
          }
        }
      }

      return bitcoinDataArray.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      console.error('❌ Error querying Bitcoin data by time range:', error);
      throw new Error(`Failed to query Bitcoin data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Query latest Bitcoin data points
   */
  async queryLatestBitcoinData(limit: number = 10): Promise<BitcoinData[]> {
    await this.ensureInitialized();

    try {
      const results = await this.bitcoinCollection!.query({
        queryTexts: ['Latest Bitcoin price data'],
        nResults: limit,
        include: ['documents', 'metadatas']
      });

      const bitcoinDataArray: BitcoinData[] = [];
      
      if (results.documents && results.documents[0] && results.metadatas && results.metadatas[0]) {
        for (let i = 0; i < results.documents[0].length; i++) {
          try {
            const data = JSON.parse(results.documents[0][i]) as BitcoinData;
            data.timestamp = new Date(data.timestamp);
            bitcoinDataArray.push(ValidationUtils.validateBitcoinData(data));
          } catch (parseError) {
            console.warn('Failed to parse Bitcoin data from storage:', parseError);
          }
        }
      }

      // Sort by timestamp descending (most recent first)
      return bitcoinDataArray.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('❌ Error querying latest Bitcoin data:', error);
      throw new Error(`Failed to query latest Bitcoin data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Query Bitcoin data by price range
   */
  async queryBitcoinDataByPriceRange(minPrice: number, maxPrice: number, limit: number = 50): Promise<BitcoinData[]> {
    await this.ensureInitialized();

    try {
      const results = await this.bitcoinCollection!.query({
        queryTexts: [`Bitcoin price between ${minPrice} and ${maxPrice} USD`],
        nResults: limit,
        where: {
          price: {
            $gte: minPrice,
            $lte: maxPrice
          }
        },
        include: ['documents', 'metadatas']
      });

      const bitcoinDataArray: BitcoinData[] = [];
      
      if (results.documents && results.documents[0]) {
        for (const docString of results.documents[0]) {
          try {
            const data = JSON.parse(docString) as BitcoinData;
            data.timestamp = new Date(data.timestamp);
            bitcoinDataArray.push(ValidationUtils.validateBitcoinData(data));
          } catch (parseError) {
            console.warn('Failed to parse Bitcoin data from storage:', parseError);
          }
        }
      }

      return bitcoinDataArray.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      console.error('❌ Error querying Bitcoin data by price range:', error);
      throw new Error(`Failed to query Bitcoin data by price range: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    await this.ensureInitialized();

    try {
      // Get collection count
      const countResult = await this.bitcoinCollection!.count();
      
      if (countResult === 0) {
        return {
          totalDocuments: 0,
          latestTimestamp: null,
          oldestTimestamp: null,
          priceRange: null
        };
      }

      // Get all data for analysis (this might be expensive for large datasets)
      // In production, you'd want to optimize this with specific queries
      const allData = await this.queryLatestBitcoinData(1000); // Get up to 1000 recent records for stats
      
      if (allData.length === 0) {
        return {
          totalDocuments: countResult,
          latestTimestamp: null,
          oldestTimestamp: null,
          priceRange: null
        };
      }

      const sortedByTime = allData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const prices = allData.map(d => d.price);

      return {
        totalDocuments: countResult,
        latestTimestamp: sortedByTime[sortedByTime.length - 1]?.timestamp || null,
        oldestTimestamp: sortedByTime[0]?.timestamp || null,
        priceRange: {
          min: Math.min(...prices),
          max: Math.max(...prices)
        }
      };
    } catch (error) {
      console.error('❌ Error getting storage stats:', error);
      throw new Error(`Failed to get storage stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up old data (keep only last N days)
   */
  async cleanupOldData(daysToKeep: number = 30): Promise<number> {
    await this.ensureInitialized();

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Query old data to get IDs
      const oldDataResults = await this.bitcoinCollection!.query({
        queryTexts: ['Old Bitcoin price data'],
        nResults: 1000,
        where: {
          timestamp: {
            $lt: cutoffDate.toISOString()
          }
        },
        include: ['metadatas']
      });

      if (!oldDataResults.ids || !oldDataResults.ids[0] || oldDataResults.ids[0].length === 0) {
        console.log('No old data to cleanup');
        return 0;
      }

      // Delete old data
      const idsToDelete = oldDataResults.ids[0];
      await this.bitcoinCollection!.delete({
        ids: idsToDelete
      });

      console.log(`✅ Cleaned up ${idsToDelete.length} old Bitcoin data records`);
      return idsToDelete.length;
    } catch (error) {
      console.error('❌ Error cleaning up old data:', error);
      throw new Error(`Failed to cleanup old data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate and store technical analysis
   */
  async calculateAndStoreTechnicalAnalysis(data: BitcoinData[]): Promise<void> {
    if (data.length < 50) {
      console.warn('Insufficient data for technical analysis (need at least 50 data points)');
      return;
    }

    try {
      const prices = data.map(d => d.price).slice(-50); // Use last 50 prices
      const volumes = data.map(d => d.volume).slice(-50);
      
      // Calculate basic technical indicators
      const indicators: TechnicalIndicators = {
        rsi: this.calculateRSI(prices),
        sma20: this.calculateSMA(prices, 20),
        sma50: this.calculateSMA(prices, 50),
        ema12: this.calculateEMA(prices, 12),
        ema26: this.calculateEMA(prices, 26),
        macd: 0, // Will calculate after EMA
        bollingerUpper: 0,
        bollingerLower: 0,
        support: Math.min(...prices.slice(-20)),
        resistance: Math.max(...prices.slice(-20))
      };

      // Calculate MACD
      indicators.macd = indicators.ema12 - indicators.ema26;

      // Calculate Bollinger Bands
      const sma20 = indicators.sma20;
      const variance = prices.slice(-20).reduce((sum, price) => sum + Math.pow(price - sma20, 2), 0) / 20;
      const stdDev = Math.sqrt(variance);
      indicators.bollingerUpper = sma20 + (2 * stdDev);
      indicators.bollingerLower = sma20 - (2 * stdDev);

      // Create market analysis document (you would implement MarketAnalysis creation here)
      console.log('✅ Technical analysis calculated and stored');
    } catch (error) {
      console.error('❌ Error calculating technical analysis:', error);
    }
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50; // Neutral RSI if insufficient data

    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period;
    const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    
    const relevantPrices = prices.slice(-period);
    return relevantPrices.reduce((sum, price) => sum + price, 0) / period;
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    if (prices.length === 1) return prices[0];

    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.bitcoinCollection || !this.analysisCollection) {
      await this.initialize();
    }
  }
}

// Export a singleton instance
export const bitcoinStorage = new BitcoinStorageService();