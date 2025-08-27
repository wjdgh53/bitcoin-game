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
   * Fetch current price from CoinGecko and save to database
   */
  async updateCurrentPrice(): Promise<BitcoinPrice> {
    try {
      console.log('🔄 Fetching current Bitcoin price from CoinGecko...');
      
      // Fetch from API
      const bitcoinData = await this.apiService.getCurrentPrice();
      
      // Save to database
      const savedPrice = await prisma.bitcoinPrice.create({
        data: {
          price: bitcoinData.price,
          volume: bitcoinData.volume,
          marketCap: bitcoinData.marketCap,
          change24h: bitcoinData.change24h,
          changePercentage24h: bitcoinData.changePercentage24h,
          high24h: bitcoinData.high24h || bitcoinData.price,
          low24h: bitcoinData.low24h || bitcoinData.price,
          source: bitcoinData.source,
        },
      });

      console.log(`✅ Bitcoin price updated: $${bitcoinData.price.toLocaleString()}`);
      return savedPrice;
    } catch (error) {
      console.error('❌ Failed to update Bitcoin price:', error);
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

  /**
   * Get Bitcoin price history for charts
   */
  async getPriceHistory(hours: number = 24): Promise<BitcoinPrice[]> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const history = await prisma.bitcoinPrice.findMany({
        where: {
          timestamp: {
            gte: since,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      return history;
    } catch (error) {
      console.error('Error fetching price history:', error);
      return [];
    }
  }

  /**
   * Initialize demo portfolio if it doesn't exist
   */
  async initializeDemoPortfolio(): Promise<Portfolio> {
    try {
      const existingPortfolio = await prisma.portfolio.findUnique({
        where: { userId: 'demo-user' },
      });

      if (existingPortfolio) {
        return existingPortfolio;
      }

      const portfolio = await prisma.portfolio.create({
        data: {
          userId: 'demo-user',
          balance: 10000.0,
          bitcoinHoldings: 0.0,
          totalValue: 10000.0,
          profit: 0.0,
          profitPercentage: 0.0,
        },
      });

      console.log('✅ Demo portfolio initialized');
      return portfolio;
    } catch (error) {
      console.error('Error initializing demo portfolio:', error);
      throw error;
    }
  }

  /**
   * Update portfolio value based on current Bitcoin price
   */
  async updatePortfolioValue(): Promise<Portfolio | null> {
    try {
      const portfolio = await prisma.portfolio.findUnique({
        where: { userId: 'demo-user' },
      });

      const latestPrice = await this.getLatestPrice();
      
      if (!portfolio || !latestPrice) {
        return null;
      }

      const bitcoinValue = portfolio.bitcoinHoldings * latestPrice.price;
      const totalValue = portfolio.balance + bitcoinValue;
      const profit = totalValue - 10000; // Initial balance was $10,000
      const profitPercentage = (profit / 10000) * 100;

      const updatedPortfolio = await prisma.portfolio.update({
        where: { userId: 'demo-user' },
        data: {
          totalValue,
          profit,
          profitPercentage,
          lastUpdated: new Date(),
        },
      });

      return updatedPortfolio;
    } catch (error) {
      console.error('Error updating portfolio value:', error);
      return null;
    }
  }

  /**
   * Execute a trade (buy or sell Bitcoin)
   */
  async executeTrade(type: 'buy' | 'sell', amount: number): Promise<{ success: boolean; message: string }> {
    try {
      const latestPrice = await this.getLatestPrice();
      if (!latestPrice) {
        return { success: false, message: 'Price data not available' };
      }

      const portfolio = await prisma.portfolio.findUnique({
        where: { userId: 'demo-user' },
      });

      if (!portfolio) {
        return { success: false, message: 'Portfolio not found' };
      }

      const totalCost = amount * latestPrice.price;

      if (type === 'buy') {
        if (portfolio.balance < totalCost) {
          return { success: false, message: 'Insufficient balance' };
        }

        // Execute buy transaction
        await prisma.$transaction([
          // Update portfolio
          prisma.portfolio.update({
            where: { userId: 'demo-user' },
            data: {
              balance: { decrement: totalCost },
              bitcoinHoldings: { increment: amount },
            },
          }),
          // Record trade
          prisma.trade.create({
            data: {
              userId: 'demo-user',
              type: 'buy',
              amount,
              price: latestPrice.price,
              total: totalCost,
            },
          }),
        ]);

        return { success: true, message: `Bought ${amount} BTC for $${totalCost.toFixed(2)}` };
      } else {
        // Sell
        if (portfolio.bitcoinHoldings < amount) {
          return { success: false, message: 'Insufficient Bitcoin holdings' };
        }

        // Execute sell transaction
        await prisma.$transaction([
          // Update portfolio
          prisma.portfolio.update({
            where: { userId: 'demo-user' },
            data: {
              balance: { increment: totalCost },
              bitcoinHoldings: { decrement: amount },
            },
          }),
          // Record trade
          prisma.trade.create({
            data: {
              userId: 'demo-user',
              type: 'sell',
              amount,
              price: latestPrice.price,
              total: totalCost,
            },
          }),
        ]);

        return { success: true, message: `Sold ${amount} BTC for $${totalCost.toFixed(2)}` };
      }
    } catch (error) {
      console.error('Error executing trade:', error);
      return { success: false, message: 'Trade execution failed' };
    }
  }

  /**
   * Get demo portfolio
   */
  async getDemoPortfolio(): Promise<Portfolio | null> {
    try {
      const portfolio = await prisma.portfolio.findUnique({
        where: { userId: 'demo-user' },
      });

      if (!portfolio) {
        return await this.initializeDemoPortfolio();
      }

      return portfolio;
    } catch (error) {
      console.error('Error getting demo portfolio:', error);
      return null;
    }
  }

  /**
   * Get trade history
   */
  async getTradeHistory(limit: number = 50) {
    try {
      const trades = await prisma.trade.findMany({
        where: { userId: 'demo-user' },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      return trades;
    } catch (error) {
      console.error('Error fetching trade history:', error);
      return [];
    }
  }

  /**
   * Clean up old price data (keep last 7 days)
   */
  async cleanupOldPrices(): Promise<number> {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const result = await prisma.bitcoinPrice.deleteMany({
        where: {
          timestamp: {
            lt: sevenDaysAgo,
          },
        },
      });

      if (result.count > 0) {
        console.log(`🧹 Cleaned up ${result.count} old price records`);
      }

      return result.count;
    } catch (error) {
      console.error('Error cleaning up old prices:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const bitcoinPriceService = new BitcoinPriceService();