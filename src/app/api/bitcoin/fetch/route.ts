// Manual Bitcoin data fetching endpoint

import { NextRequest, NextResponse } from 'next/server';
import { bitcoinPriceService } from '@/lib/services/bitcoin-price-service';

// Memory store for fetched price data
let memoryPriceData: any = null;

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Manual Bitcoin operation requested');
    
    const body = await request.json();
    const { type = 'fetch' } = body;

    let result: any;
    
    switch (type) {
      case 'fetch':
        // Fetch current price to memory only
        result = await bitcoinPriceService.fetchCurrentPriceToMemory();
        memoryPriceData = result; // Store in memory
        break;
        
      case 'save':
        // Save memory data to database
        if (!memoryPriceData) {
          return NextResponse.json(
            { error: 'No price data in memory. Fetch price first.' },
            { status: 400 }
          );
        }
        
        result = await bitcoinPriceService.savePriceToDatabase(memoryPriceData);
        memoryPriceData = null; // Clear memory after saving
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid operation type. Use: fetch or save' },
          { status: 400 }
        );
    }

    console.log(`✅ Manual operation completed: ${type}`);
    
    return NextResponse.json({
      success: true,
      type,
      data: result,
      memoryData: type === 'fetch' ? memoryPriceData : null,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Manual operation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process Bitcoin operation',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check status
export async function GET() {
  try {
    const latestPrice = await bitcoinPriceService.getLatestPrice();
    
    return NextResponse.json({
      status: 'ready',
      lastUpdate: latestPrice?.timestamp || null,
      currentPrice: latestPrice?.price || null,
      memoryData: memoryPriceData,
      hasMemoryData: !!memoryPriceData,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Status check failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}