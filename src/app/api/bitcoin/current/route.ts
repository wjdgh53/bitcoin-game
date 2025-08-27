// API route for current Bitcoin price

import { NextResponse } from 'next/server';
import { bitcoinPriceService } from '@/lib/services/bitcoin-price-service';

export async function GET() {
  try {
    const latestPrice = await bitcoinPriceService.getLatestPrice();
    
    if (!latestPrice) {
      // If no price data exists, trigger an update
      console.log('No price data found, fetching from API...');
      const newPrice = await bitcoinPriceService.updateCurrentPrice();
      
      return NextResponse.json({
        success: true,
        data: newPrice,
        message: 'Price fetched from API'
      });
    }

    // Check if data is stale (older than 20 minutes)
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
    const isStale = latestPrice.timestamp < twentyMinutesAgo;

    return NextResponse.json({
      success: true,
      data: latestPrice,
      isStale,
      message: isStale ? 'Price data is stale' : 'Current price from database'
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