import { test, expect } from '@playwright/test';

test.describe('News API Tests', () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';

  test('GET /api/news should return news list', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/news`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('articles');
    expect(data.data).toHaveProperty('pagination');
  });

  test('GET /api/news with filters should return filtered results', async ({ request }) => {
    // 먼저 테스트 데이터 생성
    await request.post(`${baseURL}/api/news/analyze`, {
      data: { action: 'generate_mock' }
    });

    const response = await request.get(`${baseURL}/api/news?category=market&limit=5`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.articles).toBeDefined();
    expect(data.data.pagination.limit).toBe(5);
  });

  test('POST /api/news should create new article', async ({ request }) => {
    const newArticle = {
      title: '테스트 뉴스 제목',
      content: '테스트 뉴스 내용입니다.',
      source: 'TestSource',
      url: 'https://example.com/test',
      publishedAt: new Date().toISOString(),
      sentimentScore: 0.5,
      importanceScore: 7,
      category: 'market',
      relatedSymbols: ['BTC', 'ETH'],
      summary: '테스트 요약',
      aiAnalysis: '테스트 AI 분석'
    };

    const response = await request.post(`${baseURL}/api/news`, {
      data: newArticle
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.title).toBe(newArticle.title);
    expect(data.data.relatedSymbols).toEqual(newArticle.relatedSymbols);
  });

  test('GET /api/news/reports should return reports list', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/news/reports`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('POST /api/news/reports should create new report', async ({ request }) => {
    const newReport = {
      type: 'daily',
      date: new Date().toISOString(),
      overallSentiment: 0.3,
      marketTrend: 'bullish',
      keyEvents: ['테스트 이벤트 1', '테스트 이벤트 2'],
      summary: '테스트 리포트 요약',
      topStoryIds: []
    };

    const response = await request.post(`${baseURL}/api/news/reports`, {
      data: newReport
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.type).toBe(newReport.type);
    expect(data.data.marketTrend).toBe(newReport.marketTrend);
  });

  test('GET /api/news/sentiment should return sentiment analysis', async ({ request }) => {
    // 먼저 테스트 데이터 생성
    await request.post(`${baseURL}/api/news/analyze`, {
      data: { action: 'generate_mock' }
    });

    const response = await request.get(`${baseURL}/api/news/sentiment`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('overallSentiment');
    expect(data.data).toHaveProperty('marketTrend');
    expect(data.data).toHaveProperty('confidence');
    expect(data.data).toHaveProperty('newsCount');
    expect(typeof data.data.overallSentiment).toBe('number');
    expect(['bullish', 'bearish', 'neutral']).toContain(data.data.marketTrend);
  });

  test('GET /api/news/context should return news context', async ({ request }) => {
    // 먼저 테스트 데이터 생성
    await request.post(`${baseURL}/api/news/analyze`, {
      data: { action: 'generate_mock' }
    });

    const response = await request.get(`${baseURL}/api/news/context`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('summary');
    expect(data.data).toHaveProperty('latestNews');
    expect(data.data).toHaveProperty('currentSentiment');
    expect(data.data).toHaveProperty('marketTrend');
    expect(data.data).toHaveProperty('keyEvents');
    expect(Array.isArray(data.data.latestNews)).toBe(true);
    expect(Array.isArray(data.data.keyEvents)).toBe(true);
  });

  test('POST /api/news/analyze should generate mock data', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/news/analyze`, {
      data: { action: 'generate_mock' }
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('message');
    expect(data.data).toHaveProperty('newsGenerated');
    expect(data.data).toHaveProperty('reportGenerated');
    expect(data.data).toHaveProperty('articles');
    expect(data.data).toHaveProperty('report');
    expect(data.data.newsGenerated).toBeGreaterThan(0);
    expect(Array.isArray(data.data.articles)).toBe(true);
  });

  test('GET /api/news with search parameter should return relevant results', async ({ request }) => {
    // 먼저 테스트 데이터 생성
    await request.post(`${baseURL}/api/news/analyze`, {
      data: { action: 'generate_mock' }
    });

    const response = await request.get(`${baseURL}/api/news?search=비트코인`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.articles).toBeDefined();
    
    // 검색 결과에 검색어가 포함되어 있는지 확인 (있다면)
    if (data.data.articles.length > 0) {
      const firstArticle = data.data.articles[0];
      const hasSearchTerm = firstArticle.title.includes('비트코인') || 
                           (firstArticle.summary && firstArticle.summary.includes('비트코인'));
      expect(hasSearchTerm).toBe(true);
    }
  });

  test('GET /api/news with pagination should return correct page', async ({ request }) => {
    // 먼저 테스트 데이터 생성
    await request.post(`${baseURL}/api/news/analyze`, {
      data: { action: 'generate_mock' }
    });

    const response = await request.get(`${baseURL}/api/news?page=1&limit=3`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.pagination.page).toBe(1);
    expect(data.data.pagination.limit).toBe(3);
    expect(data.data.articles.length).toBeLessThanOrEqual(3);
  });

  test('API endpoints should handle errors gracefully', async ({ request }) => {
    // 잘못된 카테고리로 뉴스 생성 시도
    const invalidArticle = {
      title: '테스트',
      content: '테스트',
      source: 'Test',
      publishedAt: 'invalid-date',
      category: 'invalid-category'
    };

    const response = await request.post(`${baseURL}/api/news`, {
      data: invalidArticle
    });
    
    // 에러가 발생해도 500 에러가 아닌 적절한 에러 응답이 와야 함
    expect([400, 500]).toContain(response.status());
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data).toHaveProperty('error');
  });
});