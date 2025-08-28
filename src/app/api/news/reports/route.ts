import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/news/reports - 뉴스 리포트 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'daily' | 'weekly' | undefined;
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: Record<string, any> = {};
    if (type) {
      where.type = type;
    }

    const reports = await prisma.newsReport.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
    });

    // Transform reports with top stories
    const reportsWithStories = await Promise.all(
      reports.map(async (report) => {
        const topStoryIds = JSON.parse(report.topStoriesIds);
        const topStories = await prisma.newsArticle.findMany({
          where: { id: { in: topStoryIds } },
          orderBy: { importanceScore: 'desc' },
        });

        return {
          ...report,
          keyEvents: JSON.parse(report.keyEvents),
          topStories: topStories.map(story => ({
            ...story,
            relatedSymbols: JSON.parse(story.relatedSymbols),
          })),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: reportsWithStories,
    });
  } catch (error) {
    console.error('Error fetching news reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch news reports' },
      { status: 500 }
    );
  }
}

// POST /api/news/reports - 새 리포트 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const report = await prisma.newsReport.create({
      data: {
        type: body.type,
        date: new Date(body.date),
        overallSentiment: body.overallSentiment,
        marketTrend: body.marketTrend,
        keyEvents: JSON.stringify(body.keyEvents || []),
        summary: body.summary,
        topStoriesIds: JSON.stringify(body.topStoryIds || []),
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...report,
        keyEvents: JSON.parse(report.keyEvents),
      }
    });
  } catch (error) {
    console.error('Error creating news report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create news report' },
      { status: 500 }
    );
  }
}