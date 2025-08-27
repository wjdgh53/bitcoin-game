// Watchlist types for bitcoin trading game

export interface WatchlistItemInput {
  symbol: string;
  name: string;
  alertPrice?: number;
  alertType?: 'above' | 'below' | 'both';
  notes?: string;
  tags?: string[];
}

export interface WatchlistItemOutput {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  currentPrice?: number;
  priceChange24h?: number;
  alertPrice?: number;
  alertType?: 'above' | 'below' | 'both';
  notes?: string;
  tags: string[];
  alertTriggered: boolean;
  lastAlertAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WatchlistItemUpdateInput {
  name?: string;
  alertPrice?: number;
  alertType?: 'above' | 'below' | 'both';
  notes?: string;
  tags?: string[];
  alertTriggered?: boolean;
}

export interface WatchlistSearchResult {
  id: string;
  symbol: string;
  name: string;
  currentPrice?: number;
  priceChange24h?: number;
  alertPrice?: number;
  alertType?: string;
  relevanceScore?: number;
  createdAt: Date;
}

export interface WatchlistAnalytics {
  totalItems: number;
  triggeredAlerts: number;
  averageGain: number;
  topPerformers: Array<{
    symbol: string;
    name: string;
    priceChange24h: number;
  }>;
  alertBreakdown: {
    above: number;
    below: number;
    both: number;
    none: number;
  };
  topTags: Array<{ tag: string; count: number }>;
}