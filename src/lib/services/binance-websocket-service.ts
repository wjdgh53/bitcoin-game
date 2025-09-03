#!/usr/bin/env tsx
// Binance US WebSocket Service for Real-time Bitcoin Data
import EventEmitter from 'events';
import WebSocket from 'ws';

// Types for Binance WebSocket data
interface BinanceTickerData {
  s: string;  // symbol
  p: string;  // price change
  P: string;  // price change percent
  c: string;  // close price (current price)
  h: string;  // high price
  l: string;  // low price
  v: string;  // volume
  q: string;  // quote volume
  o: string;  // open price
  C: number;  // close time
  F: number;  // first trade id
  L: number;  // last trade id
  n: number;  // trade count
}

interface BinanceKlineData {
  s: string;  // symbol
  k: {
    t: number;  // kline start time
    T: number;  // kline close time
    s: string;  // symbol
    i: string;  // interval
    f: number;  // first trade id
    L: number;  // last trade id
    o: string;  // open price
    c: string;  // close price
    h: string;  // high price
    l: string;  // low price
    v: string;  // base asset volume
    n: number;  // number of trades
    x: boolean; // is this kline closed?
    q: string;  // quote asset volume
    V: string;  // taker buy base asset volume
    Q: string;  // taker buy quote asset volume
  };
}

// Processed data types
interface TickerData {
  symbol: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  high24h: number;
  low24h: number;
  volume: number;
  quoteVolume: number;
  openPrice: number;
  timestamp: number;
}

interface KlineData {
  symbol: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  quoteVolume: number;
  timestamp: number;
  isComplete: boolean;
}

interface TechnicalIndicators {
  sma20: number | null;
  rsi14: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  bbUpper: number | null;
  bbMiddle: number | null;
  bbLower: number | null;
}

interface TradingSignals {
  signal: 'buy' | 'sell' | 'neutral';
  strength: number;
  reasons: string[];
}

interface CombinedData {
  ticker: TickerData;
  kline?: KlineData;
  indicators?: TechnicalIndicators;
  signals?: TradingSignals;
  timestamp: number;
}

interface ServiceStatus {
  connected: boolean;
  tickerConnected: boolean;
  klineConnected: boolean;
  lastTickerUpdate: number | null;
  lastKlineUpdate: number | null;
  reconnectAttempts: number;
  klineBufferSize: number;
  startTime: number;
  throttleStatus: {
    lastEmitTime: number;
    secondsUntilNextEmit: number;
    throttleIntervalMinutes: number;
  };
}

class BinanceWebSocketService extends EventEmitter {
  private tickerWs: WebSocket | null = null;
  private klineWs: WebSocket | null = null;
  private isRunning = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private klineBuffer: number[] = []; // Store closing prices for indicators
  private maxBufferSize = 50; // Keep last 50 candles for calculations
  private lastTickerUpdate: number | null = null;
  private lastKlineUpdate: number | null = null;
  private startTime = Date.now();

  // Throttling properties
  private readonly THROTTLE_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private lastEmitTime: number = 0;
  private latestTickerData: TickerData | null = null;
  private latestKlineData: KlineData | null = null;

  constructor() {
    super();
  }

  // Throttling helper method
  private shouldEmitData(): boolean {
    const now = Date.now();
    return (now - this.lastEmitTime) >= this.THROTTLE_INTERVAL;
  }

  private maybeEmitThrottledData(): void {
    if (this.shouldEmitData() && this.latestTickerData) {
      console.log('🔄 Emitting throttled data (5-minute interval)');
      
      // Update emit time first
      this.lastEmitTime = Date.now();
      
      // Emit individual events
      this.emit('ticker', this.latestTickerData);
      if (this.latestKlineData) {
        this.emit('kline', this.latestKlineData);
      }
      
      // Emit combined data with indicators
      this.emitCombinedData(this.latestTickerData, this.latestKlineData);
      
      console.log(`📊 Data emitted at ${new Date().toISOString()}, next emit in 5 minutes`);
    }
  }

