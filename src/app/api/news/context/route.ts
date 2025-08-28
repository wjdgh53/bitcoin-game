import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/news/context - 에이전트 프롬프트용 뉴스 컨텍스트
export async function GET(request: NextRequest) {
  try {
    // 최근 48시간 중요도 높은 뉴스만 선별
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    
    const [latestNews, sentiment] = await Promise.all([
      // 중요도 7 이상의 최신 뉴스 5개
      prisma.newsArticle.findMany({
        where: {
          publishedAt: { gte: twoDaysAgo },
          importanceScore: { gte: 7 }
        },
        orderBy: [
          { importanceScore: 'desc' },
          { publishedAt: 'desc' }
        ],
        take: 5,
        select: {
          title: true,
          summary: true,
          sentimentScore: true,
          category: true,
          publishedAt: true,
          aiAnalysis: true,
        }
      }),
      
      // 전체 감정 지수 계산
      prisma.newsArticle.aggregate({
        where: {
          publishedAt: { gte: twoDaysAgo }
        },
        _avg: {
          sentimentScore: true,
        },
        _count: {
          id: true,
        }
      })
    ]);

    const avgSentiment = sentiment._avg.sentimentScore || 0;
    let marketTrend: 'bullish' | 'bearish' | 'neutral';
    if (avgSentiment > 0.2) marketTrend = 'bullish';
    else if (avgSentiment < -0.2) marketTrend = 'bearish';
    else marketTrend = 'neutral';

    // 주요 이벤트 추출 (중요도 8 이상)
    const majorEvents = await prisma.newsArticle.findMany({
      where: {
        publishedAt: { gte: twoDaysAgo },
        importanceScore: { gte: 8 }
      },
      select: {
        title: true,
        category: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });

    const keyEvents = majorEvents.map(event => 
      `[${event.category.toUpperCase()}] ${event.title}`
    );

    // 컨텍스트 구성
    const context = {
      summary: `현재 암호화폐 시장은 ${marketTrend} 상태입니다. ` +
               `최근 48시간 동안 ${sentiment._count.id}개의 뉴스가 있었으며, ` +
               `전체 시장 감정 지수는 ${avgSentiment.toFixed(2)}입니다.`,
      latestNews: latestNews.map(news => ({
        title: news.title,
        summary: news.summary || news.title,
        sentiment: news.sentimentScore,
        category: news.category,
        analysis: news.aiAnalysis,
        publishedAt: news.publishedAt,
      })),
      currentSentiment: Number(avgSentiment.toFixed(3)),
      marketTrend,
      keyEvents,
      newsCount: sentiment._count.id,
      lastUpdated: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: context
    });
  } catch (error) {
    console.error('Error generating news context:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate news context' },
      { status: 500 }
    );
  }
}