// API route for current Bitcoin price

import { NextResponse } from 'next/server';
import { bitcoinPriceService } from '@/lib/services/bitcoin-price-service';

export async function GET() {
  try {
    const latestPrice = await bitcoinPriceService.getLatestPrice();
    
    if (!latestPrice) {
      return NextResponse.json(
        {
          success: false,
          message: 'No Bitcoin price data available. Use the fetch button to get data from CoinGecko API.'
        },
        { status: 404 }
      );
    }

    // Check if data is recent (within 1 hour for manual fetching)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const isRecent = latestPrice.timestamp > oneHourAgo;

    return NextResponse.json({
      success: true,
      data: latestPrice,
      isRecent,
      message: latestPrice.source === 'coingecko' 
        ? 'Price data from CoinGecko API' 
        : 'Price from database',
      source: latestPrice.source,
      lastUpdated: latestPrice.timestamp
    });
  } catch (error) {
    console.error('Error fetching current Bitcoin price:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch current Bitcoin price',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}