  // Technical Indicators Calculation Functions
  private calculateSMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  private calculateRSI(prices: number[], period: number = 14): number | null {
    if (prices.length < period + 1) return null;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = prices[prices.length - i] - prices[prices.length - i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateEMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;
    
    const multiplier = 2 / (period + 1);
    let ema = prices[prices.length - period];
    
    for (let i = prices.length - period + 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }

  private calculateMACD(prices: number[]): { macd: number | null; signal: number | null; histogram: number | null } {
    if (prices.length < 26) {
      return { macd: null, signal: null, histogram: null };
    }
    
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    
    if (ema12 === null || ema26 === null) {
      return { macd: null, signal: null, histogram: null };
    }
    
    const macd = ema12 - ema26;
    
    // For simplicity, using EMA of MACD for signal line (would need more MACD values for proper calculation)
    const signal = macd; // Simplified
    const histogram = macd - signal;
    
    return { macd, signal, histogram };
  }

  private calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): { upper: number | null; middle: number | null; lower: number | null } {
    if (prices.length < period) {
      return { upper: null, middle: null, lower: null };
    }
    
    const middle = this.calculateSMA(prices, period);
    if (middle === null) {
      return { upper: null, middle: null, lower: null };
    }
    
    const recentPrices = prices.slice(-period);
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    return {
      upper: middle + (standardDeviation * stdDev),
      middle,
      lower: middle - (standardDeviation * stdDev)
    };
  }

  private calculateTechnicalIndicators(): TechnicalIndicators {
    const sma20 = this.calculateSMA(this.klineBuffer, 20);
    const rsi14 = this.calculateRSI(this.klineBuffer, 14);
    const macdData = this.calculateMACD(this.klineBuffer);
    const bollingerBands = this.calculateBollingerBands(this.klineBuffer, 20, 2);

    return {
      sma20,
      rsi14,
      macd: macdData.macd,
      macdSignal: macdData.signal,
      macdHistogram: macdData.histogram,
      bbUpper: bollingerBands.upper,
      bbMiddle: bollingerBands.middle,
      bbLower: bollingerBands.lower
    };
  }

  private generateTradingSignals(currentPrice: number, indicators: TechnicalIndicators): TradingSignals {
    let buySignals = 0;
    let sellSignals = 0;
    const reasons: string[] = [];
    
    // SMA Signal
    if (indicators.sma20 !== null) {
      if (currentPrice > indicators.sma20) {
        buySignals++;
        reasons.push('Price above SMA 20');
      } else {
        sellSignals++;
        reasons.push('Price below SMA 20');
      }
    }
    
    // RSI Signal
    if (indicators.rsi14 !== null) {
      if (indicators.rsi14 < 30) {
        buySignals++;
        reasons.push('RSI oversold');
      } else if (indicators.rsi14 > 70) {
        sellSignals++;
        reasons.push('RSI overbought');
      } else {
        reasons.push('RSI neutral');
      }
    }
    
    // MACD Signal
    if (indicators.macd !== null) {
      if (indicators.macd > 0) {
        buySignals++;
        reasons.push('MACD positive');
      } else {
        sellSignals++;
        reasons.push('MACD negative');
      }
    }
    
    // Bollinger Bands Signal
    if (indicators.bbUpper !== null && indicators.bbLower !== null) {
      if (currentPrice > indicators.bbUpper) {
        sellSignals++;
        reasons.push('Price above Bollinger upper band');
      } else if (currentPrice < indicators.bbLower) {
        buySignals++;
        reasons.push('Price below Bollinger lower band');
      }
    }
    
    let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
    let strength = 0;
    
    if (buySignals > sellSignals) {
      signal = 'buy';
      strength = Math.min(100, (buySignals / (buySignals + sellSignals)) * 100);
    } else if (sellSignals > buySignals) {
      signal = 'sell';
      strength = Math.min(100, (sellSignals / (buySignals + sellSignals)) * 100);
    } else {
      strength = 50;
    }
    
    return { signal, strength, reasons };
  }

  private setupTickerWebSocket(): void {
    const tickerUrl = 'wss://stream.binance.us:9443/ws/btcusdt@ticker';
    this.tickerWs = new WebSocket(tickerUrl);

    this.tickerWs.on('open', () => {
      console.log('🔗 Binance US Ticker WebSocket connected');
      this.emit('ticker_connected');
    });

    this.tickerWs.on('message', (data: WebSocket.Data) => {
      try {
        const rawData: BinanceTickerData = JSON.parse(data.toString());
        
        const tickerData: TickerData = {
          symbol: rawData.s,
          price: parseFloat(rawData.c),
          priceChange: parseFloat(rawData.p),
          priceChangePercent: parseFloat(rawData.P),
          high24h: parseFloat(rawData.h),
          low24h: parseFloat(rawData.l),
          volume: parseFloat(rawData.v),
          quoteVolume: parseFloat(rawData.q),
          openPrice: parseFloat(rawData.o),
          timestamp: rawData.C
        };

        // Update tracking variables
        this.lastTickerUpdate = Date.now();
        this.latestTickerData = tickerData;

        // Only emit if throttle interval has passed
        this.maybeEmitThrottledData();
      } catch (error) {
        console.error('Error processing ticker data:', error);
        this.emit('error', error);
      }
    });

    this.tickerWs.on('error', (error) => {
      console.error('Ticker WebSocket error:', error);
      this.emit('error', error);
    });

    this.tickerWs.on('close', () => {
      console.log('🔌 Ticker WebSocket closed');
      this.emit('ticker_disconnected');
      if (this.isRunning) {
        this.handleReconnect();
      }
    });
  }

  private setupKlineWebSocket(): void {
    const klineUrl = 'wss://stream.binance.us:9443/ws/btcusdt@kline_1m';
    this.klineWs = new WebSocket(klineUrl);

    this.klineWs.on('open', () => {
      console.log('🔗 Binance US Kline WebSocket connected');
      this.emit('kline_connected');
    });

    this.klineWs.on('message', (data: WebSocket.Data) => {
      try {
        const rawData: BinanceKlineData = JSON.parse(data.toString());
        
        const klineData: KlineData = {
          symbol: rawData.k.s,
          open: parseFloat(rawData.k.o),
          close: parseFloat(rawData.k.c),
          high: parseFloat(rawData.k.h),
          low: parseFloat(rawData.k.l),
          volume: parseFloat(rawData.k.v),
          quoteVolume: parseFloat(rawData.k.q),
          timestamp: rawData.k.T,
          isComplete: rawData.k.x
        };

        // Update tracking variables
        this.lastKlineUpdate = Date.now();
        this.latestKlineData = klineData;
        
        // Only update buffer with completed candles
        if (klineData.isComplete) {
          this.klineBuffer.push(klineData.close);
          
          // Maintain buffer size
          if (this.klineBuffer.length > this.maxBufferSize) {
            this.klineBuffer.shift();
          }
        }

        // Kline data doesn't need to trigger immediate emit check 
        // since ticker data is more frequent and will handle the throttling
      } catch (error) {
        console.error('Error processing kline data:', error);
        this.emit('error', error);
      }
    });

    this.klineWs.on('error', (error) => {
      console.error('Kline WebSocket error:', error);
      this.emit('error', error);
    });

    this.klineWs.on('close', () => {
      console.log('🔌 Kline WebSocket closed');
      this.emit('kline_disconnected');
      if (this.isRunning) {
        this.handleReconnect();
      }
    });
  }

  private emitCombinedData(tickerData: TickerData, klineData?: KlineData): void {
    // Calculate indicators if we have enough data
    const indicators = this.klineBuffer.length >= 20 ? this.calculateTechnicalIndicators() : undefined;
    const signals = indicators ? this.generateTradingSignals(tickerData.price, indicators) : undefined;

    const combinedData: CombinedData = {
      ticker: tickerData,
      kline: klineData,
      indicators,
      signals,
      timestamp: Date.now()
    };

    this.emit('data', combinedData);
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.emit('max_reconnects_reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
    console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.start();
    }, delay);
  }

