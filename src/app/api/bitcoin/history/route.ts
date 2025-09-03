// API route for Bitcoin price history (latest 10 records)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 10;

    // Validate limit parameter
    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid limit parameter. Must be between 1 and 50'
        },
        { status: 400 }
      );
    }

    // Get latest records from database
    const history = await prisma.bitcoinPrice.findMany({
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: history,
      count: history.length,
      message: `Latest ${history.length} price records from database`
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