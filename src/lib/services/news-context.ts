import { NewsContext } from '@/types/news';

/**
 * 뉴스 컨텍스트를 AI 에이전트 프롬프트에 주입하는 서비스
 */
export class NewsContextService {
  private static instance: NewsContextService;
  private cachedContext: NewsContext | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30분

  private constructor() {}

  public static getInstance(): NewsContextService {
    if (!NewsContextService.instance) {
      NewsContextService.instance = new NewsContextService();
    }
    return NewsContextService.instance;
  }

  /**
   * 최신 뉴스 컨텍스트 조회 (캐싱 포함)
   */
  public async getNewsContext(): Promise<NewsContext | null> {
    try {
      // 캐시된 데이터가 유효한 경우 반환
      if (this.cachedContext && Date.now() < this.cacheExpiry) {
        return this.cachedContext;
      }

      // API에서 새로운 컨텍스트 조회
      const response = await fetch('/api/news/context');
      if (!response.ok) {
        console.error('Failed to fetch news context:', response.status);
        return null;
      }

      const result = await response.json();
      if (result.success) {
        this.cachedContext = result.data;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;
        return this.cachedContext;
      }

      return null;
    } catch (error) {
      console.error('Error fetching news context:', error);
      return null;
    }
  }

  /**
   * 에이전트 프롬프트에 뉴스 컨텍스트를 주입
   */
  public async injectNewsContext(basePrompt: string): Promise<string> {
    const context = await this.getNewsContext();
    
    if (!context || context.latestNews.length === 0) {
      return basePrompt;
    }

    const newsContextPrompt = this.buildNewsContextPrompt(context);
    
    // 프롬프트 끝에 뉴스 컨텍스트 추가
    return `${basePrompt}

## 최신 시장 뉴스 컨텍스트

${newsContextPrompt}

위 뉴스 정보를 참고하여 분석과 추천을 제공하되, 직접적으로 뉴스 내용을 언급하지는 말고 전반적인 시장 상황을 고려한 관점으로 접근해주세요.`;
  }

  /**
   * 뉴스 컨텍스트를 프롬프트 형태로 구성
   */
  private buildNewsContextPrompt(context: NewsContext): string {
    const { currentSentiment, marketTrend, keyEvents, latestNews, newsCount } = context;

    let prompt = `**시장 현황 요약:**
- 전체 시장 감정: ${(currentSentiment * 100).toFixed(0)}/100 (${marketTrend})
- 분석된 뉴스 수: ${newsCount}개 (최근 48시간)
- 업데이트: ${new Date(context.lastUpdated).toLocaleString('ko-KR')}

`;

    if (keyEvents.length > 0) {
      prompt += `**주요 이벤트:**
${keyEvents.map(event => `- ${event}`).join('\n')}

`;
    }

    if (latestNews.length > 0) {
      prompt += `**중요 뉴스 (최근 5개):**
`;
      latestNews.forEach((news, index) => {
        const sentimentLabel = news.sentiment > 0.2 ? '긍정적' : 
                             news.sentiment < -0.2 ? '부정적' : '중립적';
        
        prompt += `${index + 1}. [${news.category.toUpperCase()}] ${news.title}
   - 감정: ${sentimentLabel} (${(news.sentiment * 100).toFixed(0)})
   - 요약: ${news.summary}
${news.analysis ? `   - AI 분석: ${news.analysis}` : ''}

`;
      });
    }

    return prompt;
  }

  /**
   * 캐시 무효화 (새로운 뉴스 생성 시 호출)
   */
  public invalidateCache(): void {
    this.cachedContext = null;
    this.cacheExpiry = 0;
  }

  /**
   * 뉴스 컨텍스트를 간단한 텍스트로 반환 (에이전트 대화용)
   */
  public async getSimpleContext(): Promise<string> {
    const context = await this.getNewsContext();
    
    if (!context || context.latestNews.length === 0) {
      return "현재 분석된 뉴스가 없습니다.";
    }

    const trendLabel = context.marketTrend === 'bullish' ? '상승' :
                      context.marketTrend === 'bearish' ? '하락' : '중립';

    return `현재 암호화폐 시장 분위기는 ${trendLabel} 기조입니다. ` +
           `최근 ${context.newsCount}개의 뉴스를 분석한 결과 ` +
           `전체 시장 감정 지수는 ${(context.currentSentiment * 100).toFixed(0)}/100입니다.`;
  }
}