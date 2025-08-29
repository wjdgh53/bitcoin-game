// Binance WebSocket Service Usage Example
// This file demonstrates how to integrate the Binance WebSocket service into your application

import { binanceWebSocketService, type BinanceRealtimeData } from './binance-websocket-service';
import type { BinanceTickerData, BinancePriceData } from '@/lib/utils/binance-indicators';

export class BinanceDataManager {
  private latestData: BinanceRealtimeData | null = null;
  private isInitialized = false;

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Initialize the Binance WebSocket service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await binanceWebSocketService.start();
      this.isInitialized = true;
      console.log('✅ Binance data manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Binance data manager:', error);
      throw error;
    }
  }

  /**
   * Stop the service and clean up
   */
  stop(): void {
    if (!this.isInitialized) return;

    binanceWebSocketService.stop();
    this.isInitialized = false;
    this.latestData = null;
    console.log('🛑 Binance data manager stopped');
  }

  /**
   * Set up event listeners for the WebSocket service
   */
  private setupEventListeners(): void {
    // Listen for real-time data updates (ticker + indicators + signals)
    binanceWebSocketService.on('data', (data: BinanceRealtimeData) => {
      this.latestData = data;
      this.onDataUpdate(data);
    });

    // Listen for ticker updates only
    binanceWebSocketService.on('ticker', (ticker: BinanceTickerData) => {
      this.onTickerUpdate(ticker);
    });

    // Listen for new kline/candlestick data
    binanceWebSocketService.on('kline', (kline: BinancePriceData) => {
      this.onKlineUpdate(kline);
    });

    // Listen for connection events
    binanceWebSocketService.on('connected', () => {
      console.log('🔗 Connected to Binance data stream');
    });

    binanceWebSocketService.on('disconnected', () => {
      console.log('🔌 Disconnected from Binance data stream');
    });

    binanceWebSocketService.on('error', (error) => {
      console.error('❌ Binance WebSocket error:', error);
    });
  }

  /**
   * Handle real-time data updates (override this method)
   */
  protected onDataUpdate(data: BinanceRealtimeData): void {
    console.log(`📊 BTC/USDT: $${data.ticker.price.toFixed(2)} (${data.ticker.priceChangePercent.toFixed(2)}%)`);
    
    if (data.signals) {
      console.log(`🎯 Trading Signal: ${data.signals.signal} (${data.signals.strength.toFixed(0)}%)`);
    }
  }

  /**
   * Handle ticker updates (override this method)
   */
  protected onTickerUpdate(ticker: BinanceTickerData): void {
    // Override this method to handle ticker updates
    // console.log('Ticker update received:', ticker);
  }

  /**
   * Handle kline/candlestick updates (override this method)
   */
  protected onKlineUpdate(kline: BinancePriceData): void {
    // Override this method to handle kline updates
    // console.log('Kline update received:', kline);
  }

  /**
   * Get the latest real-time data
   */
  getLatestData(): BinanceRealtimeData | null {
    return this.latestData;
  }

  /**
   * Get current price
   */
  getCurrentPrice(): number | null {
    return this.latestData?.ticker.price || null;
  }

  /**
   * Get current trading signal
   */
  getCurrentSignal(): { signal: 'BUY' | 'SELL' | 'NEUTRAL'; strength: number } | null {
    if (!this.latestData?.signals) return null;
    
    return {
      signal: this.latestData.signals.signal,
      strength: this.latestData.signals.strength,
    };
  }

  /**
   * Get service status
   */
  getStatus() {
    return binanceWebSocketService.getStatus();
  }

  /**
   * Check if running in demo mode
   */
  isDemoMode(): boolean {
    return binanceWebSocketService.isDemoMode();
  }
}

/**
 * Trading Strategy Example
 * Shows how to implement a simple trading strategy using the Binance data
 */
export class SimpleTradingStrategy extends BinanceDataManager {
  private balance = 10000; // Starting balance in USDT
  private btcHoldings = 0;
  private lastSignal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  private trades: Array<{ type: 'BUY' | 'SELL'; price: number; amount: number; timestamp: Date }> = [];

