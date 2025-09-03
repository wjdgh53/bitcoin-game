// API route for Bitcoin price history with calculated technical indicators

import { NextRequest, NextResponse } from 'next/server';
import { bitcoinPriceService } from '@/lib/services/bitcoin-price-service';
import { 
  calculateTechnicalIndicators, 
  analyzeTrend,
  PriceData 
} from '@/lib/utils/technical-indicators';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hoursParam = searchParams.get('hours');
    const hours = hoursParam ? parseInt(hoursParam) : 72; // Default to 3 days for better indicators

    // Validate hours parameter
    if (isNaN(hours) || hours < 24 || hours > 168) { // Min 24h, Max 7 days
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid hours parameter. Must be between 24 and 168 (1-7 days)'
        },
        { status: 400 }
      );
    }

    // Fetch price history from database
    const rawHistory = await bitcoinPriceService.getPriceHistory(hours);
    
    if (rawHistory.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No price history data available. WebSocket data collection may not be running. Please ensure the WebSocket services are started via /api/websocket/persistence endpoint.',
          details: {
            requestedHours: hours,
            suggestion: 'Try starting the WebSocket services with: POST /api/websocket/persistence with body: {"action": "start"}',
            fallbackEndpoint: '/api/technical-indicators/mock for mock data'
          }
        },
        { status: 404 }
      );
    }

    // Convert to PriceData format for technical analysis
    const priceHistory: PriceData[] = rawHistory.map(record => ({
      timestamp: new Date(record.timestamp),
      price: record.price,
      // Use available data or approximate high/low from price
      high: record.high24h || record.price * 1.02, // Approximate if not available
      low: record.low24h || record.price * 0.98,   // Approximate if not available
      volume: record.volume || undefined
    }));

    // Calculate technical indicators
    const currentIndicators = calculateTechnicalIndicators(priceHistory);
    
    if (!currentIndicators) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to calculate technical indicators - insufficient data'
        },
        { status: 500 }
      );
    }

    // Analyze trend
    const trendAnalysis = analyzeTrend(currentIndicators);

    // Get current price info
    const latestPrice = rawHistory[rawHistory.length - 1];
    const previousPrice = rawHistory.length > 1 ? rawHistory[rawHistory.length - 2] : latestPrice;
    const priceChange = latestPrice.price - previousPrice.price;
    const priceChangePercentage = ((priceChange / previousPrice.price) * 100);

    // Prepare chart data (last 50 points for performance)
    const chartData = rawHistory.slice(-50).map((record, index) => ({
      timestamp: record.timestamp,
      price: record.price,
      volume: record.volume,
      // Calculate moving averages for chart overlay
      sma20: index >= 19 ? rawHistory.slice(-50 + index - 19, -50 + index + 1)
        .reduce((sum, r) => sum + r.price, 0) / 20 : null,
      sma50: index >= 49 ? rawHistory.slice(-50 + index - 49, -50 + index + 1)
        .reduce((sum, r) => sum + r.price, 0) / 50 : null,
    }));

    // Generate trading signals
    const signals = [];
    
    // RSI signals
    if (currentIndicators.rsi) {
      if (currentIndicators.rsi > 70) {
        signals.push({
          type: 'sell',
          indicator: 'RSI',
          value: currentIndicators.rsi,
          message: 'Overbought condition - consider selling',
          strength: 'medium'
        });
      } else if (currentIndicators.rsi < 30) {
        signals.push({
          type: 'buy',
          indicator: 'RSI',
          value: currentIndicators.rsi,
          message: 'Oversold condition - consider buying',
          strength: 'medium'
        });
      }
    }

    // MACD signals
    if (currentIndicators.macd && currentIndicators.macdSignal) {
      if (currentIndicators.macd > currentIndicators.macdSignal) {
        signals.push({
          type: 'buy',
          indicator: 'MACD',
          value: currentIndicators.macd - currentIndicators.macdSignal,
          message: 'MACD line above signal line - bullish momentum',
          strength: 'strong'
        });
      } else {
        signals.push({
          type: 'sell',
          indicator: 'MACD',
          value: currentIndicators.macd - currentIndicators.macdSignal,
          message: 'MACD line below signal line - bearish momentum',
          strength: 'strong'
        });
      }
    }

    // Bollinger Bands signals
    if (currentIndicators.bbUpper && currentIndicators.bbLower) {
      const bbPosition = (currentIndicators.price - currentIndicators.bbLower) / 
                        (currentIndicators.bbUpper - currentIndicators.bbLower);
      
      if (bbPosition > 0.8) {
        signals.push({
          type: 'sell',
          indicator: 'Bollinger Bands',
          value: bbPosition * 100,
          message: 'Price near upper Bollinger Band - potential reversal',
          strength: 'medium'
        });
      } else if (bbPosition < 0.2) {
        signals.push({
          type: 'buy',
          indicator: 'Bollinger Bands',
          value: bbPosition * 100,
          message: 'Price near lower Bollinger Band - potential bounce',
          strength: 'medium'
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        // Current price information
        currentPrice: {
          price: latestPrice.price,
          change: priceChange,
          changePercentage: priceChangePercentage,
          timestamp: latestPrice.timestamp,
          volume: latestPrice.volume
        },
        
        // Technical indicators
        indicators: {
          // Moving Averages
          movingAverages: {
            sma5: currentIndicators.sma5,
            sma10: currentIndicators.sma10,
            sma20: currentIndicators.sma20,
            sma50: currentIndicators.sma50,
            ema12: currentIndicators.ema12,
            ema26: currentIndicators.ema26,
          },
          
          // Oscillators
          oscillators: {
            rsi: currentIndicators.rsi,
            stochK: currentIndicators.stochK,
            stochD: currentIndicators.stochD,
          },
          
          // MACD
          macd: {
            macd: currentIndicators.macd,
            signal: currentIndicators.macdSignal,
            histogram: currentIndicators.macdHistogram,
          },
          
          // Bollinger Bands
          bollingerBands: {
            upper: currentIndicators.bbUpper,
            middle: currentIndicators.bbMiddle,
            lower: currentIndicators.bbLower,
            width: currentIndicators.bbWidth,
          },
          
          // Support and Resistance
          levels: {
            support: currentIndicators.support,
            resistance: currentIndicators.resistance,
          }
        },
        
        // Trend analysis
        analysis: {
          trend: trendAnalysis.overallTrend,
          strength: trendAnalysis.trendStrength,
          confidence: trendAnalysis.confidence,
        },
        
        // Trading signals
        signals,
        
        // Chart data for visualization
        chartData,
        
        // Metadata
        metadata: {
          dataPoints: rawHistory.length,
          timeRange: `${hours} hours`,
          lastUpdated: new Date().toISOString(),
          calculationMethod: 'real-time from bitcoin_prices history'
        }
      }
    });

  } catch (error) {
    console.error('Error calculating technical indicators from history:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to calculate technical indicators',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}