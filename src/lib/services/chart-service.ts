// Chart service with ChromaDB integration and technical indicators

import { BitcoinData, TechnicalIndicators, MarketAnalysis } from '@/types/game';
import { bitcoinStorage } from './bitcoin-storage';
import { ChromaClient } from 'chromadb';
import { COLLECTION_NAMES } from '@/lib/database/schemas';

export interface ChartDataPoint {
  x: number; // timestamp
  y: number; // price
  o?: number; // open (for candlestick)
  h?: number; // high
  l?: number; // low  
  c?: number; // close
  v?: number; // volume
}

export interface ChartConfig {
  type: 'line' | 'candlestick' | 'area';
  timeRange: '1h' | '4h' | '1d' | '1w' | '1m';
  indicators: {
    sma?: { periods: number[]; enabled: boolean };
    ema?: { periods: number[]; enabled: boolean };
    rsi?: { period: number; enabled: boolean };
    macd?: { enabled: boolean };
    bollinger?: { period: number; multiplier: number; enabled: boolean };
    volume?: { enabled: boolean };
  };
  theme: 'light' | 'dark';
  colors: {
    up: string;
    down: string;
    volume: string;
    grid: string;
    text: string;
  };
}

export interface ProcessedChartData {
  prices: ChartDataPoint[];
  volume: ChartDataPoint[];
  indicators: {
    sma?: { [period: number]: ChartDataPoint[] };
    ema?: { [period: number]: ChartDataPoint[] };
    rsi?: ChartDataPoint[];
    macd?: {
      macd: ChartDataPoint[];
      signal: ChartDataPoint[];
      histogram: ChartDataPoint[];
    };
    bollinger?: {
      upper: ChartDataPoint[];
      middle: ChartDataPoint[];
      lower: ChartDataPoint[];
    };
  };
}

export class ChartService {
  private chroma: ChromaClient;
  private analysisCollection: any = null;

  constructor() {
    this.chroma = new ChromaClient({
      path: process.env.CHROMADB_PATH || './chroma_data'
    });
  }

