// Binance-specific technical indicators calculation utilities

import { calculateSMA, calculateRSI, calculateMACD, calculateBollingerBands } from './technical-indicators';

export interface BinancePriceData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BinanceTickerData {
  symbol: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  high24h: number;
  low24h: number;
  volume: number;
  timestamp: number;
}

export interface BinanceTechnicalIndicators {
  price: number;
  high24h: number;
  low24h: number;
  volume: number;
  sma20?: number;
  rsi14?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
  priceChange?: number;
  priceChangePercent?: number;
  timestamp: number;
}

/**
 * Calculate technical indicators from Binance Kline data
 */
export function calculateBinanceIndicators(
  klineHistory: BinancePriceData[]
): BinanceTechnicalIndicators | null {
  if (klineHistory.length === 0) return null;

  const latest = klineHistory[klineHistory.length - 1];
  const closes = klineHistory.map(k => k.close);

  // Calculate 20-day SMA
  const sma20 = calculateSMA(closes, 20);

  // Calculate 14-day RSI
  const rsi14 = calculateRSI(closes, 14);

  // Calculate MACD
  const { macd, signal: macdSignal, histogram: macdHistogram } = calculateMACD(closes, 12, 26, 9);

  // Calculate Bollinger Bands (20-day, 2 std dev)
  const { upper: bbUpper, middle: bbMiddle, lower: bbLower } = calculateBollingerBands(closes, 20, 2);

  // Calculate price change from previous kline
  let priceChange = 0;
  let priceChangePercent = 0;
  
  if (klineHistory.length > 1) {
    const previous = klineHistory[klineHistory.length - 2];
    priceChange = latest.close - previous.close;
    priceChangePercent = (priceChange / previous.close) * 100;
  }

  return {
    price: latest.close,
    high24h: latest.high,
    low24h: latest.low,
    volume: latest.volume,
    sma20,
    rsi14,
    macd,
    macdSignal,
    macdHistogram,
    bbUpper,
    bbMiddle,
    bbLower,
    priceChange,
    priceChangePercent,
    timestamp: latest.timestamp,
  };
}

/**
 * Parse Binance Kline data from WebSocket message
 */
export function parseBinanceKline(klineData: any): BinancePriceData {
  return {
    timestamp: klineData.t, // Kline start time
    open: parseFloat(klineData.o),
    high: parseFloat(klineData.h),
    low: parseFloat(klineData.l),
    close: parseFloat(klineData.c),
    volume: parseFloat(klineData.v),
  };
}

/**
 * Parse Binance Ticker data from WebSocket message
 */
export function parseBinanceTicker(tickerData: any): BinanceTickerData {
  return {
    symbol: tickerData.s,
    price: parseFloat(tickerData.c), // Close price
    priceChange: parseFloat(tickerData.P), // Price change percent
    priceChangePercent: parseFloat(tickerData.P),
    high24h: parseFloat(tickerData.h), // 24hr high
    low24h: parseFloat(tickerData.l), // 24hr low
    volume: parseFloat(tickerData.v), // 24hr volume
    timestamp: tickerData.E, // Event time
  };
}

/**
 * Maintain a rolling buffer of Kline data for indicator calculations
 */
