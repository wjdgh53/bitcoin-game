// Bitcoin API service - Wrapper for CoinGecko API

import { BitcoinData } from '@/types/game';
import { ValidationUtils } from '@/lib/validation/schemas';
import { CoinGeckoAPIService } from './coingecko-api';

export class BitcoinAPIService {
  private coinGeckoService: CoinGeckoAPIService;

  constructor() {
    this.coinGeckoService = new CoinGeckoAPIService();
    console.log('🔧 BitcoinAPIService initialized with CoinGecko API');
  }

  /**
   * Get current Bitcoin price and basic market data
   */
  async getCurrentPrice(): Promise<BitcoinData> {
    try {
      const bitcoinData = await this.coinGeckoService.getCurrentPrice();
      return ValidationUtils.validateBitcoinData(bitcoinData);
    } catch (error) {
      console.error('Error fetching Bitcoin price:', error);
      throw error;
    }
  }

  /**
   * Get detailed Bitcoin data with high/low values
   */
  async getDetailedData(): Promise<BitcoinData> {
    try {
      const bitcoinData = await this.coinGeckoService.getDetailedData();
      return ValidationUtils.validateBitcoinData(bitcoinData);
    } catch (error) {
      console.error('Error fetching detailed Bitcoin data:', error);
      throw error;
    }
  }

  /**
   * Get historical Bitcoin data for a specific time range
   */
  async getHistoricalData(days: number = 7): Promise<BitcoinData[]> {
    try {
      const historicalData = await this.coinGeckoService.getHistoricalData(days);
      
      // Validate all data points
      const validatedData: BitcoinData[] = [];
      for (const data of historicalData) {
        try {
          validatedData.push(ValidationUtils.validateBitcoinData(data));
        } catch (validationError) {
          console.warn(`Skipping invalid historical data point at ${data.timestamp}:`, validationError);
        }
      }

      return validatedData;
    } catch (error) {
      console.error('Error fetching historical Bitcoin data:', error);
      throw error;
    }
  }

  /**
   * Get Bitcoin data for the last N hours
   */
  async getRecentData(hours: number = 24): Promise<BitcoinData[]> {
    try {
      const recentData = await this.coinGeckoService.getRecentData(hours);
      
      // Validate all data points
      const validatedData: BitcoinData[] = [];
      for (const data of recentData) {
        try {
          validatedData.push(ValidationUtils.validateBitcoinData(data));
        } catch (validationError) {
          console.warn(`Skipping invalid recent data point at ${data.timestamp}:`, validationError);
        }
      }

      return validatedData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      console.error('Error fetching recent Bitcoin data:', error);
      throw error;
    }
  }

  /**
   * Health check for the API service
   */
  async healthCheck(): Promise<boolean> {
    try {
      return await this.coinGeckoService.healthCheck();
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
      return await this.coinGeckoService.getAPIStatus();
    } catch (error) {
      return { 
        healthy: false,
        rateLimitInfo: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}

// Export a singleton instance
export const bitcoinAPI = new BitcoinAPIService();