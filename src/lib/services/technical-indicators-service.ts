// Technical Indicators Service

import { prisma } from '@/lib/database/prisma-client';
import { bitcoinPriceService } from './bitcoin-price-service';
import { calculateTechnicalIndicators, type PriceData } from '@/lib/utils/technical-indicators';
import { technicalAnalysisAgent, type TechnicalAnalysisResult } from './technical-analysis-agent';
import type { TechnicalIndicator, TechnicalReport } from '@prisma/client';

export class TechnicalIndicatorsService {
  
  /**
   * Calculate and store technical indicators based on recent price data
   */
  async updateTechnicalIndicators(timeframe: string = '1d'): Promise<TechnicalIndicator | null> {
    try {
      console.log(`🔢 Calculating technical indicators (${timeframe})...`);
      
      // Get recent price history for calculations (need enough data for 50-day MA)
      const priceHistory = await bitcoinPriceService.getPriceHistory(72); // 3 days of 10-minute intervals
      
      if (priceHistory.length === 0) {
        console.log('❌ No price history available for technical indicators calculation');
        return null;
      }
      
      // Convert to required format
      const priceData: PriceData[] = priceHistory.map(p => ({
        timestamp: new Date(p.timestamp),
        price: p.price,
        high: p.high24h || p.price,
        low: p.low24h || p.price,
        volume: p.volume || undefined,
      }));
      
      // Calculate technical indicators
      const indicators = calculateTechnicalIndicators(priceData);
      
      if (!indicators) {
        console.log('❌ Failed to calculate technical indicators');
        return null;
      }
      
      // Store in database
      const savedIndicator = await prisma.technicalIndicator.create({
        data: {
          symbol: 'BTC',
          timeframe,
          price: indicators.price,
          high: indicators.high,
          low: indicators.low,
          volume: indicators.volume,
          sma5: indicators.sma5,
          sma10: indicators.sma10,
          sma20: indicators.sma20,
          sma50: indicators.sma50,
          ema12: indicators.ema12,
          ema26: indicators.ema26,
          rsi: indicators.rsi,
          stochK: indicators.stochK,
          stochD: indicators.stochD,
          macd: indicators.macd,
          macdSignal: indicators.macdSignal,
          macdHistogram: indicators.macdHistogram,
          bbUpper: indicators.bbUpper,
          bbMiddle: indicators.bbMiddle,
          bbLower: indicators.bbLower,
          bbWidth: indicators.bbWidth,
          support: indicators.support,
          resistance: indicators.resistance,
        },
      });
      
      console.log(`✅ Technical indicators updated successfully (${timeframe})`);
      return savedIndicator;
      
    } catch (error) {
      console.error('❌ Failed to update technical indicators:', error);
      return null;
    }
  }
  