export class BinanceKlineBuffer {
  private buffer: BinancePriceData[] = [];
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  addKline(kline: BinancePriceData): void {
    // Add new kline
    this.buffer.push(kline);

    // Remove oldest if buffer exceeds max size
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  getBuffer(): BinancePriceData[] {
    return [...this.buffer]; // Return copy to prevent external modification
  }

  getLatest(): BinancePriceData | null {
    return this.buffer.length > 0 ? this.buffer[this.buffer.length - 1] : null;
  }

  size(): number {
    return this.buffer.length;
  }

  clear(): void {
    this.buffer = [];
  }

  /**
   * Calculate indicators based on current buffer
   */
  calculateIndicators(): BinanceTechnicalIndicators | null {
    return calculateBinanceIndicators(this.buffer);
  }
}

/**
 * Signal strength analysis based on technical indicators
 */
export function analyzeBinanceSignals(indicators: BinanceTechnicalIndicators): {
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  strength: number; // 0-100
  reasons: string[];
} {
  const reasons: string[] = [];
  let bullishSignals = 0;
  let bearishSignals = 0;
  let totalSignals = 0;

  const { price, sma20, rsi14, macd, macdSignal, bbUpper, bbLower, priceChangePercent } = indicators;

  // Price vs SMA20
  if (sma20) {
    totalSignals++;
    if (price > sma20) {
      bullishSignals++;
      reasons.push(`Price above SMA20 (${sma20.toFixed(2)})`);
    } else {
      bearishSignals++;
      reasons.push(`Price below SMA20 (${sma20.toFixed(2)})`);
    }
  }

  // RSI analysis
  if (rsi14) {
    totalSignals++;
    if (rsi14 < 30) {
      bullishSignals++;
      reasons.push(`RSI oversold (${rsi14.toFixed(1)})`);
    } else if (rsi14 > 70) {
      bearishSignals++;
      reasons.push(`RSI overbought (${rsi14.toFixed(1)})`);
    } else if (rsi14 > 50) {
      bullishSignals++;
      reasons.push(`RSI bullish (${rsi14.toFixed(1)})`);
    } else {
      bearishSignals++;
      reasons.push(`RSI bearish (${rsi14.toFixed(1)})`);
    }
  }

  // MACD analysis
  if (macd !== undefined && macdSignal !== undefined) {
    totalSignals++;
    if (macd > macdSignal) {
      bullishSignals++;
      reasons.push('MACD above signal line');
    } else {
      bearishSignals++;
      reasons.push('MACD below signal line');
    }
  }

  // Bollinger Bands analysis
  if (bbUpper && bbLower) {
    totalSignals++;
    if (price > bbUpper) {
      bearishSignals++;
      reasons.push('Price above Bollinger upper band (overbought)');
    } else if (price < bbLower) {
      bullishSignals++;
      reasons.push('Price below Bollinger lower band (oversold)');
    } else {
      // Neutral - price within bands
      const midPoint = (bbUpper + bbLower) / 2;
      if (price > midPoint) {
        bullishSignals++;
        reasons.push('Price above Bollinger midpoint');
      } else {
        bearishSignals++;
        reasons.push('Price below Bollinger midpoint');
      }
    }
  }

  // Recent price momentum
  if (priceChangePercent !== undefined) {
    totalSignals++;
    if (priceChangePercent > 1) {
      bullishSignals++;
      reasons.push(`Strong upward momentum (+${priceChangePercent.toFixed(2)}%)`);
    } else if (priceChangePercent < -1) {
      bearishSignals++;
      reasons.push(`Strong downward momentum (${priceChangePercent.toFixed(2)}%)`);
    } else if (priceChangePercent > 0) {
      bullishSignals++;
      reasons.push(`Positive momentum (+${priceChangePercent.toFixed(2)}%)`);
    } else {
      bearishSignals++;
      reasons.push(`Negative momentum (${priceChangePercent.toFixed(2)}%)`);
    }
  }

  if (totalSignals === 0) {
    return { signal: 'NEUTRAL', strength: 0, reasons: ['Insufficient data for analysis'] };
  }

  const bullishRatio = bullishSignals / totalSignals;
  const bearishRatio = bearishSignals / totalSignals;

  let signal: 'BUY' | 'SELL' | 'NEUTRAL';
  let strength: number;

  if (bullishRatio >= 0.6) {
    signal = 'BUY';
    strength = bullishRatio * 100;
  } else if (bearishRatio >= 0.6) {
    signal = 'SELL';
    strength = bearishRatio * 100;
  } else {
    signal = 'NEUTRAL';
    strength = 50;
  }

  return { signal, strength, reasons };
}