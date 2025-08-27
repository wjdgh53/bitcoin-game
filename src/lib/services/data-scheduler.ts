// Data refresh scheduler with caching system

import * as cron from 'node-cron';
import { bitcoinAPI } from './bitcoin-api';
import { bitcoinStorage } from './bitcoin-storage';
import { BitcoinData } from '@/types/game';

interface CacheEntry {
  data: BitcoinData;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheStats {
  entries: number;
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
}

export class DataSchedulerService {
  private cache: Map<string, CacheEntry> = new Map();
  private isRunning: boolean = false;
  private scheduledTasks: cron.ScheduledTask[] = [];
  private cacheStats = {
    totalRequests: 0,
    cacheHits: 0
  };

  // Cache TTL configurations (in milliseconds)
  private readonly cacheTTLs = {
    current: 60 * 1000, // 1 minute for current data
    recent: 5 * 60 * 1000, // 5 minutes for recent data
    historical: 30 * 60 * 1000, // 30 minutes for historical data
  };

  constructor() {
    // Clean up expired cache entries every 5 minutes
    this.scheduledTasks.push(
      cron.schedule('*/5 * * * *', () => {
        this.cleanupExpiredCache();
      }, { scheduled: false })
    );
  }

  /**
   * Start the data refresh scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('📊 Data scheduler is already running');
      return;
    }

    try {
      // Initialize storage
      await bitcoinStorage.initialize();

      // Schedule current price updates (every 2 minutes)
      this.scheduledTasks.push(
        cron.schedule('*/2 * * * *', async () => {
          await this.fetchAndStoreCurrent();
        }, { scheduled: false })
      );

      // Schedule detailed data updates (every 10 minutes)
      this.scheduledTasks.push(
        cron.schedule('*/10 * * * *', async () => {
          await this.fetchAndStoreDetailed();
        }, { scheduled: false })
      );

      // Schedule historical data updates (every hour)
      this.scheduledTasks.push(
        cron.schedule('0 * * * *', async () => {
          await this.fetchAndStoreHistorical();
        }, { scheduled: false })
      );

      // Schedule cache cleanup (every 5 minutes)
      this.scheduledTasks.push(
        cron.schedule('*/5 * * * *', () => {
          this.cleanupExpiredCache();
        }, { scheduled: false })
      );

      // Schedule storage cleanup (daily at 2 AM)
      this.scheduledTasks.push(
        cron.schedule('0 2 * * *', async () => {
          await this.cleanupOldStorageData();
        }, { scheduled: false })
      );

      // Start all scheduled tasks
      this.scheduledTasks.forEach(task => task.start());

      // Do initial data fetch
      await this.initialDataFetch();

      this.isRunning = true;
      console.log('🚀 Data scheduler started successfully');
      console.log('📅 Scheduled tasks:');
      console.log('   - Current price: Every 2 minutes');
      console.log('   - Detailed data: Every 10 minutes');
      console.log('   - Historical data: Every hour');
      console.log('   - Cache cleanup: Every 5 minutes');
      console.log('   - Storage cleanup: Daily at 2 AM');

    } catch (error) {
      console.error('❌ Failed to start data scheduler:', error);
      throw error;
    }
  }

  /**
   * Stop the data refresh scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('📊 Data scheduler is not running');
      return;
    }

    // Stop all scheduled tasks
    this.scheduledTasks.forEach(task => task.stop());
    this.scheduledTasks = [];

    // Clear cache
    this.cache.clear();

    this.isRunning = false;
    console.log('🛑 Data scheduler stopped');
  }

  /**
   * Get cached data or fetch from API if not cached
   */
  async getCachedCurrentData(): Promise<BitcoinData> {
    const cacheKey = 'current-bitcoin-data';
    this.cacheStats.totalRequests++;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      this.cacheStats.cacheHits++;
      console.log('📦 Serving Bitcoin data from cache');
      return cached.data;
    }

    // Fetch from API and cache
    try {
      const data = await bitcoinAPI.getCurrentPrice();
      this.setCacheEntry(cacheKey, data, this.cacheTTLs.current);
      console.log('🌐 Fetched fresh Bitcoin data from API');
      return data;
    } catch (error) {
      // If API fails and we have expired cache, return it anyway
      if (cached) {
        console.warn('⚠️ API failed, serving expired cache data');
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Get cached recent data
   */
  async getCachedRecentData(hours: number = 24): Promise<BitcoinData[]> {
    const cacheKey = `recent-bitcoin-data-${hours}h`;
    this.cacheStats.totalRequests++;

    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      this.cacheStats.cacheHits++;
      console.log(`📦 Serving recent Bitcoin data (${hours}h) from cache`);
      return cached.data as unknown as BitcoinData[];
    }

    // Fetch from storage first, then API if needed
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      let data = await bitcoinStorage.queryBitcoinDataByTimeRange(cutoffTime, new Date(), hours * 2);

      // If we don't have enough recent data, fetch from API
      if (data.length < hours / 2) { // Expect at least one data point per 2 hours
        console.log('📡 Insufficient recent data in storage, fetching from API');
        const apiData = await bitcoinAPI.getRecentData(hours);
        await bitcoinStorage.storeBitcoinDataBatch(apiData);
        data = apiData;
      }

      this.setCacheEntry(cacheKey, data as unknown as BitcoinData, this.cacheTTLs.recent);
      return data;
    } catch (error) {
      if (cached) {
        console.warn('⚠️ Failed to fetch recent data, serving expired cache');
        return cached.data as unknown as BitcoinData[];
      }
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    const hitRate = this.cacheStats.totalRequests > 0 
      ? (this.cacheStats.cacheHits / this.cacheStats.totalRequests) * 100 
      : 0;

    return {
      entries: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      totalRequests: this.cacheStats.totalRequests,
      cacheHits: this.cacheStats.cacheHits
    };
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheStats.totalRequests = 0;
    this.cacheStats.cacheHits = 0;
    console.log('🧹 Cache cleared');
  }

  /**
   * Get scheduler status
   */
  getStatus(): { running: boolean; activeTasks: number; cacheStats: CacheStats } {
    return {
      running: this.isRunning,
      activeTasks: this.scheduledTasks.filter(task => task.getStatus() === 'scheduled').length,
      cacheStats: this.getCacheStats()
    };
  }

  // Private methods

  private async initialDataFetch(): Promise<void> {
    console.log('🔄 Performing initial data fetch...');
    
    try {
      // Fetch and store initial current data
      await this.fetchAndStoreCurrent();
      
      // Fetch and store some historical data
      await this.fetchAndStoreHistorical();
      
      console.log('✅ Initial data fetch completed');
    } catch (error) {
      console.error('❌ Initial data fetch failed:', error);
      // Don't throw - scheduler can still work with API calls
    }
  }

  private async fetchAndStoreCurrent(): Promise<void> {
    try {
      const data = await bitcoinAPI.getCurrentPrice();
      await bitcoinStorage.storeBitcoinData(data);
      
      // Update cache
      this.setCacheEntry('current-bitcoin-data', data, this.cacheTTLs.current);
      
      console.log(`💰 Current Bitcoin price updated: $${data.price.toFixed(2)}`);
    } catch (error) {
      console.error('❌ Failed to fetch current Bitcoin price:', error);
    }
  }

  private async fetchAndStoreDetailed(): Promise<void> {
    try {
      const data = await bitcoinAPI.getDetailedData();
      await bitcoinStorage.storeBitcoinData(data);
      
      console.log(`📊 Detailed Bitcoin data updated: $${data.price.toFixed(2)} (${data.changePercentage24h.toFixed(2)}%)`);
    } catch (error) {
      console.error('❌ Failed to fetch detailed Bitcoin data:', error);
    }
  }

  private async fetchAndStoreHistorical(): Promise<void> {
    try {
      // Fetch last 24 hours of data
      const data = await bitcoinAPI.getHistoricalData(1);
      await bitcoinStorage.storeBitcoinDataBatch(data);
      
      console.log(`📈 Historical Bitcoin data updated: ${data.length} data points`);
    } catch (error) {
      console.error('❌ Failed to fetch historical Bitcoin data:', error);
    }
  }

  private async cleanupOldStorageData(): Promise<void> {
    try {
      const deletedCount = await bitcoinStorage.cleanupOldData(30); // Keep 30 days
      console.log(`🧹 Storage cleanup completed: ${deletedCount} old records removed`);
    } catch (error) {
      console.error('❌ Storage cleanup failed:', error);
    }
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      console.log(`🧹 Cache cleanup: ${expiredCount} expired entries removed`);
    }
  }

  private setCacheEntry(key: string, data: BitcoinData | BitcoinData[], ttl: number): void {
    this.cache.set(key, {
      data: data as BitcoinData,
      timestamp: Date.now(),
      ttl
    });
  }

  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() <= entry.timestamp + entry.ttl;
  }
}

// Export a singleton instance
export const dataScheduler = new DataSchedulerService();