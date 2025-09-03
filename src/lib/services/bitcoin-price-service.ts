// Bitcoin price service with Prisma database integration

import { BitcoinAPIService } from './bitcoin-api';
import { prisma } from '../database/prisma-client';
import type { BitcoinPrice, Portfolio } from '@prisma/client';

export interface BitcoinPriceData {
  id: number;
  timestamp: Date;
  price: number;
  volume?: number;
  marketCap?: number;
  change24h?: number;
  changePercentage24h?: number;
  high24h?: number;
  low24h?: number;
  source: string;
}

export class BitcoinPriceService {
  private apiService: BitcoinAPIService;

  constructor() {
    this.apiService = new BitcoinAPIService();
  }

  /**
   * Manually fetch and save current Bitcoin price from CoinGecko API
   */
  async updateCurrentPrice(): Promise<BitcoinPrice> {
    try {
      console.log('🔄 Fetching Bitcoin price from CoinGecko API...');
      
      // Fetch detailed price data including high/low from CoinGecko API
      const bitcoinData = await this.apiService.getDetailedData();
      
      // Save to database
      const savedPrice = await prisma.bitcoinPrice.create({
        data: {
          price: bitcoinData.price,
          volume: bitcoinData.volume24h || null,
          marketCap: bitcoinData.marketCap || null,
          change24h: bitcoinData.change24h || null,
          changePercentage24h: bitcoinData.changePercentage24h || null,
          high24h: bitcoinData.high24h || null,
          low24h: bitcoinData.low24h || null,
          source: 'coingecko'
        }
      });

      console.log(`✅ Bitcoin price saved: $${savedPrice.price.toLocaleString()}`);
      return savedPrice;
    } catch (error) {
      console.error('❌ Failed to fetch and save Bitcoin price:', error);
      throw error;
    }
  }


  /**
   * Get latest Bitcoin price from database
   */
  async getLatestPrice(): Promise<BitcoinPrice | null> {
    try {
      const latestPrice = await prisma.bitcoinPrice.findFirst({
        orderBy: {
          timestamp: 'desc',
        },
      });

      return latestPrice;
    } catch (error) {
      console.error('Error fetching latest price:', error);
      return null;
    }
  }

  // Historical functions removed - only current price supported

  /**
   * Fetch current Bitcoin price from API (memory only)
   */
  async fetchCurrentPriceToMemory(): Promise<any> {
    try {
      console.log('🔄 Fetching Bitcoin price from CoinGecko API (memory only)...');
      
      // Fetch detailed price data including high/low from CoinGecko API
      const bitcoinData = await this.apiService.getDetailedData();
      
      console.log(`💰 Bitcoin price fetched: $${bitcoinData.price.toLocaleString()}`);
      return bitcoinData;
    } catch (error) {
      console.error('❌ Failed to fetch Bitcoin price:', error);
      throw error;
    }
  }

  /**
   * Save Bitcoin price data to database
   */
  async savePriceToDatabase(priceData: any): Promise<BitcoinPrice> {
    try {
      console.log('💾 Saving Bitcoin price to database...');
      
      // Save to database
      const savedPrice = await prisma.bitcoinPrice.create({
        data: {
          price: priceData.price,
          volume: priceData.volume24h || null,
          marketCap: priceData.marketCap || null,
          change24h: priceData.change24h || null,
          changePercentage24h: priceData.changePercentage24h || null,
          high24h: priceData.high24h || null,
          low24h: priceData.low24h || null,
          source: 'coingecko'
        }
      });

      console.log(`✅ Bitcoin price saved to database: $${savedPrice.price.toLocaleString()}`);
      return savedPrice;
    } catch (error) {
      console.error('❌ Failed to save Bitcoin price to database:', error);
      throw error;
    }
  }

  // Portfolio functions removed - only price functionality supported

}

// Export singleton instance
export const bitcoinPriceService = new BitcoinPriceService();