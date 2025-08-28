export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  source: string;
  url?: string;
  publishedAt: Date;
  sentimentScore: number; // -1 to 1
  importanceScore: number; // 1 to 10
  category: 'technical' | 'regulatory' | 'market' | 'corporate';
  relatedSymbols: string[];
  summary?: string;
  aiAnalysis?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsReport {
  id: string;
  type: 'daily' | 'weekly';
  date: Date;
  overallSentiment: number; // -1 to 1
  marketTrend: 'bullish' | 'bearish' | 'neutral';
  keyEvents: string[];
  summary: string;
  topStories: NewsArticle[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsFilters {
  category?: 'technical' | 'regulatory' | 'market' | 'corporate';
  dateFrom?: Date;
  dateTo?: Date;
  minImportance?: number;
  sentimentRange?: {
    min: number;
    max: number;
  };
  search?: string;
}

export interface NewsContext {
  latestNews: NewsArticle[];
  currentSentiment: number;
  marketTrend: 'bullish' | 'bearish' | 'neutral';
  keyEvents: string[];
  lastUpdated: Date;
}