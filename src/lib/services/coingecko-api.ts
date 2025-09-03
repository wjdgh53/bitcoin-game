// CoinGecko API service for Bitcoin price and historical data

import axios, { AxiosInstance } from 'axios';
import { BitcoinData } from '@/types/game';

interface CoinGeckoSimplePrice {
  bitcoin: {
    usd: number;
    usd_market_cap: number;
    usd_24h_vol: number;
    usd_24h_change: number;
  };
}

interface CoinGeckoHistoricalData {
  prices: [number, number][]; // [timestamp, price]
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

interface CoinGeckoCoinData {
  id: string;
  symbol: string;
  name: string;
  market_data: {
    current_price: { usd: number };
    market_cap: { usd: number };
    total_volume: { usd: number };
    price_change_24h: number;
    price_change_percentage_24h: number;
    high_24h: { usd: number };
    low_24h: { usd: number };
  };
  last_updated: string;
}

export class CoinGeckoAPIService {
  private readonly coinId = 'bitcoin';
  private readonly currency = 'usd';
  private readonly baseURL = 'https://api.coingecko.com/api/v3';
  private lastRequestTime: number = 0;
  private readonly rateLimitDelay = 1000; // 1 second between requests
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BitcoinGame/1.0.0'
      }
    });

    console.log('🔧 CoinGecko API Service initialized');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms`);
      await this.sleep(waitTime);
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Get current Bitcoin price and basic market data
   */
  async getCurrentPrice(): Promise<BitcoinData> {
    try {
      await this.enforceRateLimit();
      console.log('📊 Fetching Bitcoin price from CoinGecko...');
      
      const response = await this.axiosInstance.get<CoinGeckoSimplePrice>(
        `/simple/price?ids=${this.coinId}&vs_currencies=${this.currency}&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`
      );
      
      const data = response.data.bitcoin;
      
      const bitcoinData: BitcoinData = {
        id: `bitcoin-${Date.now()}`,
        timestamp: new Date(),
        price: data.usd,
        volume24h: data.usd_24h_vol,
        marketCap: data.usd_market_cap,
        change24h: data.usd_24h_change,
        changePercentage24h: data.usd_24h_change,
        source: 'coingecko'
      };
      
      console.log(`💰 Bitcoin price: $${bitcoinData.price.toLocaleString()}`);
      return bitcoinData;
    } catch (error) {
      console.error('Error fetching Bitcoin price from CoinGecko:', error);
      throw new Error(`Failed to fetch Bitcoin price: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get detailed Bitcoin data with high/low values
   */
  async getDetailedData(): Promise<BitcoinData> {
    try {
      await this.enforceRateLimit();
      console.log('📈 Fetching detailed Bitcoin data from CoinGecko...');
      
      const response = await this.axiosInstance.get<CoinGeckoCoinData>(`/coins/${this.coinId}`);
      const data = response.data;
      
      const bitcoinData: BitcoinData = {
        id: `bitcoin-detailed-${Date.now()}`,
        timestamp: new Date(),
        price: data.market_data.current_price.usd,
        volume24h: data.market_data.total_volume.usd,
        marketCap: data.market_data.market_cap.usd,
        change24h: data.market_data.price_change_24h,
        changePercentage24h: data.market_data.price_change_percentage_24h,
        high24h: data.market_data.high_24h.usd,
        low24h: data.market_data.low_24h.usd,
        source: 'coingecko'
      };
      
      console.log(`📊 Detailed Bitcoin data: $${bitcoinData.price.toLocaleString()}`);
      return bitcoinData;
    } catch (error) {
      console.error('Error fetching detailed Bitcoin data from CoinGecko:', error);
      throw new Error(`Failed to fetch detailed Bitcoin data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get historical Bitcoin data for a specific time range
   */
  async getHistoricalData(days: number = 7): Promise<BitcoinData[]> {
    try {
      await this.enforceRateLimit();
      console.log(`📚 Fetching ${days} days of historical Bitcoin data from CoinGecko...`);
      
      const response = await this.axiosInstance.get<CoinGeckoHistoricalData>(
        `/coins/${this.coinId}/market_chart?vs_currency=${this.currency}&days=${days}`
      );
      
      const { prices, market_caps, total_volumes } = response.data;
      
      const bitcoinDataArray: BitcoinData[] = [];
      
      // Convert the arrays to BitcoinData objects
      for (let i = 0; i < prices.length; i++) {
        const [timestamp, price] = prices[i];
        const [, marketCap] = market_caps[i] || [timestamp, 0];
        const [, volume] = total_volumes[i] || [timestamp, 0];
        
        bitcoinDataArray.push({
          id: `bitcoin-historical-${timestamp}`,
          timestamp: new Date(timestamp),
          price,
          volume24h: volume,
          marketCap,
          source: 'coingecko'
        });
      }
      
      console.log(`📈 Fetched ${bitcoinDataArray.length} historical data points`);
      return bitcoinDataArray;
    } catch (error) {
      console.error('Error fetching historical Bitcoin data from CoinGecko:', error);
      throw new Error(`Failed to fetch historical Bitcoin data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get Bitcoin data for the last N hours
   */
  async getRecentData(hours: number = 24): Promise<BitcoinData[]> {
    try {
      // Convert hours to days for CoinGecko API
      const days = Math.ceil(hours / 24);
      const historicalData = await this.getHistoricalData(days);
      
      // Filter to only include data within the requested time range
      const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
      const filteredData = historicalData.filter(data => 
        data.timestamp.getTime() >= cutoffTime
      );
      
      console.log(`⏰ Filtered to ${filteredData.length} data points for last ${hours} hours`);
      return filteredData;
    } catch (error) {
      console.error('Error fetching recent Bitcoin data from CoinGecko:', error);
      throw new Error(`Failed to fetch recent Bitcoin data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Health check for the CoinGecko API service
   */
  async healthCheck(): Promise<boolean> {
    try {
      console.log('🔍 Running CoinGecko API health check...');
      
      const response = await this.axiosInstance.get('/ping');
      const isHealthy = response.status === 200;
      
      if (isHealthy) {
        console.log('✅ CoinGecko API health check passed');
      } else {
        console.log('❌ CoinGecko API health check failed');
      }
      
      return isHealthy;
    } catch (error) {
      console.error('CoinGecko API health check failed:', error);
      return false;
    }
  }

  /**
   * Get API status and rate limit info
   */
  async getAPIStatus(): Promise<{ healthy: boolean; rateLimitInfo?: any }> {
    try {
      const healthy = await this.healthCheck();
      return {
        healthy,
        rateLimitInfo: {
          source: 'coingecko',
          lastRequestTime: this.lastRequestTime,
          rateLimitDelay: this.rateLimitDelay,
          baseURL: this.baseURL
        }
      };
    } catch (error) {
      return { 
        healthy: false,
        rateLimitInfo: {
          source: 'coingecko',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}

// Export a singleton instance
export const coinGeckoAPI = new CoinGeckoAPIService();