// API route for Bitcoin chart data with timeframe filtering

import { NextRequest, NextResponse } from 'next/server';
import { bitcoinPriceService } from '@/lib/services/bitcoin-price-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '1d';
    
    // Map timeframe to hours
    let hours: number;
    switch (timeframe.toLowerCase()) {
      case '1d':
        hours = 24;
        break;
      case '1w':
        hours = 24 * 7;
        break;
      case '1m':
        hours = 24 * 30;
        break;
      default:
        hours = 24;
    }

    // Validate hours parameter
    if (hours > 24 * 30) { // Max 30 days
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid timeframe. Supported: 1d, 1w, 1m'
        },
        { status: 400 }
      );
    }

    const history = await bitcoinPriceService.getPriceHistory(hours);
    
    // Transform data to match expected chart format
    const chartData = history.map(price => ({
      timestamp: price.timestamp.toISOString(),
      price: price.price,
      volume: price.volume || 0
    }));

    return NextResponse.json({
      success: true,
      data: chartData,
      count: chartData.length,
      timeframe: timeframe,
      message: `Chart data for timeframe: ${timeframe}`
    });
  } catch (error) {
    console.error('Error fetching Bitcoin chart data:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch Bitcoin chart data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}