// API route for technical indicators

import { NextRequest, NextResponse } from 'next/server';
import { technicalIndicatorsService } from '@/lib/services/technical-indicators-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTC';
    const timeframe = searchParams.get('timeframe') || '1d';
    const hours = parseInt(searchParams.get('hours') || '24');

    // Validate parameters
    if (!['1h', '4h', '1d', '1w'].includes(timeframe)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid timeframe. Use: 1h, 4h, 1d, 1w'
        },
        { status: 400 }
      );
    }

    if (hours < 1 || hours > 168) { // Max 7 days
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid hours parameter. Must be between 1 and 168 (7 days)'
        },
        { status: 400 }
      );
    }

    // Get indicators history
    const indicators = await technicalIndicatorsService.getIndicatorsHistory(symbol, timeframe, hours);

    return NextResponse.json({
      success: true,
      data: indicators,
      count: indicators.length,
      symbol,
      timeframe,
      hours,
      message: `Technical indicators for ${symbol} (${timeframe}) - last ${hours} hours`
    });

  } catch (error) {
    console.error('Error fetching technical indicators:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch technical indicators',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { timeframe = '1d' } = await request.json();

    // Validate timeframe
    if (!['1h', '4h', '1d', '1w'].includes(timeframe)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid timeframe. Use: 1h, 4h, 1d, 1w'
        },
        { status: 400 }
      );
    }

    // Update technical indicators
    const indicators = await technicalIndicatorsService.updateTechnicalIndicators(timeframe);

    if (!indicators) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to calculate technical indicators'
        },
        { status: 500 }
      );
    }

    // Generate analysis report
    const report = await technicalIndicatorsService.generateAnalysisReport(timeframe);

    return NextResponse.json({
      success: true,
      data: {
        indicators,
        report
      },
      message: 'Technical indicators updated and analysis generated successfully'
    });

  } catch (error) {
    console.error('Error updating technical indicators:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update technical indicators',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}