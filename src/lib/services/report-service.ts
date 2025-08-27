// Report Service for AI Analysis Reports

import { prisma } from '../database/prisma-client';
import { AnalysisReport } from './ai-agents';
import { dynamicAgentService } from './dynamic-agent-service';
import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient();

export class ReportService {
  /**
   * Generate and save analysis report from dynamic AI agent
   */
  async generateReport(agentType: string): Promise<AnalysisReport> {
    // Generate report from dynamic agent service
    const report = await dynamicAgentService.generateReport(agentType);

    // Save to database
    await prisma.analysisReport.create({
      data: {
        id: report.id,
        agentName: report.agentName,
        agentType: report.agentType,
        recommendation: report.recommendation,
        confidence: report.confidence,
        title: report.title,
        executiveSummary: report.executive_summary,
        marketAnalysis: report.market_analysis,
        technicalAnalysis: report.technical_analysis,
        riskAssessment: report.risk_assessment,
        strategyRationale: report.strategy_rationale,
        nextSteps: report.next_steps,
        currentPrice: report.data_points.current_price,
        priceChange24h: report.data_points.price_change_24h,
        trend: report.data_points.trend,
        momentum: report.data_points.momentum,
        support: report.data_points.support,
        resistance: report.data_points.resistance,
      }
    });

    return report;
  }

  /**
   * Get all reports ordered by timestamp
   */
  async getAllReports(limit: number = 50): Promise<any[]> {
    const reports = await prisma.analysisReport.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      take: limit
    });

    return reports;
  }

  /**
   * Get reports by agent type
   */
  async getReportsByAgent(agentType: string, limit: number = 20): Promise<any[]> {
    const reports = await prisma.analysisReport.findMany({
      where: {
        agentType: agentType
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit
    });

    return reports;
  }

  /**
   * Get single report by ID
   */
  async getReportById(id: string): Promise<any | null> {
    const report = await prisma.analysisReport.findUnique({
      where: {
        id: id
      }
    });

    return report;
  }

  /**
   * Delete old reports (keep last 100)
   */
  async cleanupOldReports(): Promise<number> {
    try {
      // Get IDs of reports to keep (latest 100)
      const reportsToKeep = await prisma.analysisReport.findMany({
        orderBy: {
          timestamp: 'desc'
        },
        take: 100,
        select: {
          id: true
        }
      });

      const idsToKeep = reportsToKeep.map(r => r.id);

      // Delete reports not in the keep list
      const result = await prisma.analysisReport.deleteMany({
        where: {
          id: {
            notIn: idsToKeep
          }
        }
      });

      if (result.count > 0) {
        console.log(`🧹 Cleaned up ${result.count} old analysis reports`);
      }

      return result.count;
    } catch (error) {
      console.error('Error cleaning up old reports:', error);
      return 0;
    }
  }

  /**
   * Get report statistics
   */
  async getReportStats(): Promise<{
    total: number;
    byAgent: Record<string, number>;
    recentRecommendations: Record<string, number>;
  }> {
    const total = await prisma.analysisReport.count();

    const byAgent = await prisma.analysisReport.groupBy({
      by: ['agentType'],
      _count: {
        id: true
      }
    });

    const recentRecommendations = await prisma.analysisReport.groupBy({
      by: ['recommendation'],
      _count: {
        id: true
      },
      where: {
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });

    return {
      total,
      byAgent: byAgent.reduce((acc, item) => {
        acc[item.agentType] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      recentRecommendations: recentRecommendations.reduce((acc, item) => {
        acc[item.recommendation] = item._count.id;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export const reportService = new ReportService();