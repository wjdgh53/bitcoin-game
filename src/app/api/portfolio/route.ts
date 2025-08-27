// API route for demo portfolio management

import { NextResponse } from 'next/server';
import { bitcoinPriceService } from '@/lib/services/bitcoin-price-service';

// GET /api/portfolio - Get demo portfolio
export async function GET() {
  try {
    // Get demo portfolio
    const portfolio = await bitcoinPriceService.getDemoPortfolio();
    
    if (!portfolio) {
      return NextResponse.json(
        { success: false, message: 'Failed to get portfolio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    console.error('Get portfolio API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/portfolio/reset - Reset demo portfolio
export async function POST() {
  try {
    // Reset demo portfolio to initial state
    const portfolio = await bitcoinPriceService.initializeDemoPortfolio();

    return NextResponse.json({
      success: true,
      message: 'Demo portfolio reset successfully',
      data: portfolio
    });
  } catch (error) {
    console.error('Reset portfolio API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to reset portfolio' },
      { status: 500 }
    );
  }
}