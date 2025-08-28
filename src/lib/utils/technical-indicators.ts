// Technical indicators calculation utilities

export interface PriceData {
  timestamp: Date;
  price: number;
  high: number;
  low: number;
  volume?: number;
}

export interface TechnicalIndicatorData {
  price: number;
  high: number;
  low: number;
  volume?: number;
  sma5?: number;
  sma10?: number;
  sma20?: number;
  sma50?: number;
  ema12?: number;
  ema26?: number;
  rsi?: number;
  stochK?: number;
  stochD?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
  bbWidth?: number;
  support?: number;
  resistance?: number;
}

// Simple Moving Average
export function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  
  const sum = prices.slice(-period).reduce((acc, price) => acc + price, 0);
  return sum / period;
}

// Exponential Moving Average
export function calculateEMA(prices: number[], period: number, previousEMA?: number): number | null {
  if (prices.length === 0) return null;
  
  const currentPrice = prices[prices.length - 1];
  
  if (previousEMA === undefined) {
    // Use SMA as the first EMA value
    return calculateSMA(prices, period);
  }
  
  const multiplier = 2 / (period + 1);
  return (currentPrice * multiplier) + (previousEMA * (1 - multiplier));
}

// Relative Strength Index
export function calculateRSI(prices: number[], period: number = 14): number | null {
  if (prices.length < period + 1) return null;
  
  let gains = 0;
  let losses = 0;
  
  // Calculate initial average gains and losses
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  // Calculate RSI using Wilder's smoothing
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - change) / period;
    }
  }
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// MACD (Moving Average Convergence Divergence)
export function calculateMACD(
  prices: number[], 
  fastPeriod: number = 12, 
  slowPeriod: number = 26, 
  signalPeriod: number = 9
): { macd: number | null; signal: number | null; histogram: number | null } {
  if (prices.length < slowPeriod) {
    return { macd: null, signal: null, histogram: null };
  }
  
  const emaFast = calculateEMA(prices, fastPeriod);
  const emaSlow = calculateEMA(prices, slowPeriod);
  
  if (emaFast === null || emaSlow === null) {
    return { macd: null, signal: null, histogram: null };
  }
  
  const macd = emaFast - emaSlow;
  
  // For signal calculation, we would need historical MACD values
  // Simplified version - in real implementation, we'd track MACD history
  const signal = macd * 0.9; // Approximation for demo
  const histogram = macd - signal;
  
  return { macd, signal, histogram };
}

