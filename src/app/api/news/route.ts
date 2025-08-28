import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { NewsFilters } from '@/types/news';

const prisma = new PrismaClient();

// GET /api/news - 뉴스 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: NewsFilters = {
      category: searchParams.get('category') as any,
      search: searchParams.get('search') || undefined,
      minImportance: searchParams.get('minImportance') ? 
        parseInt(searchParams.get('minImportance')!) : undefined,
      dateFrom: searchParams.get('dateFrom') ? 
        new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? 
        new Date(searchParams.get('dateTo')!) : undefined,
    };
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build where clause
    const where: Record<string, any> = {};
    
    if (filters.category) {
      where.category = filters.category;
    }
    
    if (filters.minImportance) {
      where.importanceScore = { gte: filters.minImportance };
    }
    
    if (filters.dateFrom || filters.dateTo) {
      where.publishedAt = {};
      if (filters.dateFrom) where.publishedAt.gte = filters.dateFrom;
      if (filters.dateTo) where.publishedAt.lte = filters.dateTo;
    }
    
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { summary: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.newsArticle.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.newsArticle.count({ where })
    ]);

    // Transform data
    const transformedArticles = articles.map(article => ({
      ...article,
      relatedSymbols: JSON.parse(article.relatedSymbols),
    }));

    return NextResponse.json({
      success: true,
      data: {
        articles: transformedArticles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      }
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

// POST /api/news - 새 뉴스 생성 (개발/테스트용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const article = await prisma.newsArticle.create({
      data: {
        title: body.title,
        content: body.content,
        source: body.source,
        url: body.url,
        publishedAt: new Date(body.publishedAt),
        sentimentScore: body.sentimentScore || 0,
        importanceScore: body.importanceScore || 5,
        category: body.category,
        relatedSymbols: JSON.stringify(body.relatedSymbols || []),
        summary: body.summary,
        aiAnalysis: body.aiAnalysis,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...article,
        relatedSymbols: JSON.parse(article.relatedSymbols),
      }
    });
  } catch (error) {
    console.error('Error creating news:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create news' },
      { status: 500 }
    );
  }
}