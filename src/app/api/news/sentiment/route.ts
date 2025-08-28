import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/news/sentiment - 현재 시장 감정 지수
export async function GET(request: NextRequest) {
  try {
    // 최근 24시간 뉴스 기준으로 감정 지수 계산
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentNews = await prisma.newsArticle.findMany({
      where: {
        publishedAt: {
          gte: oneDayAgo
        }
      },
      select: {
        sentimentScore: true,
        importanceScore: true,
        category: true,
      }
    });

    if (recentNews.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          overallSentiment: 0,
          marketTrend: 'neutral',
          confidence: 0,
          newsCount: 0,
          categoryBreakdown: {},
          lastUpdated: new Date(),
        }
      });
    }

    // 가중 평균으로 전체 감정 점수 계산 (중요도가 높을수록 더 큰 가중치)
    let totalWeightedSentiment = 0;
    let totalWeight = 0;
    const categoryStats: any = {};

    recentNews.forEach(news => {
      const weight = news.importanceScore;
      totalWeightedSentiment += news.sentimentScore * weight;
      totalWeight += weight;
      
      if (!categoryStats[news.category]) {
        categoryStats[news.category] = {
          count: 0,
          avgSentiment: 0,
          totalSentiment: 0,
        };
      }
      
      categoryStats[news.category].count += 1;
      categoryStats[news.category].totalSentiment += news.sentimentScore;
    });

    // 카테고리별 평균 계산
    Object.keys(categoryStats).forEach(category => {
      categoryStats[category].avgSentiment = 
        categoryStats[category].totalSentiment / categoryStats[category].count;
    });

    const overallSentiment = totalWeight > 0 ? totalWeightedSentiment / totalWeight : 0;
    
    // 시장 트렌드 결정
    let marketTrend: 'bullish' | 'bearish' | 'neutral';
    if (overallSentiment > 0.2) marketTrend = 'bullish';
    else if (overallSentiment < -0.2) marketTrend = 'bearish';
    else marketTrend = 'neutral';

    // 신뢰도 계산 (뉴스 개수와 감정 점수의 분산 기반)
    const confidence = Math.min(recentNews.length / 10, 1) * 100;

    return NextResponse.json({
      success: true,
      data: {
        overallSentiment: Number(overallSentiment.toFixed(3)),
        marketTrend,
        confidence: Number(confidence.toFixed(1)),
        newsCount: recentNews.length,
        categoryBreakdown: categoryStats,
        lastUpdated: new Date(),
      }
    });
  } catch (error) {
    console.error('Error calculating sentiment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate sentiment' },
      { status: 500 }
    );
  }
}