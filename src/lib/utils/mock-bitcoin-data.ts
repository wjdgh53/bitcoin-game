// Mock Bitcoin data for testing and development
// This file provides hardcoded Bitcoin price data to replace external API calls

import { BitcoinData } from '@/types/game';

// Base Bitcoin price (simulated current price)
const BASE_PRICE = 43500;

// Generate realistic price variations
function generatePriceVariation(basePrice: number, maxVariation = 0.05): number {
  const variation = (Math.random() - 0.5) * 2 * maxVariation; // -5% to +5%
  return basePrice * (1 + variation);
}

// Generate realistic historical data
function generateHistoricalPrices(hours: number = 24, basePrice: number = BASE_PRICE): number[] {
  const prices: number[] = [];
  let currentPrice = basePrice;
  
  // Generate prices going backwards in time
  for (let i = hours; i >= 0; i--) {
    // Small random walk for realistic price movement
    const hourlyChange = (Math.random() - 0.5) * 0.02; // ±1% per hour max
    currentPrice = currentPrice * (1 + hourlyChange);
    prices.unshift(Math.max(currentPrice, basePrice * 0.8)); // Prevent too large drops
  }
  
  return prices;
}

// Calculate realistic market data based on price
function calculateMarketData(price: number) {
  const marketCap = price * 19700000; // Approximate BTC supply
  const volume = marketCap * (0.05 + Math.random() * 0.1); // 5-15% of market cap
  return { marketCap, volume };
}

// Generate a single Bitcoin data point
export function generateMockBitcoinData(
  timestamp?: Date, 
  customPrice?: number,
  includeHistoricalContext = true
): BitcoinData {
  const now = timestamp || new Date();
  const price = customPrice || generatePriceVariation(BASE_PRICE);
  const { marketCap, volume } = calculateMarketData(price);
  
  // Generate previous prices for context
  const previousPrices = includeHistoricalContext 
    ? generateHistoricalPrices(24, price)
    : [price * 0.98, price]; // Simple fallback
  
  const previousPrice = previousPrices[0];
  const change24h = price - previousPrice;
  const changePercentage24h = (change24h / previousPrice) * 100;
  
  // Calculate high/low based on recent range
  const recentPrices = previousPrices.slice(-24);
  const high24h = Math.max(...recentPrices, price);
  const low24h = Math.min(...recentPrices, price);
  
  return {
    id: `mock-bitcoin-${now.getTime()}`,
    timestamp: now,
    price: Math.round(price * 100) / 100, // Round to 2 decimal places
    volume: Math.round(volume),
    marketCap: Math.round(marketCap),
    change24h: Math.round(change24h * 100) / 100,
    changePercentage24h: Math.round(changePercentage24h * 100) / 100,
    high24h: Math.round(high24h * 100) / 100,
    low24h: Math.round(low24h * 100) / 100,
    source: 'mock-data',
    volatility: Math.abs(changePercentage24h)
  };
}

// Generate historical Bitcoin data for charts and analysis
export function generateMockHistoricalData(hours: number = 24): BitcoinData[] {
  const historicalData: BitcoinData[] = [];
  const prices = generateHistoricalPrices(hours);
  
  for (let i = 0; i < prices.length; i++) {
    const timestamp = new Date(Date.now() - (hours - i) * 60 * 60 * 1000);
    const price = prices[i];
    
    historicalData.push(generateMockBitcoinData(timestamp, price, false));
  }
  
  return historicalData;
}

// Predefined market scenarios for testing different conditions
export const MOCK_MARKET_SCENARIOS = {
  bullish: {
    basePrice: BASE_PRICE * 1.1,
    trend: 'up',
    volatility: 'high',
    sentiment: 'positive'
  },
  bearish: {
    basePrice: BASE_PRICE * 0.9,
    trend: 'down', 
    volatility: 'high',
    sentiment: 'negative'
  },
  stable: {
    basePrice: BASE_PRICE,
    trend: 'sideways',
    volatility: 'low',
    sentiment: 'neutral'
  },
  volatile: {
    basePrice: BASE_PRICE,
    trend: 'sideways',
    volatility: 'very_high',
    sentiment: 'uncertain'
  }
} as const;

// Generate data based on market scenario
export function generateScenarioData(scenario: keyof typeof MOCK_MARKET_SCENARIOS): BitcoinData {
  const config = MOCK_MARKET_SCENARIOS[scenario];
  const variationMultiplier = config.volatility === 'very_high' ? 0.1 : 
                              config.volatility === 'high' ? 0.05 :
                              config.volatility === 'low' ? 0.01 : 0.03;
  
  let price = generatePriceVariation(config.basePrice, variationMultiplier);
  
  // Apply trend bias
  if (config.trend === 'up') {
    price *= (1 + Math.random() * 0.02); // Small upward bias
  } else if (config.trend === 'down') {
    price *= (1 - Math.random() * 0.02); // Small downward bias
  }
  
  return generateMockBitcoinData(undefined, price);
}

// Mock current time-based price (changes throughout the day)
export function getCurrentMockPrice(): BitcoinData {
  // Use current time to create deterministic but time-varying price
  const now = new Date();
  const dayProgress = (now.getHours() * 60 + now.getMinutes()) / 1440; // 0-1 through the day
  
  // Create a sine wave pattern for realistic daily movement
  const dailyVariation = Math.sin(dayProgress * 2 * Math.PI) * 0.02; // ±2% daily swing
  const randomNoise = (Math.random() - 0.5) * 0.01; // ±0.5% random noise
  
  const price = BASE_PRICE * (1 + dailyVariation + randomNoise);
  
  return generateMockBitcoinData(now, price);
}

// Default export for easy access
export default {
  generateMockBitcoinData,
  generateMockHistoricalData,
  generateScenarioData,
  getCurrentMockPrice,
  MOCK_MARKET_SCENARIOS,
  BASE_PRICE
};