  /**
   * Generate AI analysis report based on latest technical indicators
   */
  async generateAnalysisReport(timeframe: string = '1d'): Promise<TechnicalReport | null> {
    try {
      console.log(`🤖 Generating technical analysis report (${timeframe})...`);
      
      // Get latest technical indicators
      const latestIndicators = await this.getLatestIndicators('BTC', timeframe);
      
      if (!latestIndicators) {
        console.log('❌ No technical indicators available for analysis');
        return null;
      }
      
      // Convert to required format for AI analysis
      const indicatorData = {
        price: latestIndicators.price,
        high: latestIndicators.high,
        low: latestIndicators.low,
        volume: latestIndicators.volume,
        sma5: latestIndicators.sma5,
        sma10: latestIndicators.sma10,
        sma20: latestIndicators.sma20,
        sma50: latestIndicators.sma50,
        ema12: latestIndicators.ema12,
        ema26: latestIndicators.ema26,
        rsi: latestIndicators.rsi,
        stochK: latestIndicators.stochK,
        stochD: latestIndicators.stochD,
        macd: latestIndicators.macd,
        macdSignal: latestIndicators.macdSignal,
        macdHistogram: latestIndicators.macdHistogram,
        bbUpper: latestIndicators.bbUpper,
        bbMiddle: latestIndicators.bbMiddle,
        bbLower: latestIndicators.bbLower,
        bbWidth: latestIndicators.bbWidth,
        support: latestIndicators.support,
        resistance: latestIndicators.resistance,
      };
      
      // Generate AI analysis
      const analysis: TechnicalAnalysisResult = await technicalAnalysisAgent.generateAnalysis(indicatorData);
      
      // Save analysis report
      const savedReport = await prisma.technicalReport.create({
        data: {
          symbol: 'BTC',
          timeframe,
          overallTrend: analysis.overallTrend,
          trendStrength: analysis.trendStrength,
          confidence: analysis.confidence,
          buySignals: analysis.buySignals,
          sellSignals: analysis.sellSignals,
          neutralSignals: analysis.neutralSignals,
          recommendation: analysis.recommendation,
          keySupport: analysis.keySupport,
          keyResistance: analysis.keyResistance,
          nextTarget: analysis.nextTarget,
          stopLoss: analysis.stopLoss,
          summary: analysis.summary,
          aiInsights: analysis.aiInsights,
          riskAssessment: analysis.riskAssessment,
          signalStrength: analysis.signalStrength,
          volatilityLevel: analysis.volatilityLevel,
        },
      });
      
      console.log(`✅ Technical analysis report generated successfully (${timeframe})`);
      console.log(`📊 Trend: ${analysis.overallTrend} (${analysis.trendStrength.toFixed(1)}% strength)`);
      console.log(`📈 Recommendation: ${analysis.recommendation}`);
      console.log(`🎯 Signals: ${analysis.buySignals} buy, ${analysis.sellSignals} sell, ${analysis.neutralSignals} neutral`);
      
      return savedReport;
      
    } catch (error) {
      console.error('❌ Failed to generate technical analysis report:', error);
      return null;
    }
  }
  
  /**
   * Get latest technical indicators for a symbol and timeframe
   */
  async getLatestIndicators(symbol: string = 'BTC', timeframe: string = '1d'): Promise<TechnicalIndicator | null> {
    try {
      const indicators = await prisma.technicalIndicator.findFirst({
        where: {
          symbol,
          timeframe,
        },
        orderBy: {
          timestamp: 'desc',
        },
      });
      
      return indicators;
    } catch (error) {
      console.error('Error fetching latest technical indicators:', error);
      return null;
    }
  }
  
  /**
   * Get technical indicators history
   */
  async getIndicatorsHistory(
    symbol: string = 'BTC',
    timeframe: string = '1d',
    hours: number = 24
  ): Promise<TechnicalIndicator[]> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const indicators = await prisma.technicalIndicator.findMany({
        where: {
          symbol,
          timeframe,
          timestamp: {
            gte: since,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });
      
      return indicators;
    } catch (error) {
      console.error('Error fetching technical indicators history:', error);
      return [];
    }
  }
  
  /**
   * Get latest technical analysis report
   */
  async getLatestReport(symbol: string = 'BTC', timeframe: string = '1d'): Promise<TechnicalReport | null> {
    try {
      const report = await prisma.technicalReport.findFirst({
        where: {
          symbol,
          timeframe,
        },
        orderBy: {
          timestamp: 'desc',
        },
      });
      
      return report;
    } catch (error) {
      console.error('Error fetching latest technical report:', error);
      return null;
    }
  }
  
