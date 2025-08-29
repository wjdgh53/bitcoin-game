// Binance WebSocket Service for real-time BTC/USDT data collection

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { 
  BinanceKlineBuffer, 
  BinanceTechnicalIndicators,
  parseBinanceKline,
  parseBinanceTicker,
  analyzeBinanceSignals,
  type BinancePriceData,
  type BinanceTickerData
} from '@/lib/utils/binance-indicators';

export interface BinanceRealtimeData {
  ticker: BinanceTickerData;
  indicators: BinanceTechnicalIndicators | null;
  signals: {
    signal: 'BUY' | 'SELL' | 'NEUTRAL';
    strength: number;
    reasons: string[];
  } | null;
  timestamp: number;
}

export class BinanceWebSocketService extends EventEmitter {
  private tickerWs: WebSocket | null = null;
  private klineWs: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  
  private klineBuffer = new BinanceKlineBuffer(200); // Keep 200 candles for indicators
  private lastTicker: BinanceTickerData | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000; // 5 seconds
  
  // Binance US WebSocket URLs - better for US/international access
  private readonly BINANCE_WS_ENDPOINTS = [
    'wss://stream.binance.us:9443/ws/', // Binance US primary endpoint
    'wss://stream.binance.com:443/ws/', // Global fallback
    'wss://testnet.binance.vision/ws/', // Testnet endpoint for development
  ];
  private currentEndpointIndex = 0;
  private readonly TICKER_STREAM = 'btcusdt@ticker';
  private readonly KLINE_STREAM = 'btcusdt@kline_1m';
  
