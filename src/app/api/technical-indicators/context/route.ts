// API route for technical analysis context (for AI agents)

import { NextRequest, NextResponse } from 'next/server';
import { technicalIndicatorsService } from '@/lib/services/technical-indicators-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTC';
    const timeframe = searchParams.get('timeframe') || '1d';

    // Get latest indicators and report
    const [indicators, report] = await Promise.all([
      technicalIndicatorsService.getLatestIndicators(symbol, timeframe),
      technicalIndicatorsService.getLatestReport(symbol, timeframe)
    ]);

    if (!indicators || !report) {
      return NextResponse.json(
        {
          success: false,
          message: 'No technical analysis data available for context'
        },
        { status: 404 }
      );
    }

    // Format context for AI agents
    const context = {
      currentPrice: indicators.price,
      technicalIndicators: {
        rsi: indicators.rsi,
        macd: {
          line: indicators.macd,
          signal: indicators.macdSignal,
          histogram: indicators.macdHistogram
        },
        movingAverages: {
          sma20: indicators.sma20,
          sma50: indicators.sma50,
          ema12: indicators.ema12,
          ema26: indicators.ema26
        },
        bollingerBands: {
          upper: indicators.bbUpper,
          middle: indicators.bbMiddle,
          lower: indicators.bbLower,
          width: indicators.bbWidth
        },
        stochastic: {
          k: indicators.stochK,
          d: indicators.stochD
        },
        supportResistance: {
          support: indicators.support,
          resistance: indicators.resistance
        }
      },
      technicalAnalysis: {
        overallTrend: report.overallTrend,
        trendStrength: report.trendStrength,
        confidence: report.confidence,
        recommendation: report.recommendation,
        signalCounts: {
          buy: report.buySignals,
          sell: report.sellSignals,
          neutral: report.neutralSignals
        },
        keyLevels: {
          support: report.keySupport,
          resistance: report.keyResistance,
          nextTarget: report.nextTarget,
          stopLoss: report.stopLoss
        },
        volatilityLevel: report.volatilityLevel,
        summary: report.summary,
        aiInsights: report.aiInsights,
        riskAssessment: report.riskAssessment
      },
      contextSummary: `현재 ${symbol}는 ${report.overallTrend} 추세 (강도: ${report.trendStrength.toFixed(1)}%)를 보이고 있으며, RSI ${indicators.rsi?.toFixed(1) || 'N/A'}, 기술적 권고사항은 ${report.recommendation}입니다. ${report.buySignals}개 매수신호, ${report.sellSignals}개 매도신호가 활성화되어 있습니다.`,
      lastUpdated: report.timestamp
    };

    return NextResponse.json({
      success: true,
      data: context,
      symbol,
      timeframe,
      message: `Technical analysis context for AI agents - ${symbol} (${timeframe})`
    });

  } catch (error) {
    console.error('Error fetching technical analysis context:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch technical analysis context',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}