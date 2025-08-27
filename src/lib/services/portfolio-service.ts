// Portfolio management service with ChromaDB

import { ChromaClient } from 'chromadb';
import { Portfolio, Trade } from '@/types/game';
import { PortfolioDocument, TradeDocument, DocumentMapper, COLLECTION_NAMES } from '@/lib/database/schemas';
import { ValidationUtils } from '@/lib/validation/schemas';
import { bitcoinAPI } from './bitcoin-api';
import { v4 as uuidv4 } from 'uuid';

export interface TradeExecutionRequest {
  userId: string;
  type: 'buy' | 'sell';
  amount: number; // Amount of Bitcoin to buy/sell
  price?: number; // Optional: Use market price if not provided
}

export interface PortfolioStats {
  totalValue: number;
  profit: number;
  profitPercentage: number;
  totalTrades: number;
  winRate: number;
  bestTrade: Trade | null;
  worstTrade: Trade | null;
}

export class PortfolioService {
  private chroma: ChromaClient;
  private portfolioCollection: any = null;
  private tradesCollection: any = null;

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
      // Get portfolio collection
      this.portfolioCollection = await this.chroma.getCollection({
        name: COLLECTION_NAMES.USER_PORTFOLIOS
      });

      // Get or create trades collection
      try {
        this.tradesCollection = await this.chroma.getCollection({
          name: COLLECTION_NAMES.TRADES
        });
      } catch {
        this.tradesCollection = await this.chroma.createCollection({
          name: COLLECTION_NAMES.TRADES,
          metadata: {
            description: 'User trading transactions and history',
            category: 'trading_data'
          }
        });
      }

