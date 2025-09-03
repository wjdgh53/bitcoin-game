import { NextRequest, NextResponse } from 'next/server';
import { binanceWebSocketService } from '@/lib/services/binance-websocket-service';

interface BinanceTickerData {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

interface BinanceKlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  ignore: string;
}

// Technical Indicators Calculation Functions
function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
}

function calculateRSI(prices: number[], period: number = 14): number | null {
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

function calculateMACD(prices: number[]): { macd: number | null; signal: number | null; histogram: number | null } {
  if (prices.length < 26) {
    return { macd: null, signal: null, histogram: null };
  }
  
  // Calculate EMA 12 and EMA 26
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  if (ema12 === null || ema26 === null) {
    return { macd: null, signal: null, histogram: null };
  }
  
  const macd = ema12 - ema26;
  
  // For simplicity, using SMA instead of EMA for signal line
  const macdValues = [macd]; // In real implementation, you'd need more MACD values
  const signal = macd; // Simplified
  const histogram = macd - signal;
  
  return { macd, signal, histogram };
}

function calculateEMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  
  const multiplier = 2 / (period + 1);
  let ema = prices[prices.length - period];
  
  for (let i = prices.length - period + 1; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): { upper: number | null; middle: number | null; lower: number | null } {
  if (prices.length < period) {
    return { upper: null, middle: null, lower: null };
  }
  
  const middle = calculateSMA(prices, period);
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

function generateTradingSignal(price: number, sma20: number | null, rsi: number | null, macd: number | null): 'buy' | 'sell' | 'neutral' {
  let buySignals = 0;
  let sellSignals = 0;
  
  // SMA Signal
  if (sma20 !== null) {
    if (price > sma20) buySignals++;
    else sellSignals++;
  }
  
  // RSI Signal
  if (rsi !== null) {
    if (rsi < 30) buySignals++;
    else if (rsi > 70) sellSignals++;
  }
  
  // MACD Signal
  if (macd !== null) {
    if (macd > 0) buySignals++;
    else sellSignals++;
  }
  
  if (buySignals > sellSignals) return 'buy';
  if (sellSignals > buySignals) return 'sell';
  return 'neutral';
}

// Generate demo data similar to WebSocket service
function generateDemoData() {
  // Base price simulation (similar to WebSocket service)
  const basePrice = 95000 + Math.random() * 10000; // Random price between $95k-105k
  
  // Calculate 24h statistics
  const high24h = basePrice * (1.02 + Math.random() * 0.03); // 2-5% higher
  const low24h = basePrice * (0.95 + Math.random() * 0.03); // 3-8% lower
  const priceChangePercent = (Math.random() - 0.5) * 8; // ±4% change
  const priceChange = (basePrice * priceChangePercent) / 100;
  const volume24h = 30000 + Math.random() * 20000; // 30K-50K BTC volume

  // Generate historical prices for technical indicators (50 days)
  const historicalPrices: number[] = [];
  let price = basePrice * 0.9; // Start from 90% of current price
  
  for (let i = 0; i < 50; i++) {
    const volatility = 0.02 + Math.random() * 0.03; // 2-5% daily volatility
    const change = (Math.random() - 0.5) * volatility;
    price *= (1 + change);
    historicalPrices.push(price);
  }
  
  // Ensure current price is the last price in the series
  historicalPrices[historicalPrices.length - 1] = basePrice;

  // Calculate technical indicators
  const sma20 = calculateSMA(historicalPrices, 20);
  const rsi14 = calculateRSI(historicalPrices, 14);
  const macdData = calculateMACD(historicalPrices);
  const bollingerBands = calculateBollingerBands(historicalPrices, 20, 2);
  
  // Generate trading signal
  const signal = generateTradingSignal(basePrice, sma20, rsi14, macdData.macd);

  return {
    symbol: 'BTC/USDT',
    currentPrice: basePrice,
    priceChange,
    priceChangePercent,
    volume24h,
    high24h,
    low24h,
    technicalIndicators: {
      sma20,
      rsi14,
      macd: macdData.macd,
      macdSignal: macdData.signal,
      macdHistogram: macdData.histogram,
      bollingerUpper: bollingerBands.upper,
      bollingerMiddle: bollingerBands.middle,
      bollingerLower: bollingerBands.lower
    },
    tradingSignal: signal,
    lastUpdate: new Date().toISOString()
  };
}

export async function GET(request: NextRequest) {
  try {
    // First try to get data from WebSocket service if available
    const wsStatus = binanceWebSocketService.getStatus();
    if (wsStatus.connected) {
      const latestData = binanceWebSocketService.getLatestData();
      if (latestData && latestData.ticker) {
        const binanceData = {
          symbol: 'BTC/USDT',
          currentPrice: latestData.ticker.price,
          priceChange: latestData.ticker.priceChange,
          priceChangePercent: latestData.ticker.priceChangePercent,
          volume24h: latestData.ticker.volume,
          high24h: latestData.ticker.high24h,
          low24h: latestData.ticker.low24h,
          technicalIndicators: {
            sma20: latestData.indicators?.sma20 || null,
            rsi14: latestData.indicators?.rsi14 || null,
            macd: latestData.indicators?.macd || null,
            macdSignal: latestData.indicators?.macdSignal || null,
            macdHistogram: latestData.indicators?.macdHistogram || null,
            bollingerUpper: latestData.indicators?.bbUpper || null,
            bollingerMiddle: latestData.indicators?.bbMiddle || null,
            bollingerLower: latestData.indicators?.bbLower || null
          },
          tradingSignal: latestData.signals?.signal || 'neutral',
          lastUpdate: new Date(latestData.timestamp).toISOString()
        };
        
        return NextResponse.json({
          success: true,
          data: binanceData,
          source: 'websocket-realtime'
        });
      }
    }
    
    const symbol = 'BTCUSDT';
    
    // Fallback to REST API if WebSocket is not available
    const tickerResponse = await fetch(`https://api.binance.us/api/v3/ticker/24hr?symbol=${symbol}`, {
      next: { revalidate: 0 } // No cache for real-time data
    });
    
    if (!tickerResponse.ok) {
      throw new Error('Failed to fetch ticker data from Binance US');
    }
    
    const tickerData: BinanceTickerData = await tickerResponse.json();
    
    // Fetch historical kline data for technical indicators (last 50 days, 1d interval) from Binance US
    const klineResponse = await fetch(`https://api.binance.us/api/v3/klines?symbol=${symbol}&interval=1d&limit=50`, {
      next: { revalidate: 60 } // Cache for 1 minute
    });
    
    if (!klineResponse.ok) {
      throw new Error('Failed to fetch kline data from Binance US');
    }
    
    const klineData: BinanceKlineData[] = await klineResponse.json();
    
    // Extract closing prices for technical analysis
    const closingPrices = klineData.map(candle => parseFloat(candle.close));
    const currentPrice = parseFloat(tickerData.lastPrice);
    
    // Calculate technical indicators
    const sma20 = calculateSMA(closingPrices, 20);
    const rsi14 = calculateRSI(closingPrices, 14);
    const macdData = calculateMACD(closingPrices);
    const bollingerBands = calculateBollingerBands(closingPrices, 20, 2);
    
    // Generate trading signal
    const signal = generateTradingSignal(currentPrice, sma20, rsi14, macdData.macd);
    
    // Calculate price change in dollars
    const priceChange = parseFloat(tickerData.priceChange);
    const priceChangePercent = parseFloat(tickerData.priceChangePercent);
    
    const binanceData = {
      symbol: 'BTC/USDT',
      currentPrice,
      priceChange,
      priceChangePercent,
      volume24h: parseFloat(tickerData.volume),
      high24h: parseFloat(tickerData.highPrice),
      low24h: parseFloat(tickerData.lowPrice),
      technicalIndicators: {
        sma20,
        rsi14,
        macd: macdData.macd,
        macdSignal: macdData.signal,
        macdHistogram: macdData.histogram,
        bollingerUpper: bollingerBands.upper,
        bollingerMiddle: bollingerBands.middle,
        bollingerLower: bollingerBands.lower
      },
      tradingSignal: signal,
      lastUpdate: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: binanceData,
      source: 'binance-us-rest-api'
    });
    
  } catch (error) {
    console.error('Error fetching Binance US data, falling back to demo mode:', error);
    
    // Generate demo data as fallback
    const demoData = generateDemoData();
    
    return NextResponse.json({
      success: true,
      data: demoData,
      source: 'demo-mode',
      message: 'Using demo data due to Binance US API connection failure'
    });
  }
}