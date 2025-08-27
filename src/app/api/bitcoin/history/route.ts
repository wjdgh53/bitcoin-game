// API route for Bitcoin price history

import { NextRequest, NextResponse } from 'next/server';
import { bitcoinPriceService } from '@/lib/services/bitcoin-price-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hoursParam = searchParams.get('hours');
    const hours = hoursParam ? parseInt(hoursParam) : 24;

    // Validate hours parameter
    if (isNaN(hours) || hours < 1 || hours > 168) { // Max 7 days
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid hours parameter. Must be between 1 and 168 (7 days)'
        },
        { status: 400 }
      );
    }

    const history = await bitcoinPriceService.getPriceHistory(hours);

    return NextResponse.json({
      success: true,
      data: history,
      count: history.length,
      timeRange: `${hours} hours`,
      message: `Price history for the last ${hours} hours`
    });
  } catch (error) {
    console.error('Error fetching Bitcoin price history:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch Bitcoin price history',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}