      console.log('✅ Portfolio service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize portfolio service:', error);
      throw new Error(`Portfolio service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user portfolio
   */
  async getUserPortfolio(userId: string): Promise<Portfolio | null> {
    await this.ensureInitialized();

    try {
      const results = await this.portfolioCollection.query({
        queryTexts: [`user portfolio ${userId}`],
        nResults: 1,
        where: { user_id: userId },
        include: ['documents', 'metadatas']
      });

      if (!results.documents || !results.documents[0] || results.documents[0].length === 0) {
        return null;
      }

      const portfolioDoc = JSON.parse(results.documents[0][0]) as Portfolio;
      
      // Convert string dates to Date objects
      portfolioDoc.createdAt = new Date(portfolioDoc.createdAt);
      portfolioDoc.updatedAt = new Date(portfolioDoc.updatedAt);
      
      // Get trades for this portfolio
      const trades = await this.getPortfolioTrades(portfolioDoc.id);
      portfolioDoc.trades = trades;

      return ValidationUtils.validatePortfolio(portfolioDoc);
    } catch (error) {
      console.error('❌ Error getting user portfolio:', error);
      return null;
    }
  }

  /**
   * Execute a trade (buy or sell Bitcoin)
   */
  async executeTrade(request: TradeExecutionRequest): Promise<Trade> {
    await this.ensureInitialized();

    try {
      // Get user's portfolio
      const portfolio = await this.getUserPortfolio(request.userId);
      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      // Get current Bitcoin price if not provided
      const bitcoinPrice = request.price || (await bitcoinAPI.getCurrentPrice()).price;

      // Calculate trade total
      const tradeTotal = request.amount * bitcoinPrice;
      const tradeFee = tradeTotal * 0.001; // 0.1% trading fee
      const totalWithFee = tradeTotal + tradeFee;

      // Validate trade
      if (request.type === 'buy') {
        if (portfolio.balance < totalWithFee) {
          throw new Error(`Insufficient balance. Need $${totalWithFee.toFixed(2)}, have $${portfolio.balance.toFixed(2)}`);
        }
      } else { // sell
        if (portfolio.bitcoinHoldings < request.amount) {
          throw new Error(`Insufficient Bitcoin. Trying to sell ${request.amount} BTC, have ${portfolio.bitcoinHoldings} BTC`);
        }
      }

      // Create trade record
      const trade: Trade = {
        id: uuidv4(),
        userId: request.userId,
        portfolioId: portfolio.id,
        type: request.type,
        amount: request.amount,
        price: bitcoinPrice,
        total: tradeTotal,
        fee: tradeFee,
        timestamp: new Date(),
        status: 'completed',
        reason: undefined
      };

      // Validate trade
      const validatedTrade = ValidationUtils.validateTrade(trade);

      // Update portfolio based on trade type
      let newBalance = portfolio.balance;
      let newBitcoinHoldings = portfolio.bitcoinHoldings;

      if (request.type === 'buy') {
        newBalance -= totalWithFee;
        newBitcoinHoldings += request.amount;
      } else { // sell
        newBalance += (tradeTotal - tradeFee);
        newBitcoinHoldings -= request.amount;
      }

      // Calculate new portfolio value and profit
      const newTotalValue = newBalance + (newBitcoinHoldings * bitcoinPrice);
      const initialBalance = parseFloat(process.env.INITIAL_BALANCE || '10000');
      const newProfit = newTotalValue - initialBalance;
      const newProfitPercentage = (newProfit / initialBalance) * 100;

      // Update portfolio
      const updatedPortfolio: Portfolio = {
        ...portfolio,
        balance: newBalance,
        bitcoinHoldings: newBitcoinHoldings,
        totalValue: newTotalValue,
        profit: newProfit,
        profitPercentage: newProfitPercentage,
        trades: [...portfolio.trades, validatedTrade],
        updatedAt: new Date()
      };

      // Store trade in ChromaDB
      const tradeDoc = DocumentMapper.tradeToDocument(validatedTrade);
      await this.tradesCollection.add({
        ids: [tradeDoc.id],
        documents: [tradeDoc.document],
        metadatas: [tradeDoc.metadata]
      });

      // Update portfolio in ChromaDB
      const portfolioDoc = DocumentMapper.portfolioToDocument(updatedPortfolio);
      await this.portfolioCollection.update({
        ids: [portfolio.id],
        documents: [portfolioDoc.document],
        metadatas: [portfolioDoc.metadata]
      });

      console.log(`✅ Trade executed: ${request.type} ${request.amount} BTC at $${bitcoinPrice.toFixed(2)}`);
      return validatedTrade;
    } catch (error) {
      console.error('❌ Error executing trade:', error);
      
      // Create failed trade record
      const failedTrade: Trade = {
        id: uuidv4(),
        userId: request.userId,
        portfolioId: 'unknown',
        type: request.type,
        amount: request.amount,
        price: request.price || 0,
        total: 0,
        fee: 0,
        timestamp: new Date(),
        status: 'failed',
        reason: error instanceof Error ? error.message : 'Unknown error'
      };

      // Store failed trade for audit purposes
      try {
        const tradeDoc = DocumentMapper.tradeToDocument(failedTrade);
        await this.tradesCollection.add({
          ids: [tradeDoc.id],
          documents: [tradeDoc.document],
          metadatas: [tradeDoc.metadata]
        });
      } catch (storeError) {
        console.error('Failed to store failed trade:', storeError);
      }

      throw error;
    }
  }

  /**
   * Get portfolio trades
   */
  async getPortfolioTrades(portfolioId: string, limit: number = 100): Promise<Trade[]> {
    await this.ensureInitialized();

    try {
      const results = await this.tradesCollection.query({
        queryTexts: [`portfolio trades ${portfolioId}`],
        nResults: limit,
        where: { portfolio_id: portfolioId },
        include: ['documents', 'metadatas']
      });

      if (!results.documents || !results.documents[0]) {
        return [];
      }

      const trades: Trade[] = [];
      for (const docString of results.documents[0]) {
        try {
          const trade = JSON.parse(docString) as Trade;
          trade.timestamp = new Date(trade.timestamp);
          trades.push(ValidationUtils.validateTrade(trade));
        } catch (parseError) {
          console.warn('Failed to parse trade:', parseError);
        }
      }

      // Sort by timestamp descending (most recent first)
      return trades.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('❌ Error getting portfolio trades:', error);
      return [];
    }
  }

  /**
   * Calculate portfolio performance metrics
   */
  async calculatePortfolioStats(userId: string): Promise<PortfolioStats | null> {
    await this.ensureInitialized();

    try {
      const portfolio = await this.getUserPortfolio(userId);
      if (!portfolio) {
        return null;
      }

      const trades = await this.getUserTrades(userId);
      
      // Calculate win rate
      const completedTrades = trades.filter(t => t.status === 'completed');
      const sellTrades = completedTrades.filter(t => t.type === 'sell');
      
      let winningTrades = 0;
      let bestTradeProfit = -Infinity;
      let worstTradeProfit = Infinity;
      let bestTrade: Trade | null = null;
      let worstTrade: Trade | null = null;

      // Analyze sell trades for profit/loss
      for (const sellTrade of sellTrades) {
        // Find the average buy price for this sell
        const previousBuys = completedTrades
          .filter(t => t.type === 'buy' && t.timestamp < sellTrade.timestamp)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        if (previousBuys.length > 0) {
          let remainingAmount = sellTrade.amount;
          let totalCost = 0;
          
          // Calculate weighted average buy price
          for (const buy of previousBuys) {
            if (remainingAmount <= 0) break;
            
            const amountFromThisBuy = Math.min(remainingAmount, buy.amount);
            totalCost += amountFromThisBuy * buy.price;
            remainingAmount -= amountFromThisBuy;
          }

          const avgBuyPrice = remainingAmount > 0 ? 
            totalCost / (sellTrade.amount - remainingAmount) : 
            totalCost / sellTrade.amount;
          
          const profit = (sellTrade.price - avgBuyPrice) * sellTrade.amount - sellTrade.fee;
          
          if (profit > 0) winningTrades++;
          
          if (profit > bestTradeProfit) {
            bestTradeProfit = profit;
            bestTrade = sellTrade;
          }
          
          if (profit < worstTradeProfit) {
            worstTradeProfit = profit;
            worstTrade = sellTrade;
          }
        }
      }

      const winRate = sellTrades.length > 0 ? 
        (winningTrades / sellTrades.length) * 100 : 0;

      return {
        totalValue: portfolio.totalValue,
        profit: portfolio.profit,
        profitPercentage: portfolio.profitPercentage,
        totalTrades: completedTrades.length,
        winRate,
        bestTrade,
        worstTrade
      };
    } catch (error) {
      console.error('❌ Error calculating portfolio stats:', error);
      return null;
    }
  }

  /**
   * Get user's trade history
   */
  async getUserTrades(userId: string, limit: number = 100): Promise<Trade[]> {
    await this.ensureInitialized();

    try {
      const results = await this.tradesCollection.query({
        queryTexts: [`user trades ${userId}`],
        nResults: limit,
        where: { user_id: userId },
        include: ['documents', 'metadatas']
      });

      if (!results.documents || !results.documents[0]) {
        return [];
      }

      const trades: Trade[] = [];
      for (const docString of results.documents[0]) {
        try {
          const trade = JSON.parse(docString) as Trade;
          trade.timestamp = new Date(trade.timestamp);
          trades.push(ValidationUtils.validateTrade(trade));
        } catch (parseError) {
          console.warn('Failed to parse trade:', parseError);
        }
      }

      return trades.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('❌ Error getting user trades:', error);
      return [];
    }
  }

  /**
   * Reset portfolio (for testing or new game)
   */
  async resetPortfolio(userId: string): Promise<Portfolio> {
    await this.ensureInitialized();

    try {
      const portfolio = await this.getUserPortfolio(userId);
      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      const initialBalance = parseFloat(process.env.INITIAL_BALANCE || '10000');
      
      // Reset portfolio values
      const resetPortfolio: Portfolio = {
        ...portfolio,
        balance: initialBalance,
        bitcoinHoldings: 0,
        totalValue: initialBalance,
        profit: 0,
        profitPercentage: 0,
        trades: [],
        updatedAt: new Date()
      };

      // Update in ChromaDB
      const portfolioDoc = DocumentMapper.portfolioToDocument(resetPortfolio);
      await this.portfolioCollection.update({
        ids: [portfolio.id],
        documents: [portfolioDoc.document],
        metadatas: [portfolioDoc.metadata]
      });

      console.log(`✅ Portfolio reset for user: ${userId}`);
      return resetPortfolio;
    } catch (error) {
      console.error('❌ Error resetting portfolio:', error);
      throw new Error(`Failed to reset portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get top performing portfolios (leaderboard)
   */
  async getTopPortfolios(limit: number = 10): Promise<Portfolio[]> {
    await this.ensureInitialized();

    try {
      const results = await this.portfolioCollection.query({
        queryTexts: ['top performing portfolios'],
        nResults: limit,
        include: ['documents', 'metadatas']
      });

      if (!results.documents || !results.documents[0]) {
        return [];
      }

      const portfolios: Portfolio[] = [];
      for (let i = 0; i < results.documents[0].length; i++) {
        try {
          const portfolio = JSON.parse(results.documents[0][i]) as Portfolio;
          portfolio.createdAt = new Date(portfolio.createdAt);
          portfolio.updatedAt = new Date(portfolio.updatedAt);
          portfolios.push(ValidationUtils.validatePortfolio(portfolio));
        } catch (parseError) {
          console.warn('Failed to parse portfolio:', parseError);
        }
      }

      // Sort by profit percentage descending
      return portfolios.sort((a, b) => b.profitPercentage - a.profitPercentage);
    } catch (error) {
      console.error('❌ Error getting top portfolios:', error);
      return [];
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.portfolioCollection || !this.tradesCollection) {
      await this.initialize();
    }
  }
}

// Export singleton instance
export const portfolioService = new PortfolioService();