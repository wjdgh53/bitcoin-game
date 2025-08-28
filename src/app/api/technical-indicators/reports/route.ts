// API route for technical analysis reports

import { NextRequest, NextResponse } from 'next/server';
import { technicalIndicatorsService } from '@/lib/services/technical-indicators-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTC';
    const timeframe = searchParams.get('timeframe') || '1d';
    const limit = parseInt(searchParams.get('limit') || '10');
    const latest = searchParams.get('latest') === 'true';

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

    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid limit parameter. Must be between 1 and 50'
        },
        { status: 400 }
      );
    }

    let reports;
    
    if (latest) {
      // Get only the latest report
      const latestReport = await technicalIndicatorsService.getLatestReport(symbol, timeframe);
      reports = latestReport ? [latestReport] : [];
    } else {
      // Get reports history
      reports = await technicalIndicatorsService.getReportsHistory(symbol, timeframe, limit);
    }

    return NextResponse.json({
      success: true,
      data: reports,
      count: reports.length,
      symbol,
      timeframe,
      latest,
      message: latest 
        ? `Latest technical analysis report for ${symbol} (${timeframe})`
        : `Technical analysis reports for ${symbol} (${timeframe}) - last ${limit} reports`
    });

  } catch (error) {
    console.error('Error fetching technical reports:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch technical analysis reports',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}