  // Demo mode flag for when real connections fail
  private demoMode = false;
  private demoInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    super();
    this.setMaxListeners(20); // Increase listener limit for multiple subscribers
  }

  /**
   * Start the WebSocket connections
   */
  async start(): Promise<void> {
    console.log('🚀 Starting Binance WebSocket service...');
    
    try {
      await this.connectWithFallback();
      this.startHealthCheck();
      
      console.log('✅ Binance WebSocket service started successfully');
      this.emit('connected');
      
    } catch (error) {
      console.error('❌ All Binance endpoints failed, starting demo mode...');
      await this.startDemoMode();
      this.emit('connected');
    }
  }

  /**
   * Try connecting to Binance with fallback endpoints
   */
  private async connectWithFallback(): Promise<void> {
    let lastError: Error | null = null;

    for (let i = 0; i < this.BINANCE_WS_ENDPOINTS.length; i++) {
      this.currentEndpointIndex = i;
      const endpoint = this.BINANCE_WS_ENDPOINTS[i];
      
      try {
        console.log(`🔗 Trying endpoint ${i + 1}/${this.BINANCE_WS_ENDPOINTS.length}: ${endpoint}`);
        await this.connectTickerStream();
        await this.connectKlineStream();
        return; // Success!
      } catch (error) {
        lastError = error as Error;
        console.log(`❌ Endpoint ${i + 1} failed: ${lastError.message}`);
        
        // Clean up failed connections
        if (this.tickerWs) {
          this.tickerWs.close();
          this.tickerWs = null;
        }
        if (this.klineWs) {
          this.klineWs.close();
          this.klineWs = null;
        }
      }
    }

    throw lastError || new Error('All endpoints failed');
  }

  /**
   * Stop all WebSocket connections
   */
  stop(): void {
    console.log('🛑 Stopping Binance WebSocket service...');
    
    this.isConnected = false;
    this.demoMode = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    
    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      this.demoInterval = null;
    }
    
    if (this.tickerWs) {
      this.tickerWs.close();
      this.tickerWs = null;
    }
    
    if (this.klineWs) {
      this.klineWs.close();
      this.klineWs = null;
    }
    
    this.klineBuffer.clear();
    this.lastTicker = null;
    this.reconnectAttempts = 0;
    
    console.log('✅ Binance WebSocket service stopped');
    this.emit('disconnected');
  }

  /**
   * Connect to Binance ticker stream (24hr ticker statistics)
   */
  private async connectTickerStream(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const baseUrl = this.BINANCE_WS_ENDPOINTS[this.currentEndpointIndex];
        const url = `${baseUrl}${this.TICKER_STREAM}`;
        console.log(`📡 Connecting to ticker stream: ${url}`);
        
        this.tickerWs = new WebSocket(url);
        
        this.tickerWs.on('open', () => {
          console.log('✅ Ticker WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        });
        
        this.tickerWs.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleTickerMessage(message);
          } catch (error) {
            console.error('❌ Error parsing ticker message:', error);
          }
        });
        
        this.tickerWs.on('error', (error) => {
          console.error('❌ Ticker WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        });
        
        this.tickerWs.on('close', (code, reason) => {
          console.log(`🔌 Ticker WebSocket closed: ${code} ${reason}`);
          this.handleTickerDisconnect();
        });
        
        // Set connection timeout
        setTimeout(() => {
          if (this.tickerWs?.readyState !== WebSocket.OPEN) {
            reject(new Error('Ticker WebSocket connection timeout'));
          }
        }, 10000);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Connect to Binance kline stream (1-minute candlestick data)
   */
  private async connectKlineStream(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const baseUrl = this.BINANCE_WS_ENDPOINTS[this.currentEndpointIndex];
        const url = `${baseUrl}${this.KLINE_STREAM}`;
        console.log(`📡 Connecting to kline stream: ${url}`);
        
        this.klineWs = new WebSocket(url);
        
        this.klineWs.on('open', () => {
          console.log('✅ Kline WebSocket connected');
          this.reconnectAttempts = 0;
          this.isConnected = true;
          resolve();
        });
        
        this.klineWs.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleKlineMessage(message);
          } catch (error) {
            console.error('❌ Error parsing kline message:', error);
          }
        });
        
        this.klineWs.on('error', (error) => {
          console.error('❌ Kline WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        });
        
        this.klineWs.on('close', (code, reason) => {
          console.log(`🔌 Kline WebSocket closed: ${code} ${reason}`);
          this.handleKlineDisconnect();
        });
        
        // Set connection timeout
        setTimeout(() => {
          if (this.klineWs?.readyState !== WebSocket.OPEN) {
            reject(new Error('Kline WebSocket connection timeout'));
          }
        }, 10000);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle ticker stream messages
   */
  private handleTickerMessage(message: any): void {
    try {
      const ticker = parseBinanceTicker(message);
      this.lastTicker = ticker;
      
      // Emit ticker update
      this.emit('ticker', ticker);
      
      // If we have kline data, emit combined real-time data
      this.emitRealtimeData();
      
    } catch (error) {
      console.error('❌ Error handling ticker message:', error);
    }
  }

  /**
   * Handle kline stream messages
   */
  private handleKlineMessage(message: any): void {
    try {
      const klineData = message.k;
      
      // Only process closed candles for consistent indicators
      if (klineData.x) { // x indicates if this kline is closed
        const kline = parseBinanceKline(klineData);
        this.klineBuffer.addKline(kline);
        
        // Emit kline update
        this.emit('kline', kline);
        
        // Emit combined real-time data with updated indicators
        this.emitRealtimeData();
      }
      
    } catch (error) {
      console.error('❌ Error handling kline message:', error);
    }
  }

  /**
   * Emit combined real-time data with indicators and signals
   */
  private emitRealtimeData(): void {
    if (!this.lastTicker) return;
    
    const indicators = this.klineBuffer.calculateIndicators();
    const signals = indicators ? analyzeBinanceSignals(indicators) : null;
    
    const realtimeData: BinanceRealtimeData = {
      ticker: this.lastTicker,
      indicators,
      signals,
      timestamp: Date.now(),
    };
    
    this.emit('data', realtimeData);
    
    // Log periodic updates (every 30 seconds)
    if (Date.now() % 30000 < 1000) {
      console.log(`📊 BTC/USDT: $${this.lastTicker.price.toFixed(2)} (${this.lastTicker.priceChangePercent.toFixed(2)}%)`);
      if (signals) {
        console.log(`🎯 Signal: ${signals.signal} (${signals.strength.toFixed(0)}%)`);
      }
    }
  }

  /**
   * Handle ticker WebSocket disconnect
   */
  private handleTickerDisconnect(): void {
    if (this.isConnected && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleTickerReconnect();
    }
  }

  /**
   * Handle kline WebSocket disconnect
   */
  private handleKlineDisconnect(): void {
    this.isConnected = false;
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleKlineReconnect();
    }
  }

  /**
   * Schedule ticker WebSocket reconnection
   */
  private scheduleTickerReconnect(): void {
    if (this.reconnectTimer) return;
    
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 60000); // Max 1 minute
    
    console.log(`🔄 Scheduling ticker reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.connectTickerStream();
      } catch (error) {
        console.error('❌ Ticker reconnection failed:', error);
        this.scheduleTickerReconnect();
      }
    }, delay);
  }

  /**
   * Schedule kline WebSocket reconnection
   */
  private scheduleKlineReconnect(): void {
    if (this.reconnectTimer) return;
    
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 60000); // Max 1 minute
    
    console.log(`🔄 Scheduling kline reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.connectKlineStream();
        this.isConnected = true;
      } catch (error) {
        console.error('❌ Kline reconnection failed:', error);
        this.scheduleKlineReconnect();
      }
    }, delay);
  }

  /**
   * Start health check to monitor connection status
   */
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      const tickerHealthy = this.tickerWs?.readyState === WebSocket.OPEN;
      const klineHealthy = this.klineWs?.readyState === WebSocket.OPEN;
      
      if (!tickerHealthy || !klineHealthy) {
        console.log(`⚠️ Connection health check failed - Ticker: ${tickerHealthy}, Kline: ${klineHealthy}`);
        this.emit('health_check_failed', { tickerHealthy, klineHealthy });
        
        // Attempt to reconnect unhealthy connections
        if (!tickerHealthy && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleTickerReconnect();
        }
        if (!klineHealthy && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleKlineReconnect();
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get current connection status
   */
  getStatus(): {
    connected: boolean;
    demoMode: boolean;
    tickerConnected: boolean;
    klineConnected: boolean;
    klineBufferSize: number;
    reconnectAttempts: number;
    lastTicker: BinanceTickerData | null;
    currentEndpoint: string | null;
  } {
    return {
      connected: this.isConnected,
      demoMode: this.demoMode,
      tickerConnected: this.tickerWs?.readyState === WebSocket.OPEN || false,
      klineConnected: this.klineWs?.readyState === WebSocket.OPEN || false,
      klineBufferSize: this.klineBuffer.size(),
      reconnectAttempts: this.reconnectAttempts,
      lastTicker: this.lastTicker,
      currentEndpoint: this.demoMode ? 'DEMO_MODE' : this.BINANCE_WS_ENDPOINTS[this.currentEndpointIndex] || null,
    };
  }

  /**
   * Get latest indicators (if available)
   */
  getLatestIndicators(): BinanceTechnicalIndicators | null {
    return this.klineBuffer.calculateIndicators();
  }

  /**
   * Get latest signals (if available)
   */
  getLatestSignals(): { signal: 'BUY' | 'SELL' | 'NEUTRAL'; strength: number; reasons: string[] } | null {
    const indicators = this.getLatestIndicators();
    return indicators ? analyzeBinanceSignals(indicators) : null;
  }

  /**
   * Start demo mode with simulated data
   */
  private async startDemoMode(): Promise<void> {
    console.log('🎭 Starting demo mode with simulated BTC/USDT data...');
    this.demoMode = true;
    this.isConnected = true;

    // Base price for simulation
    let basePrice = 95000 + Math.random() * 10000; // Random price between $95k-105k
    let trend = Math.random() > 0.5 ? 1 : -1; // Random initial trend
    let klineStartTime = Date.now();
    
    // Generate initial kline history for indicators
    const historicalKlines: BinancePriceData[] = [];
    const startTime = Date.now() - 200 * 60 * 1000; // 200 minutes ago
    
    for (let i = 0; i < 200; i++) {
      const timestamp = startTime + i * 60 * 1000;
      const open = basePrice * (0.98 + Math.random() * 0.04);
      const volatility = 0.005 + Math.random() * 0.01; // 0.5-1.5% volatility
      const high = open * (1 + Math.random() * volatility);
      const low = open * (1 - Math.random() * volatility);
      const close = low + Math.random() * (high - low);
      const volume = 100 + Math.random() * 500;
      
      historicalKlines.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume,
      });
      
      basePrice = close; // Next candle starts where this one ended
    }
    
    // Add historical data to buffer
    historicalKlines.forEach(kline => this.klineBuffer.addKline(kline));

    // Generate ticker data every 5 seconds
    const tickerInterval = setInterval(() => {
      if (!this.demoMode) {
        clearInterval(tickerInterval);
        return;
      }

      // Simulate price movement
      const volatility = 0.002 + Math.random() * 0.005; // 0.2-0.7% volatility
      const change = (Math.random() - 0.5) * volatility * trend;
      basePrice *= (1 + change);
      
      // Occasionally change trend
      if (Math.random() < 0.1) {
        trend *= -1;
      }

      // Calculate 24h statistics
      const high24h = basePrice * (1 + Math.random() * 0.05);
      const low24h = basePrice * (1 - Math.random() * 0.05);
      const priceChangePercent = (Math.random() - 0.5) * 8; // ±4% change
      const volume = 30000 + Math.random() * 20000; // 30K-50K BTC volume

      const ticker: BinanceTickerData = {
        symbol: 'BTCUSDT',
        price: basePrice,
        priceChange: (basePrice * priceChangePercent) / 100,
        priceChangePercent,
        high24h,
        low24h,
        volume,
        timestamp: Date.now(),
      };

      this.lastTicker = ticker;
      this.emit('ticker', ticker);
    }, 5000);

    // Generate kline data every minute
    const klineInterval = setInterval(() => {
      if (!this.demoMode) {
        clearInterval(klineInterval);
        return;
      }

      const now = Date.now();
      const timestamp = Math.floor(now / 60000) * 60000; // Round to minute

      if (timestamp <= klineStartTime) return; // Avoid duplicate timestamps

      const open = basePrice;
      const volatility = 0.003 + Math.random() * 0.007; // 0.3-1% volatility
      const high = open * (1 + Math.random() * volatility);
      const low = open * (1 - Math.random() * volatility);
      const close = low + Math.random() * (high - low);
      const volume = 50 + Math.random() * 200;

      const kline: BinancePriceData = {
        timestamp,
        open,
        high,
        low,
        close,
        volume,
      };

      basePrice = close;
      klineStartTime = timestamp;

      this.klineBuffer.addKline(kline);
      this.emit('kline', kline);
    }, 60000); // Every minute

    // Start emitting combined data
    const dataInterval = setInterval(() => {
      if (!this.demoMode) {
        clearInterval(dataInterval);
        return;
      }
      
      this.emitRealtimeData();
    }, 2000); // Every 2 seconds

    // Store intervals for cleanup
    this.demoInterval = tickerInterval;

    console.log('✅ Demo mode started with simulated BTC/USDT data');
  }

  /**
   * Force reconnection of all streams
   */
  async reconnect(): Promise<void> {
    console.log('🔄 Force reconnecting Binance WebSocket streams...');
    this.stop();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    await this.start();
  }

  /**
   * Check if running in demo mode
   */
  isDemoMode(): boolean {
    return this.demoMode;
  }
}

// Export singleton instance
export const binanceWebSocketService = new BinanceWebSocketService();