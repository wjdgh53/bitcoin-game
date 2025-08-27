// API routes for chart data

import { NextRequest, NextResponse } from 'next/server';
import { chartService } from '@/lib/services/chart-service';

// GET /api/chart - Get chart data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '1d';
    const limit = parseInt(searchParams.get('limit') || '288');
    const type = searchParams.get('type') || 'candlestick';
    const theme = searchParams.get('theme') || 'light';

    // Get raw chart data from ChromaDB
    const rawData = await chartService.getChartData(timeRange, limit);
    
    if (rawData.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          prices: [],
          volume: [],
          indicators: {}
        },
        config: chartService.getDefaultConfig(theme as 'light' | 'dark'),
        message: 'No data available for the requested time range'
      });
    }

    // Get chart configuration
    const config = chartService.getDefaultConfig(theme as 'light' | 'dark');
    config.type = type as 'line' | 'candlestick' | 'area';
    config.timeRange = timeRange as '1h' | '4h' | '1d' | '1w' | '1m';

    // Enable some default indicators based on query params
    const indicators = searchParams.get('indicators');
    if (indicators) {
      const enabledIndicators = indicators.split(',');
      if (enabledIndicators.includes('sma')) {
        config.indicators.sma!.enabled = true;
      }
      if (enabledIndicators.includes('ema')) {
        config.indicators.ema!.enabled = true;
      }
      if (enabledIndicators.includes('rsi')) {
        config.indicators.rsi!.enabled = true;
      }
      if (enabledIndicators.includes('macd')) {
        config.indicators.macd!.enabled = true;
      }
      if (enabledIndicators.includes('bollinger')) {
        config.indicators.bollinger!.enabled = true;
      }
    }

    // Process data with indicators
    const processedData = await chartService.processChartData(rawData, config);

    // Create Chart.js configuration
    const chartJSConfig = chartService.createChartJSConfig(processedData, config);

    return NextResponse.json({
      success: true,
      data: processedData,
      config: chartJSConfig,
      metadata: {
        timeRange,
        dataPoints: rawData.length,
        latestPrice: rawData[rawData.length - 1]?.price,
        priceChange24h: rawData[rawData.length - 1]?.changePercentage24h,
        volume24h: rawData[rawData.length - 1]?.volume,
        lastUpdated: rawData[rawData.length - 1]?.timestamp
      }
    });
  } catch (error) {
    console.error('Chart API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}

// POST /api/chart/config - Update chart configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, timeRange, indicators, theme } = body;

    // Create custom configuration
    const config = chartService.getDefaultConfig(theme || 'light');
    
    if (type) config.type = type;
    if (timeRange) config.timeRange = timeRange;
    if (indicators) {
      Object.assign(config.indicators, indicators);
    }

    // Get data with new configuration
    const rawData = await chartService.getChartData(config.timeRange);
    const processedData = await chartService.processChartData(rawData, config);
    const chartJSConfig = chartService.createChartJSConfig(processedData, config);

    return NextResponse.json({
      success: true,
      data: processedData,
      config: chartJSConfig,
      message: 'Chart configuration updated'
    });
  } catch (error) {
    console.error('Chart config update error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update chart configuration' },
      { status: 500 }
    );
  }
}