  /**
   * Initialize chart service
   */
  async initialize(): Promise<void> {
    try {
      await bitcoinStorage.initialize();
      
      this.analysisCollection = await this.chroma.getCollection({
        name: COLLECTION_NAMES.MARKET_ANALYSIS
      });

      console.log('✅ Chart service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize chart service:', error);
      throw new Error(`Chart service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get chart data for specified time range
   */
  async getChartData(timeRange: string, limit: number = 288): Promise<BitcoinData[]> {
    await this.ensureInitialized();

    try {
      const endTime = new Date();
      const startTime = this.getStartTimeForRange(timeRange, endTime);

      const data = await bitcoinStorage.queryBitcoinDataByTimeRange(startTime, endTime, limit);
      
      if (data.length === 0) {
        console.warn('No chart data found, returning empty array');
        return [];
      }

      return data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      console.error('❌ Error getting chart data:', error);
      return [];
    }
  }

  /**
   * Process raw Bitcoin data into chart-ready format with indicators
   */
  async processChartData(data: BitcoinData[], config: ChartConfig): Promise<ProcessedChartData> {
    try {
      if (data.length === 0) {
        return { prices: [], volume: [], indicators: {} };
      }

      // Convert to chart data points
      const prices: ChartDataPoint[] = data.map(d => ({
        x: d.timestamp.getTime(),
        y: d.price,
        o: d.price, // Simplified - in production you'd track actual OHLC
        h: d.high24h,
        l: d.low24h,
        c: d.price,
        v: d.volume
      }));

      const volume: ChartDataPoint[] = data.map(d => ({
        x: d.timestamp.getTime(),
        y: d.volume
      }));

      // Calculate technical indicators
      const indicators: ProcessedChartData['indicators'] = {};

      // Simple Moving Average
      if (config.indicators.sma?.enabled && config.indicators.sma.periods) {
        indicators.sma = {};
        for (const period of config.indicators.sma.periods) {
          indicators.sma[period] = this.calculateSMA(prices, period);
        }
      }

      // Exponential Moving Average
      if (config.indicators.ema?.enabled && config.indicators.ema.periods) {
        indicators.ema = {};
        for (const period of config.indicators.ema.periods) {
          indicators.ema[period] = this.calculateEMA(prices, period);
        }
      }

      // RSI
      if (config.indicators.rsi?.enabled) {
        indicators.rsi = this.calculateRSI(prices, config.indicators.rsi.period || 14);
      }

      // MACD
      if (config.indicators.macd?.enabled) {
        indicators.macd = this.calculateMACD(prices);
      }

      // Bollinger Bands
      if (config.indicators.bollinger?.enabled) {
        indicators.bollinger = this.calculateBollingerBands(
          prices, 
          config.indicators.bollinger.period || 20,
          config.indicators.bollinger.multiplier || 2
        );
      }

      return {
        prices,
        volume,
        indicators
      };
    } catch (error) {
      console.error('❌ Error processing chart data:', error);
      return { prices: [], volume: [], indicators: {} };
    }
  }

  /**
   * Get default chart configuration
   */
  getDefaultConfig(theme: 'light' | 'dark' = 'light'): ChartConfig {
    return {
      type: 'candlestick',
      timeRange: '1d',
      indicators: {
        sma: { periods: [20, 50], enabled: false },
        ema: { periods: [12, 26], enabled: false },
        rsi: { period: 14, enabled: false },
        macd: { enabled: false },
        bollinger: { period: 20, multiplier: 2, enabled: false },
        volume: { enabled: true }
      },
      theme,
      colors: theme === 'dark' ? {
        up: '#00D4AA',
        down: '#FF4747',
        volume: '#8B9DC3',
        grid: '#2A3441',
        text: '#F8F9FA'
      } : {
        up: '#26A69A',
        down: '#EF5350',
        volume: '#64B5F6',
        grid: '#E0E0E0',
        text: '#212121'
      }
    };
  }

  /**
   * Create Chart.js configuration object
   */
  createChartJSConfig(processedData: ProcessedChartData, config: ChartConfig) {
    const { prices, volume, indicators } = processedData;

    // Base datasets
    const datasets: any[] = [];

    // Main price dataset
    if (config.type === 'candlestick') {
      datasets.push({
        label: 'BTC/USD',
        data: prices,
        type: 'candlestick',
        color: {
          up: config.colors.up,
          down: config.colors.down,
          unchanged: config.colors.up
        }
      });
    } else if (config.type === 'line') {
      datasets.push({
        label: 'BTC/USD',
        data: prices.map(p => ({ x: p.x, y: p.y })),
        borderColor: config.colors.up,
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.1
      });
    } else if (config.type === 'area') {
      datasets.push({
        label: 'BTC/USD',
        data: prices.map(p => ({ x: p.x, y: p.y })),
        borderColor: config.colors.up,
        backgroundColor: config.colors.up + '20',
        fill: true,
        tension: 0.1
      });
    }

    // Volume dataset
    if (config.indicators.volume?.enabled) {
      datasets.push({
        label: 'Volume',
        data: volume,
        type: 'bar',
        backgroundColor: config.colors.volume + '60',
        yAxisID: 'volume'
      });
    }

    // SMA indicators
    if (indicators.sma) {
      Object.entries(indicators.sma).forEach(([period, data]) => {
        datasets.push({
          label: `SMA ${period}`,
          data,
          borderColor: this.getIndicatorColor(parseInt(period)),
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.1,
          pointRadius: 0
        });
      });
    }

    // EMA indicators  
    if (indicators.ema) {
      Object.entries(indicators.ema).forEach(([period, data]) => {
        datasets.push({
          label: `EMA ${period}`,
          data,
          borderColor: this.getIndicatorColor(parseInt(period) + 100),
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          borderDash: [5, 5]
        });
      });
    }

    // Bollinger Bands
    if (indicators.bollinger) {
      datasets.push(
        {
          label: 'BB Upper',
          data: indicators.bollinger.upper,
          borderColor: '#9C27B0',
          backgroundColor: 'transparent',
          fill: false,
          pointRadius: 0
        },
        {
          label: 'BB Middle',
          data: indicators.bollinger.middle,
          borderColor: '#9C27B0',
          backgroundColor: 'transparent',
          fill: false,
          pointRadius: 0
        },
        {
          label: 'BB Lower',
          data: indicators.bollinger.lower,
          borderColor: '#9C27B0',
          backgroundColor: '#9C27B040',
          fill: '+1',
          pointRadius: 0
        }
      );
    }

    const chartConfig = {
      type: 'line' as const,
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index' as const,
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            labels: {
              color: config.colors.text,
              filter: (item: any) => item.text !== 'BTC/USD' || config.type !== 'candlestick'
            }
          },
          tooltip: {
            callbacks: {
              title: (context: any) => {
                return new Date(context[0].parsed.x).toLocaleString();
              },
              label: (context: any) => {
                if (context.dataset.label === 'Volume') {
                  return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
                }
                return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: this.getTimeUnit(config.timeRange)
            },
            grid: {
              color: config.colors.grid
            },
            ticks: {
              color: config.colors.text
            }
          },
          y: {
            type: 'linear',
            position: 'right',
            grid: {
              color: config.colors.grid
            },
            ticks: {
              color: config.colors.text,
              callback: (value: any) => `$${value.toFixed(0)}`
            }
          },
          volume: {
            type: 'linear',
            position: 'right',
            max: Math.max(...volume.map(v => v.y)) * 4,
            display: config.indicators.volume?.enabled,
            grid: {
              display: false
            },
            ticks: {
              display: false
            }
          }
        }
      }
    };

    // Add RSI subchart if enabled
    if (indicators.rsi) {
      // This would typically be rendered in a separate chart below the main chart
      // For now, we'll note that RSI data is available in indicators.rsi
    }

    return chartConfig;
  }

  /**
   * Get real-time chart updates
   */
  async getLatestDataPoint(): Promise<BitcoinData | null> {
    await this.ensureInitialized();

    try {
      const latest = await bitcoinStorage.queryLatestBitcoinData(1);
      return latest.length > 0 ? latest[0] : null;
    } catch (error) {
      console.error('❌ Error getting latest data point:', error);
      return null;
    }
  }

  /**
   * Store market analysis with technical indicators
   */
  async storeMarketAnalysis(data: BitcoinData[], indicators: TechnicalIndicators): Promise<void> {
    try {
      if (data.length === 0) return;

      const latest = data[data.length - 1];
      
      const analysis: MarketAnalysis = {
        id: `analysis-${latest.timestamp.getTime()}`,
        timestamp: latest.timestamp,
        price: latest.price,
        indicators,
        sentiment: {
          score: 0, // Would be calculated based on various factors
          label: 'neutral',
          newsCount: 0,
          socialMediaMentions: 0,
          fearGreedIndex: 50
        },
        prediction: {
          shortTerm: latest.price * (1 + (Math.random() - 0.5) * 0.02), // ±1% random
          mediumTerm: latest.price * (1 + (Math.random() - 0.5) * 0.05), // ±2.5% random
          longTerm: latest.price * (1 + (Math.random() - 0.5) * 0.1), // ±5% random
          confidence: {
            shortTerm: 0.7,
            mediumTerm: 0.5,
            longTerm: 0.3
          }
        },
        confidence: 0.6
      };

      // Store analysis (implementation would depend on your ChromaDB schema)
      console.log('✅ Market analysis calculated and ready for storage');
    } catch (error) {
      console.error('❌ Error storing market analysis:', error);
    }
  }

  // Private helper methods

  private getStartTimeForRange(timeRange: string, endTime: Date): Date {
    const start = new Date(endTime);
    
    switch (timeRange) {
      case '1h':
        start.setHours(start.getHours() - 1);
        break;
      case '4h':
        start.setHours(start.getHours() - 4);
        break;
      case '1d':
        start.setDate(start.getDate() - 1);
        break;
      case '1w':
        start.setDate(start.getDate() - 7);
        break;
      case '1m':
        start.setMonth(start.getMonth() - 1);
        break;
      default:
        start.setDate(start.getDate() - 1);
    }
    
    return start;
  }

  private getTimeUnit(timeRange: string): string {
    switch (timeRange) {
      case '1h':
      case '4h':
        return 'minute';
      case '1d':
        return 'hour';
      case '1w':
        return 'day';
      case '1m':
        return 'week';
      default:
        return 'hour';
    }
  }

  private calculateSMA(prices: ChartDataPoint[], period: number): ChartDataPoint[] {
    const result: ChartDataPoint[] = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const average = slice.reduce((sum, point) => sum + point.y, 0) / period;
      
      result.push({
        x: prices[i].x,
        y: average
      });
    }
    
    return result;
  }

  private calculateEMA(prices: ChartDataPoint[], period: number): ChartDataPoint[] {
    const result: ChartDataPoint[] = [];
    const multiplier = 2 / (period + 1);
    
    // Start with SMA for first value
    if (prices.length >= period) {
      const firstSMA = prices.slice(0, period).reduce((sum, point) => sum + point.y, 0) / period;
      result.push({
        x: prices[period - 1].x,
        y: firstSMA
      });
      
      // Calculate EMA for remaining values
      for (let i = period; i < prices.length; i++) {
        const ema = (prices[i].y * multiplier) + (result[result.length - 1].y * (1 - multiplier));
        result.push({
          x: prices[i].x,
          y: ema
        });
      }
    }
    
    return result;
  }

  private calculateRSI(prices: ChartDataPoint[], period: number = 14): ChartDataPoint[] {
    const result: ChartDataPoint[] = [];
    const changes: number[] = [];
    
    // Calculate price changes
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i].y - prices[i - 1].y);
    }
    
    for (let i = period; i <= changes.length; i++) {
      const periodChanges = changes.slice(i - period, i);
      const gains = periodChanges.filter(change => change > 0);
      const losses = periodChanges.filter(change => change < 0).map(Math.abs);
      
      const avgGain = gains.reduce((sum, gain) => sum + gain, 0) / period;
      const avgLoss = losses.reduce((sum, loss) => sum + loss, 0) / period;
      
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      
      result.push({
        x: prices[i].x,
        y: rsi
      });
    }
    
    return result;
  }

  private calculateMACD(prices: ChartDataPoint[]) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    
    const macd: ChartDataPoint[] = [];
    const minLength = Math.min(ema12.length, ema26.length);
    
    for (let i = 0; i < minLength; i++) {
      macd.push({
        x: ema12[i].x,
        y: ema12[i].y - ema26[i].y
      });
    }
    
    const signal = this.calculateEMA(macd, 9);
    const histogram: ChartDataPoint[] = [];
    
    for (let i = 0; i < Math.min(macd.length, signal.length); i++) {
      histogram.push({
        x: macd[i].x,
        y: macd[i].y - signal[i].y
      });
    }
    
    return { macd, signal, histogram };
  }

  private calculateBollingerBands(prices: ChartDataPoint[], period: number, multiplier: number) {
    const sma = this.calculateSMA(prices, period);
    const upper: ChartDataPoint[] = [];
    const middle: ChartDataPoint[] = [];
    const lower: ChartDataPoint[] = [];
    
    for (let i = 0; i < sma.length; i++) {
      const priceSlice = prices.slice(i, i + period);
      const variance = priceSlice.reduce((sum, point) => {
        return sum + Math.pow(point.y - sma[i].y, 2);
      }, 0) / period;
      const stdDev = Math.sqrt(variance);
      
      middle.push(sma[i]);
      upper.push({
        x: sma[i].x,
        y: sma[i].y + (stdDev * multiplier)
      });
      lower.push({
        x: sma[i].x,
        y: sma[i].y - (stdDev * multiplier)
      });
    }
    
    return { upper, middle, lower };
  }

  private getIndicatorColor(seed: number): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    return colors[seed % colors.length];
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.analysisCollection) {
      await this.initialize();
    }
  }
}

// Export singleton instance
export const chartService = new ChartService();