  protected onDataUpdate(data: BinanceRealtimeData): void {
    super.onDataUpdate(data);

    if (!data.signals || !data.indicators) return;

    const { signal, strength } = data.signals;
    const price = data.ticker.price;

    // Only execute trades if signal strength is above 70%
    if (strength < 70) return;

    // Avoid duplicate signals
    if (signal === this.lastSignal) return;

    this.executeSignal(signal, price, strength);
    this.lastSignal = signal;
  }

  private executeSignal(signal: 'BUY' | 'SELL' | 'NEUTRAL', price: number, strength: number): void {
    const tradeAmount = this.calculateTradeAmount(signal, price, strength);

    if (signal === 'BUY' && this.balance > tradeAmount * price) {
      // Buy BTC
      const btcAmount = tradeAmount;
      const cost = btcAmount * price;
      
      this.balance -= cost;
      this.btcHoldings += btcAmount;
      
      this.trades.push({
        type: 'BUY',
        price,
        amount: btcAmount,
        timestamp: new Date(),
      });

      console.log(`🟢 BUY: ${btcAmount.toFixed(6)} BTC at $${price.toFixed(2)} (${strength.toFixed(0)}% confidence)`);
      console.log(`💰 Balance: $${this.balance.toFixed(2)} USDT, ${this.btcHoldings.toFixed(6)} BTC`);

    } else if (signal === 'SELL' && this.btcHoldings > tradeAmount) {
      // Sell BTC
      const btcAmount = Math.min(tradeAmount, this.btcHoldings);
      const proceeds = btcAmount * price;
      
      this.balance += proceeds;
      this.btcHoldings -= btcAmount;
      
      this.trades.push({
        type: 'SELL',
        price,
        amount: btcAmount,
        timestamp: new Date(),
      });

      console.log(`🔴 SELL: ${btcAmount.toFixed(6)} BTC at $${price.toFixed(2)} (${strength.toFixed(0)}% confidence)`);
      console.log(`💰 Balance: $${this.balance.toFixed(2)} USDT, ${this.btcHoldings.toFixed(6)} BTC`);
    }

    // Show portfolio value
    const portfolioValue = this.balance + (this.btcHoldings * price);
    const profit = portfolioValue - 10000;
    console.log(`📊 Portfolio Value: $${portfolioValue.toFixed(2)} (${profit >= 0 ? '+' : ''}${profit.toFixed(2)})\n`);
  }

  private calculateTradeAmount(signal: 'BUY' | 'SELL' | 'NEUTRAL', price: number, strength: number): number {
    // Simple strategy: trade 10% of available balance/holdings, scaled by signal strength
    const basePercentage = 0.1;
    const strengthMultiplier = strength / 100;
    const percentage = basePercentage * strengthMultiplier;

    if (signal === 'BUY') {
      const maxCost = this.balance * percentage;
      return maxCost / price; // Return BTC amount
    } else if (signal === 'SELL') {
      return this.btcHoldings * percentage; // Return BTC amount
    }

    return 0;
  }

  getPortfolioSummary() {
    const currentPrice = this.getCurrentPrice() || 0;
    const portfolioValue = this.balance + (this.btcHoldings * currentPrice);
    const profit = portfolioValue - 10000;

    return {
      balance: this.balance,
      btcHoldings: this.btcHoldings,
      portfolioValue,
      profit,
      profitPercentage: (profit / 10000) * 100,
      tradeCount: this.trades.length,
      trades: this.trades,
    };
  }
}

/**
 * Usage Examples:
 */

// Example 1: Basic usage
export async function basicUsageExample() {
  const dataManager = new BinanceDataManager();
  
  await dataManager.initialize();
  
  // Get current data
  setTimeout(() => {
    const data = dataManager.getLatestData();
    const price = dataManager.getCurrentPrice();
    const signal = dataManager.getCurrentSignal();
    
    console.log('Current data:', { price, signal });
    
    dataManager.stop();
  }, 10000);
}

// Example 2: Trading strategy
export async function tradingStrategyExample() {
  const strategy = new SimpleTradingStrategy();
  
  await strategy.initialize();
  
  // Let it run for 2 minutes
  setTimeout(() => {
    const summary = strategy.getPortfolioSummary();
    console.log('Trading Summary:', summary);
    
    strategy.stop();
  }, 120000);
}