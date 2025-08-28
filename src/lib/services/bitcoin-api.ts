// Bitcoin API service - Mock data implementation (temporarily replacing CoinGecko API)

import { BitcoinData } from '@/types/game';
import { ValidationUtils } from '@/lib/validation/schemas';
import mockBitcoinData from '@/lib/utils/mock-bitcoin-data';

// Mock interfaces (kept for compatibility)
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
  private readonly coinId = 'bitcoin';
  private readonly currency = 'usd';
  private readonly baseURL = 'https://api.coingecko.com/api/v3'; // Kept for reference
  private lastRequestTime: number = 0;
  private readonly rateLimitDelay = 1000; // 1 second between requests

  constructor() {
    // No axios setup needed for mock implementation
    console.log('🔧 BitcoinAPIService initialized with MOCK DATA (external API calls disabled)');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current Bitcoin price and basic market data (MOCK IMPLEMENTATION)
   */
  async getCurrentPrice(): Promise<BitcoinData> {
    try {
      console.log('📊 Fetching Bitcoin price from MOCK DATA...');
      
      // Simulate API delay for realistic behavior
      await this.sleep(200 + Math.random() * 300); // 200-500ms delay
      
      // Generate mock data using time-based variation
      const bitcoinData = mockBitcoinData.getCurrentMockPrice();
      
      // Override source to indicate mock data
      bitcoinData.source = 'mock-data';
      
      console.log(`💰 Mock Bitcoin price: $${bitcoinData.price.toLocaleString()}`);
      
      // Validate the data before returning
      return ValidationUtils.validateBitcoinData(bitcoinData);
    } catch (error) {
      console.error('Error generating mock Bitcoin price:', error);
      throw new Error(`Failed to generate mock Bitcoin price: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get detailed Bitcoin data with high/low values (MOCK IMPLEMENTATION)
   */
  async getDetailedData(): Promise<BitcoinData> {
    try {
      console.log('📈 Fetching detailed Bitcoin data from MOCK DATA...');
      
      // Simulate API delay
      await this.sleep(300 + Math.random() * 400);
      
      // Generate detailed mock data with proper high/low values
      const bitcoinData = mockBitcoinData.generateMockBitcoinData();
      bitcoinData.source = 'mock-data';
      bitcoinData.id = `bitcoin-detailed-${Date.now()}`;
      
      console.log(`📊 Mock detailed data generated: $${bitcoinData.price.toLocaleString()}`);
      
      return ValidationUtils.validateBitcoinData(bitcoinData);
    } catch (error) {
      console.error('Error generating mock detailed Bitcoin data:', error);
      throw new Error(`Failed to generate mock detailed Bitcoin data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get historical Bitcoin data for a specific time range (MOCK IMPLEMENTATION)
   */
  async getHistoricalData(days: number = 7): Promise<BitcoinData[]> {
    try {
      console.log(`📚 Generating mock historical Bitcoin data for ${days} days...`);
      
      // Simulate API delay proportional to data amount
      await this.sleep(400 + Math.random() * 600);
      
      // Generate mock historical data
      const hours = days * 24;
      const bitcoinDataArray = mockBitcoinData.generateMockHistoricalData(hours);
      
      // Override source for all data points
      bitcoinDataArray.forEach(data => {
        data.source = 'mock-data';
      });

      console.log(`📈 Generated ${bitcoinDataArray.length} mock historical data points`);
      
      // Validate all data points
      const validatedData: BitcoinData[] = [];
      for (const data of bitcoinDataArray) {
        try {
          validatedData.push(ValidationUtils.validateBitcoinData(data));
        } catch (validationError) {
          console.warn(`Skipping invalid mock historical data point at ${data.timestamp}:`, validationError);
        }
      }

      return validatedData;
    } catch (error) {
      console.error('Error generating mock historical Bitcoin data:', error);
      throw new Error(`Failed to generate mock historical Bitcoin data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get Bitcoin data for the last N hours (MOCK IMPLEMENTATION)
   */
  async getRecentData(hours: number = 24): Promise<BitcoinData[]> {
    try {
      console.log(`🕐 Generating mock recent Bitcoin data for last ${hours} hours...`);
      
      // Simulate API delay
      await this.sleep(300 + Math.random() * 400);
      
      // Generate recent mock data
      const bitcoinDataArray = mockBitcoinData.generateMockHistoricalData(hours);
      
      // Filter to only include data within the requested time range
      const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
      const filteredData = bitcoinDataArray.filter(data => 
        data.timestamp.getTime() >= cutoffTime
      );
      
      // Override source for all data points
      filteredData.forEach(data => {
        data.source = 'mock-data';
        data.id = `bitcoin-recent-${data.timestamp.getTime()}`;
      });

      console.log(`⏰ Generated ${filteredData.length} mock recent data points`);
      
      // Validate all data points
      const validatedData: BitcoinData[] = [];
      for (const data of filteredData) {
        try {
          validatedData.push(ValidationUtils.validateBitcoinData(data));
        } catch (validationError) {
          console.warn(`Skipping invalid mock recent data point at ${data.timestamp}:`, validationError);
        }
      }

      return validatedData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      console.error('Error generating mock recent Bitcoin data:', error);
      throw new Error(`Failed to generate mock recent Bitcoin data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Health check for the API service (MOCK IMPLEMENTATION)
   */
  async healthCheck(): Promise<boolean> {
    try {
      console.log('🔍 Running mock API health check...');
      
      // Simulate network delay
      await this.sleep(100 + Math.random() * 200);
      
      // Mock implementation always returns healthy
      console.log('✅ Mock API health check passed');
      return true;
    } catch (error) {
      console.error('Mock Bitcoin API health check failed:', error);
      return false;
    }
  }

  /**
   * Get API status and rate limit info (MOCK IMPLEMENTATION)
   */
  async getAPIStatus(): Promise<{ healthy: boolean; rateLimitInfo?: any }> {
    try {
      const healthy = await this.healthCheck();
      return {
        healthy,
        rateLimitInfo: {
          source: 'mock-data',
          lastRequestTime: this.lastRequestTime,
          rateLimitDelay: this.rateLimitDelay,
          mockMode: true,
          basePrice: mockBitcoinData.BASE_PRICE
        }
      };
    } catch (error) {
      return { 
        healthy: false,
        rateLimitInfo: {
          source: 'mock-data',
          mockMode: true,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}

// Export a singleton instance
export const bitcoinAPI = new BitcoinAPIService();