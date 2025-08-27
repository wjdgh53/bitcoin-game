// Bitcoin API service with CoinGecko integration

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { BitcoinData } from '@/types/game';
import { ValidationUtils } from '@/lib/validation/schemas';

// CoinGecko API response interfaces
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

export class BitcoinAPIService {
  private api: AxiosInstance;
  private readonly coinId = 'bitcoin';
  private readonly currency = 'usd';
  private readonly baseURL = 'https://api.coingecko.com/api/v3';
  private lastRequestTime: number = 0;
  private readonly rateLimitDelay = 1000; // 1 second between requests

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // Add rate limiting interceptor
    this.api.interceptors.request.use(async (config) => {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.rateLimitDelay) {
        await this.sleep(this.rateLimitDelay - timeSinceLastRequest);
      }
      
      this.lastRequestTime = Date.now();
      return config;
    });

    // Add response error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Bitcoin API Error:', error.message);
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw error;
      }
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current Bitcoin price and basic market data
   */
  async getCurrentPrice(): Promise<BitcoinData> {
    try {
      const response: AxiosResponse<CoinGeckoSimplePrice> = await this.api.get(
        `/simple/price?ids=${this.coinId}&vs_currencies=${this.currency}&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`
      );

      const data = response.data.bitcoin;
      const now = new Date();
      
      const bitcoinData: BitcoinData = {
        id: `bitcoin-${now.getTime()}`,
        timestamp: now,
        price: data.usd,
        volume: data.usd_24h_vol,
        marketCap: data.usd_market_cap,
        change24h: data.usd_24h_change,
        changePercentage24h: data.usd_24h_change,
        high24h: data.usd, // CoinGecko simple API doesn't include high/low
        low24h: data.usd,  // We'll get these from detailed endpoint
        source: 'coingecko',
        volatility: Math.abs(data.usd_24h_change / data.usd) * 100
      };

      // Validate the data before returning
      return ValidationUtils.validateBitcoinData(bitcoinData);
    } catch (error) {
      console.error('Error fetching current Bitcoin price:', error);
      throw new Error(`Failed to fetch current Bitcoin price: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get detailed Bitcoin data with high/low values
   */
  async getDetailedData(): Promise<BitcoinData> {
    try {
      const response: AxiosResponse<CoinGeckoCoinData> = await this.api.get(`/coins/${this.coinId}`);
      
      const coin = response.data;
      const marketData = coin.market_data;
      const now = new Date();

      const bitcoinData: BitcoinData = {
        id: `bitcoin-detailed-${now.getTime()}`,
        timestamp: now,
        price: marketData.current_price.usd,
        volume: marketData.total_volume.usd,
        marketCap: marketData.market_cap.usd,
        change24h: marketData.price_change_24h,
        changePercentage24h: marketData.price_change_percentage_24h,
        high24h: marketData.high_24h.usd,
        low24h: marketData.low_24h.usd,
        source: 'coingecko',
        volatility: Math.abs(marketData.price_change_percentage_24h)
      };

      return ValidationUtils.validateBitcoinData(bitcoinData);
    } catch (error) {
      console.error('Error fetching detailed Bitcoin data:', error);
      throw new Error(`Failed to fetch detailed Bitcoin data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get historical Bitcoin data for a specific time range
   */
  async getHistoricalData(days: number = 7): Promise<BitcoinData[]> {
    try {
      const response: AxiosResponse<CoinGeckoHistoricalData> = await this.api.get(
        `/coins/${this.coinId}/market_chart?vs_currency=${this.currency}&days=${days}&interval=hourly`
      );

      const { prices, market_caps, total_volumes } = response.data;
      const bitcoinDataArray: BitcoinData[] = [];

      for (let i = 0; i < prices.length; i++) {
        const [timestamp, price] = prices[i];
        const [, marketCap] = market_caps[i] || [timestamp, 0];
        const [, volume] = total_volumes[i] || [timestamp, 0];

        // Calculate 24h change (compare with price from 24 hours ago)
        const previousIndex = Math.max(0, i - 24); // 24 hours ago (hourly data)
        const previousPrice = prices[previousIndex]?.[1] || price;
        const change24h = price - previousPrice;
        const changePercentage24h = previousPrice > 0 ? (change24h / previousPrice) * 100 : 0;

        // Calculate high/low for the day (use surrounding 24 hours)
        const dayStart = Math.max(0, i - 12);
        const dayEnd = Math.min(prices.length - 1, i + 12);
        const dayPrices = prices.slice(dayStart, dayEnd + 1).map(([, p]) => p);
        const high24h = Math.max(...dayPrices);
        const low24h = Math.min(...dayPrices);

        const bitcoinData: BitcoinData = {
          id: `bitcoin-historical-${timestamp}`,
          timestamp: new Date(timestamp),
          price,
          volume,
          marketCap,
          change24h,
          changePercentage24h,
          high24h,
          low24h,
          source: 'coingecko',
          volatility: Math.abs(changePercentage24h)
        };

        try {
          bitcoinDataArray.push(ValidationUtils.validateBitcoinData(bitcoinData));
        } catch (validationError) {
          console.warn(`Skipping invalid historical data point at ${timestamp}:`, validationError);
        }
      }

      return bitcoinDataArray;
    } catch (error) {
      console.error('Error fetching historical Bitcoin data:', error);
      throw new Error(`Failed to fetch historical Bitcoin data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get Bitcoin data for the last N hours
   */
  async getRecentData(hours: number = 24): Promise<BitcoinData[]> {
    try {
      // For recent data, use 1-day history with hourly intervals
      const days = Math.max(1, Math.ceil(hours / 24));
      const response: AxiosResponse<CoinGeckoHistoricalData> = await this.api.get(
        `/coins/${this.coinId}/market_chart?vs_currency=${this.currency}&days=${days}&interval=hourly`
      );

      const { prices, market_caps, total_volumes } = response.data;
      const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
      const bitcoinDataArray: BitcoinData[] = [];

      for (let i = 0; i < prices.length; i++) {
        const [timestamp, price] = prices[i];
        
        // Skip data points older than the requested hours
        if (timestamp < cutoffTime) continue;

        const [, marketCap] = market_caps[i] || [timestamp, 0];
        const [, volume] = total_volumes[i] || [timestamp, 0];

        // Calculate changes
        const previousPrice = prices[Math.max(0, i - 1)]?.[1] || price;
        const change24h = price - previousPrice;
        const changePercentage24h = previousPrice > 0 ? (change24h / previousPrice) * 100 : 0;

        const bitcoinData: BitcoinData = {
          id: `bitcoin-recent-${timestamp}`,
          timestamp: new Date(timestamp),
          price,
          volume,
          marketCap,
          change24h,
          changePercentage24h,
          high24h: price, // For recent data, we'll update these in real-time
          low24h: price,
          source: 'coingecko',
          volatility: Math.abs(changePercentage24h)
        };

        try {
          bitcoinDataArray.push(ValidationUtils.validateBitcoinData(bitcoinData));
        } catch (validationError) {
          console.warn(`Skipping invalid recent data point at ${timestamp}:`, validationError);
        }
      }

      return bitcoinDataArray.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      console.error('Error fetching recent Bitcoin data:', error);
      throw new Error(`Failed to fetch recent Bitcoin data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Health check for the API service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.api.get('/ping');
      return response.status === 200;
    } catch (error) {
      console.error('Bitcoin API health check failed:', error);
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
          lastRequestTime: this.lastRequestTime,
          rateLimitDelay: this.rateLimitDelay
        }
      };
    } catch (error) {
      return { healthy: false };
    }
  }
}

// Export a singleton instance
export const bitcoinAPI = new BitcoinAPIService();