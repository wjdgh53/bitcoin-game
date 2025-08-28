// API route for current trading signals

import { NextRequest, NextResponse } from 'next/server';
import { technicalIndicatorsService } from '@/lib/services/technical-indicators-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTC';
    const timeframe = searchParams.get('timeframe') || '1d';

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

    // Get latest report with signals
    const report = await technicalIndicatorsService.getLatestReport(symbol, timeframe);

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          message: 'No technical analysis report available'
        },
        { status: 404 }
      );
    }

    // Extract signal information
    const signals = {
      recommendation: report.recommendation,
      overallTrend: report.overallTrend,
      trendStrength: report.trendStrength,
      confidence: report.confidence,
      signalStrength: report.signalStrength,
      buySignals: report.buySignals,
      sellSignals: report.sellSignals,
      neutralSignals: report.neutralSignals,
      keySupport: report.keySupport,
      keyResistance: report.keyResistance,
      nextTarget: report.nextTarget,
      stopLoss: report.stopLoss,
      volatilityLevel: report.volatilityLevel,
      summary: report.summary,
      timestamp: report.timestamp,
    };

    return NextResponse.json({
      success: true,
      data: signals,
      symbol,
      timeframe,
      message: `Current trading signals for ${symbol} (${timeframe})`
    });

  } catch (error) {
    console.error('Error fetching trading signals:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch trading signals',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}