  private setupHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      const now = Date.now();
      const tickerHealthy = this.lastTickerUpdate && (now - this.lastTickerUpdate) < 60000; // 1 minute
      const klineHealthy = this.lastKlineUpdate && (now - this.lastKlineUpdate) < 120000; // 2 minutes
      
      if (!tickerHealthy || !klineHealthy) {
        const status = this.getStatus();
        this.emit('health_check_failed', status);
        
        // Try to reconnect if health check fails
        if (this.isRunning) {
          console.log('⚠️ Health check failed, attempting reconnection...');
          this.restart();
        }
      }
    }, 30000); // Check every 30 seconds
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Service is already running');
      return;
    }

    console.log('🚀 Starting Binance US WebSocket Service...');
    this.isRunning = true;

    try {
      // Setup WebSocket connections
      this.setupTickerWebSocket();
      this.setupKlineWebSocket();
      
      // Setup health monitoring
      this.setupHealthCheck();
      
      // Reset reconnection attempts on successful start
      this.reconnectAttempts = 0;
      
      this.emit('connected');
      console.log('✅ Binance US WebSocket Service started successfully');
      
    } catch (error) {
      console.error('❌ Failed to start service:', error);
      this.isRunning = false;
      this.emit('error', error);
      throw error;
    }
  }

  public stop(): void {
    console.log('🛑 Stopping Binance US WebSocket Service...');
    this.isRunning = false;

    // Clear timeouts and intervals
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Close WebSocket connections
    if (this.tickerWs) {
      this.tickerWs.close();
      this.tickerWs = null;
    }
    
    if (this.klineWs) {
      this.klineWs.close();
      this.klineWs = null;
    }

    // Reset state
    this.reconnectAttempts = 0;
    this.lastTickerUpdate = null;
    this.lastKlineUpdate = null;
    
    // Reset throttling state
    this.lastEmitTime = 0;
    this.latestTickerData = null;
    this.latestKlineData = null;

    this.emit('disconnected');
    console.log('✅ Service stopped');
  }

  public async restart(): Promise<void> {
    this.stop();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await this.start();
  }

  public getStatus(): ServiceStatus {
    const throttleStatus = this.getThrottleStatus();
    
    return {
      connected: this.isRunning,
      tickerConnected: this.tickerWs?.readyState === WebSocket.OPEN,
      klineConnected: this.klineWs?.readyState === WebSocket.OPEN,
      lastTickerUpdate: this.lastTickerUpdate,
      lastKlineUpdate: this.lastKlineUpdate,
      reconnectAttempts: this.reconnectAttempts,
      klineBufferSize: this.klineBuffer.length,
      startTime: this.startTime,
      throttleStatus: {
        lastEmitTime: this.lastEmitTime,
        secondsUntilNextEmit: throttleStatus.secondsUntilNextEmit,
        throttleIntervalMinutes: this.THROTTLE_INTERVAL / (60 * 1000)
      }
    };
  }

  public getLatestData(): CombinedData | null {
    if (!this.latestTickerData) return null;

    const indicators = this.klineBuffer.length >= 20 ? this.calculateTechnicalIndicators() : undefined;
    const signals = indicators ? this.generateTradingSignals(this.latestTickerData.price, indicators) : undefined;

    return {
      ticker: this.latestTickerData,
      kline: this.latestKlineData || undefined,
      indicators,
      signals,
      timestamp: Date.now()
    };
  }

  public getThrottleStatus(): {
    nextEmitTime: number;
    secondsUntilNextEmit: number;
    lastEmitTime: number;
    throttleInterval: number;
  } {
    const nextEmitTime = this.lastEmitTime + this.THROTTLE_INTERVAL;
    const secondsUntilNextEmit = Math.max(0, Math.ceil((nextEmitTime - Date.now()) / 1000));
    
    return {
      nextEmitTime,
      secondsUntilNextEmit,
      lastEmitTime: this.lastEmitTime,
      throttleInterval: this.THROTTLE_INTERVAL
    };
  }

  // Force emit data immediately (useful for testing or first-time emit)
  public forceEmit(): boolean {
    if (this.latestTickerData) {
      console.log('🔄 Force emitting current data');
      
      this.lastEmitTime = Date.now();
      
      this.emit('ticker', this.latestTickerData);
      if (this.latestKlineData) {
        this.emit('kline', this.latestKlineData);
      }
      
      this.emitCombinedData(this.latestTickerData, this.latestKlineData);
      
      console.log(`📊 Force emit completed at ${new Date().toISOString()}`);
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const binanceWebSocketService = new BinanceWebSocketService();
export type { TickerData, KlineData, TechnicalIndicators, TradingSignals, CombinedData, ServiceStatus };