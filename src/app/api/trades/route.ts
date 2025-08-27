// API route for trade history

import { NextResponse } from 'next/server';
import { bitcoinPriceService } from '@/lib/services/bitcoin-price-service';

export async function GET() {
  try {
    const trades = await bitcoinPriceService.getTradeHistory(20);
    
    return NextResponse.json({
      success: true,
      data: trades,
      count: trades.length
    });
  } catch (error) {
    console.error('Get trades API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}