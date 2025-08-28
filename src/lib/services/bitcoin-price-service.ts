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
      console.log('🔄 Updating Bitcoin price with realistic simulation...');
      
      // Get the last price for realistic movement calculation
      const lastPrice = await this.getLatestPrice();
      
      let bitcoinData;
      if (lastPrice) {
        // Generate realistic price movement based on last price
        bitcoinData = this.generateRealisticPrice(lastPrice.price);
      } else {
        // First time setup - use current market price as base
        try {
          bitcoinData = await this.apiService.getCurrentPrice();
        } catch (apiError) {
          // Fallback to current market level around $100k
          bitcoinData = {
            price: 95000 + Math.random() * 15000, // Random starting price between $95k-$110k
            volume: Math.random() * 1000000000,
            marketCap: 0,
            change24h: (Math.random() - 0.5) * 5000,
            changePercentage24h: (Math.random() - 0.5) * 8,
            high24h: 0,
            low24h: 0,
            source: 'realistic-simulation'
          };
        }
      }
      
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
   * Generate realistic Bitcoin price movement based on previous price
   */
  private generateRealisticPrice(lastPrice: number) {
    // Realistic Bitcoin volatility parameters
    const volatility = 0.02; // 2% typical volatility
    const trend = (Math.random() - 0.5) * 0.001; // Small random trend
    
    // Generate random walk with some momentum
    const randomComponent = (Math.random() - 0.5) * volatility;
    const momentumComponent = trend;
    
    // Calculate new price with bounds to prevent extreme movements
    const priceChange = lastPrice * (randomComponent + momentumComponent);
    let newPrice = lastPrice + priceChange;
    
    // Ensure price stays within realistic bounds around current market levels
    newPrice = Math.max(80000, Math.min(130000, newPrice));
    
    // Calculate 24h change (simplified for simulation)
    const change24h = newPrice - lastPrice;
    const changePercentage24h = (change24h / lastPrice) * 100;
    
    // Generate realistic volume (varies with price movement)
    const baseVolume = 500000000; // Base volume
    const volumeMultiplier = 1 + Math.abs(changePercentage24h) * 0.1;
    const volume = baseVolume * volumeMultiplier * (0.8 + Math.random() * 0.4);
    
    return {
      price: Math.round(newPrice * 100) / 100, // Round to 2 decimals
      volume: Math.round(volume),
      marketCap: Math.round(newPrice * 19700000), // Approximate BTC supply
      change24h: Math.round(change24h * 100) / 100,
      changePercentage24h: Math.round(changePercentage24h * 100) / 100,
      high24h: Math.max(lastPrice, newPrice),
      low24h: Math.min(lastPrice, newPrice),
      source: 'realistic-simulation'
    };
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