  /**
   * Get technical analysis reports history
   */
  async getReportsHistory(
    symbol: string = 'BTC',
    timeframe: string = '1d',
    limit: number = 10
  ): Promise<TechnicalReport[]> {
    try {
      const reports = await prisma.technicalReport.findMany({
        where: {
          symbol,
          timeframe,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: limit,
      });
      
      return reports;
    } catch (error) {
      console.error('Error fetching technical reports history:', error);
      return [];
    }
  }
  
  /**
   * Generate mock technical indicators for development/testing
   */
  async generateMockData(): Promise<{ indicators: TechnicalIndicator; report: TechnicalReport } | null> {
    try {
      console.log('🎭 Generating mock technical indicators data...');
      
      // Get current Bitcoin price for realistic mock data
      const currentPrice = await bitcoinPriceService.getLatestPrice();
      const price = currentPrice?.price || 100000;
      
      // Generate realistic mock indicators
      const mockIndicatorData = {
        price,
        high: price * (1 + Math.random() * 0.02),
        low: price * (1 - Math.random() * 0.02),
        volume: 500000000 + Math.random() * 200000000,
        sma5: price * (0.98 + Math.random() * 0.04),
        sma10: price * (0.96 + Math.random() * 0.08),
        sma20: price * (0.94 + Math.random() * 0.12),
        sma50: price * (0.90 + Math.random() * 0.20),
        ema12: price * (0.97 + Math.random() * 0.06),
        ema26: price * (0.95 + Math.random() * 0.10),
        rsi: 30 + Math.random() * 40, // RSI between 30-70 for realistic range
        stochK: 20 + Math.random() * 60,
        stochD: 20 + Math.random() * 60,
        macd: (Math.random() - 0.5) * 1000,
        macdSignal: (Math.random() - 0.5) * 800,
        macdHistogram: (Math.random() - 0.5) * 200,
        bbUpper: price * 1.05,
        bbMiddle: price,
        bbLower: price * 0.95,
        bbWidth: price * 0.10,
        support: price * (0.92 + Math.random() * 0.04),
        resistance: price * (1.04 + Math.random() * 0.04),
      };
      
      // Save mock indicators
      const savedIndicators = await prisma.technicalIndicator.create({
        data: {
          symbol: 'BTC',
          timeframe: '1d',
          ...mockIndicatorData,
        },
      });
      
      // Generate AI analysis for mock data
      const analysis = await technicalAnalysisAgent.generateAnalysis(mockIndicatorData);
      
      // Save mock report
      const savedReport = await prisma.technicalReport.create({
        data: {
          symbol: 'BTC',
          timeframe: '1d',
          overallTrend: analysis.overallTrend,
          trendStrength: analysis.trendStrength,
          confidence: analysis.confidence,
          buySignals: analysis.buySignals,
          sellSignals: analysis.sellSignals,
          neutralSignals: analysis.neutralSignals,
          recommendation: analysis.recommendation,
          keySupport: analysis.keySupport,
          keyResistance: analysis.keyResistance,
          nextTarget: analysis.nextTarget,
          stopLoss: analysis.stopLoss,
          summary: analysis.summary,
          aiInsights: analysis.aiInsights,
          riskAssessment: analysis.riskAssessment,
          signalStrength: analysis.signalStrength,
          volatilityLevel: analysis.volatilityLevel,
        },
      });
      
      console.log('✅ Mock technical indicators and analysis generated successfully');
      
      return {
        indicators: savedIndicators,
        report: savedReport,
      };
      
    } catch (error) {
      console.error('❌ Failed to generate mock data:', error);
      return null;
    }
  }
  
  /**
   * Clean up old technical indicators (keep last 7 days)
   */
  async cleanupOldData(): Promise<{ indicators: number; reports: number }> {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const [deletedIndicators, deletedReports] = await Promise.all([
        prisma.technicalIndicator.deleteMany({
          where: {
            timestamp: {
              lt: sevenDaysAgo,
            },
          },
        }),
        prisma.technicalReport.deleteMany({
          where: {
            timestamp: {
              lt: sevenDaysAgo,
            },
          },
        }),
      ]);
      
      if (deletedIndicators.count > 0 || deletedReports.count > 0) {
        console.log(`🧹 Cleaned up ${deletedIndicators.count} old indicators and ${deletedReports.count} old reports`);
      }
      
      return {
        indicators: deletedIndicators.count,
        reports: deletedReports.count,
      };
      
    } catch (error) {
      console.error('Error cleaning up old technical data:', error);
      return { indicators: 0, reports: 0 };
    }
  }
}

// Export singleton instance
export const technicalIndicatorsService = new TechnicalIndicatorsService();