// Bollinger Bands
export function calculateBollingerBands(
  prices: number[], 
  period: number = 20, 
  multiplier: number = 2
): { upper: number | null; middle: number | null; lower: number | null; width: number | null } {
  if (prices.length < period) {
    return { upper: null, middle: null, lower: null, width: null };
  }
  
  const middle = calculateSMA(prices, period);
  if (middle === null) {
    return { upper: null, middle: null, lower: null, width: null };
  }
  
  // Calculate standard deviation
  const recentPrices = prices.slice(-period);
  const variance = recentPrices.reduce((acc, price) => acc + Math.pow(price - middle, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  
  const upper = middle + (stdDev * multiplier);
  const lower = middle - (stdDev * multiplier);
  const width = upper - lower;
  
  return { upper, middle, lower, width };
}

// Stochastic Oscillator
export function calculateStochastic(
  highs: number[], 
  lows: number[], 
  closes: number[], 
  kPeriod: number = 14, 
  dPeriod: number = 3
): { stochK: number | null; stochD: number | null } {
  if (highs.length < kPeriod || lows.length < kPeriod || closes.length < kPeriod) {
    return { stochK: null, stochD: null };
  }
  
  const recentHighs = highs.slice(-kPeriod);
  const recentLows = lows.slice(-kPeriod);
  const currentClose = closes[closes.length - 1];
  
  const highestHigh = Math.max(...recentHighs);
  const lowestLow = Math.min(...recentLows);
  
  let stochK = null;
  if (highestHigh !== lowestLow) {
    stochK = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  }
  
  // %D is typically a moving average of %K
  // Simplified version - in real implementation, we'd track %K history
  const stochD = stochK !== null ? stochK * 0.85 : null; // Approximation for demo
  
  return { stochK, stochD };
}

// Support and Resistance levels (simplified)
export function calculateSupportResistance(
  prices: number[], 
  highs: number[], 
  lows: number[], 
  period: number = 20
): { support: number | null; resistance: number | null } {
  if (prices.length < period) {
    return { support: null, resistance: null };
  }
  
  const recentPrices = prices.slice(-period);
  const recentHighs = highs.slice(-period);
  const recentLows = lows.slice(-period);
  
  // Simple support/resistance based on recent highs and lows
  const resistance = Math.max(...recentHighs) * 0.98; // Slightly below highest high
  const support = Math.min(...recentLows) * 1.02; // Slightly above lowest low
  
  return { support, resistance };
}

// Comprehensive technical analysis calculation
export function calculateTechnicalIndicators(
  priceHistory: PriceData[]
): TechnicalIndicatorData | null {
  if (priceHistory.length === 0) return null;
  
  const prices = priceHistory.map(p => p.price);
  const highs = priceHistory.map(p => p.high);
  const lows = priceHistory.map(p => p.low);
  
  const latest = priceHistory[priceHistory.length - 1];
  
  // Calculate all indicators
  const sma5 = calculateSMA(prices, 5);
  const sma10 = calculateSMA(prices, 10);
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  const rsi = calculateRSI(prices, 14);
  
  const { stochK, stochD } = calculateStochastic(highs, lows, prices, 14, 3);
  
  const { macd, signal: macdSignal, histogram: macdHistogram } = calculateMACD(prices, 12, 26, 9);
  
  const { 
    upper: bbUpper, 
    middle: bbMiddle, 
    lower: bbLower, 
    width: bbWidth 
  } = calculateBollingerBands(prices, 20, 2);
  
  const { support, resistance } = calculateSupportResistance(prices, highs, lows, 20);
  
  return {
    price: latest.price,
    high: latest.high,
    low: latest.low,
    volume: latest.volume,
    sma5,
    sma10,
    sma20,
    sma50,
    ema12,
    ema26,
    rsi,
    stochK,
    stochD,
    macd,
    macdSignal,
    macdHistogram,
    bbUpper,
    bbMiddle,
    bbLower,
    bbWidth,
    support,
    resistance,
  };
}

// Generate trend analysis based on indicators
export function analyzeTrend(indicators: TechnicalIndicatorData): {
  overallTrend: 'bullish' | 'bearish' | 'neutral' | 'sideways';
  trendStrength: number;
  confidence: number;
} {
  let bullishSignals = 0;
  let bearishSignals = 0;
  let totalSignals = 0;
  
  const { price, sma20, sma50, rsi, macd, macdSignal, bbUpper, bbLower } = indicators;
  
  // Moving average signals
  if (sma20 && sma50) {
    totalSignals++;
    if (sma20 > sma50) bullishSignals++;
    else bearishSignals++;
  }
  
  // Price vs MA signal
  if (sma20) {
    totalSignals++;
    if (price > sma20) bullishSignals++;
    else bearishSignals++;
  }
  
  // RSI signals
  if (rsi) {
    totalSignals++;
    if (rsi > 70) bearishSignals++; // Overbought
    else if (rsi < 30) bullishSignals++; // Oversold
    else if (rsi > 50) bullishSignals++; // Above midline
    else bearishSignals++;
  }
  
  // MACD signals
  if (macd && macdSignal) {
    totalSignals++;
    if (macd > macdSignal) bullishSignals++;
    else bearishSignals++;
  }
  
  // Bollinger Bands position
  if (bbUpper && bbLower) {
    totalSignals++;
    const bbPosition = (price - bbLower) / (bbUpper - bbLower);
    if (bbPosition > 0.7) bearishSignals++; // Near upper band
    else if (bbPosition < 0.3) bullishSignals++; // Near lower band
    else if (bbPosition > 0.5) bullishSignals++;
    else bearishSignals++;
  }
  
  if (totalSignals === 0) {
    return { overallTrend: 'neutral', trendStrength: 0, confidence: 0 };
  }
  
  const bullishRatio = bullishSignals / totalSignals;
  const bearishRatio = bearishSignals / totalSignals;
  
  let overallTrend: 'bullish' | 'bearish' | 'neutral' | 'sideways';
  let trendStrength: number;
  
  if (bullishRatio > 0.7) {
    overallTrend = 'bullish';
    trendStrength = bullishRatio * 100;
  } else if (bearishRatio > 0.7) {
    overallTrend = 'bearish';
    trendStrength = bearishRatio * 100;
  } else if (Math.abs(bullishRatio - bearishRatio) < 0.2) {
    overallTrend = 'sideways';
    trendStrength = 50;
  } else {
    overallTrend = 'neutral';
    trendStrength = Math.max(bullishRatio, bearishRatio) * 100;
  }
  
  const confidence = Math.abs(bullishRatio - bearishRatio) * 100;
  
  return { overallTrend, trendStrength, confidence };
}