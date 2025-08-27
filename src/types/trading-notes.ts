// Trading Notes TypeScript types

export interface TradingNoteInput {
  title: string;
  content: string;
  tags?: string[];
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  isPublic?: boolean;
}

export interface TradingNoteOutput {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  bitcoinPrice?: number;
  priceChange24h?: number;
  sentiment?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  userEmail?: string; // For public notes
}

export interface TradingNoteSearchResult {
  id: string;
  title: string;
  content: string;
  tags: string[];
  sentiment?: string;
  relevanceScore?: number;
  createdAt: Date;
}

export interface TradingNoteUpdateInput {
  title?: string;
  content?: string;
  tags?: string[];
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  isPublic?: boolean;
}

export interface TradingNotesAnalytics {
  totalNotes: number;
  sentimentBreakdown: {
    bullish: number;
    bearish: number;
    neutral: number;
  };
  topTags: Array<{ tag: string; count: number }>;
  averageNotesPerDay: number;
}