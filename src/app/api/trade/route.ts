// API route for trading (buy/sell Bitcoin)

import { NextRequest, NextResponse } from 'next/server';
import { bitcoinPriceService } from '@/lib/services/bitcoin-price-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, amount } = body;

    // Validate input
    if (!type || !['buy', 'sell'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid trade type. Must be "buy" or "sell"'
        },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid amount. Must be a positive number'
        },
        { status: 400 }
      );
    }

    // Execute trade
    const result = await bitcoinPriceService.executeTrade(type, amount);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message
        },
        { status: 400 }
      );
    }

    // Update portfolio value after trade
    await bitcoinPriceService.updatePortfolioValue();

    return NextResponse.json({
      success: true,
      message: result.message,
      trade: {
        type,
        amount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error executing trade:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to execute trade',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}