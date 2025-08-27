// ChromaDB document schemas for Bitcoin trading game

import { 
  User, 
  Portfolio, 
  Trade, 
  Achievement, 
  BitcoinData, 
  MarketAnalysis, 
  EducationalContent,
  UserProgress,
  GameSession 
} from '@/types/game';

// ChromaDB Document interfaces
export interface ChromaDocument {
  id: string;
  document: string;
  metadata: Record<string, any>;
}

// User collection schema
export interface UserDocument extends ChromaDocument {
  document: string; // JSON string of user profile
  metadata: {
    user_id: string;
    email: string;
    username: string;
    created_at: string;
    game_level: number;
    total_trades: number;
    experience: number;
    last_login?: string;
    status: 'active' | 'inactive' | 'suspended';
  };
}

// Portfolio collection schema  
export interface PortfolioDocument extends ChromaDocument {
  document: string; // JSON string of portfolio data
  metadata: {
    user_id: string;
    portfolio_id: string;
    balance: number;
    bitcoin_holdings: number;
    total_value: number;
    profit: number;
    profit_percentage: number;
    trades_count: number;
    created_at: string;
    updated_at: string;
    performance_category: 'excellent' | 'good' | 'average' | 'poor';
  };
}

// Trade collection schema
export interface TradeDocument extends ChromaDocument {
  document: string; // JSON string of trade details
  metadata: {
    user_id: string;
    portfolio_id: string;
    trade_id: string;
    type: 'buy' | 'sell';
    amount: number;
    price: number;
    total: number;
    fee: number;
    timestamp: string;
    status: 'pending' | 'completed' | 'failed';
    profit_loss?: number;
    market_condition: 'bull' | 'bear' | 'sideways';
  };
}

// Achievement collection schema
export interface AchievementDocument extends ChromaDocument {
  document: string; // JSON string of achievement details
  metadata: {
    user_id: string;
    achievement_id: string;
    achievement_type: string;
    category: 'trading' | 'education' | 'social' | 'milestone';
    points: number;
    unlocked_at: string;
    difficulty: 'easy' | 'medium' | 'hard';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  };
}

// Bitcoin historical data collection schema
export interface BitcoinDataDocument extends ChromaDocument {
  document: string; // JSON string of price data
  metadata: {
    timestamp: string;
    price: number;
    volume: number;
    market_cap: number;
    change_24h: number;
    change_percentage_24h: number;
    high_24h: number;
    low_24h: number;
    source: string;
    volatility: number;
    trend: 'up' | 'down' | 'stable';
    time_period: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  };
}

// Market analysis collection schema
export interface MarketAnalysisDocument extends ChromaDocument {
  document: string; // JSON string of analysis data
  metadata: {
    timestamp: string;
    price: number;
    rsi: number;
    macd: number;
    sentiment_score: number;
    sentiment_label: 'bearish' | 'neutral' | 'bullish';
    prediction_confidence: number;
    short_term_prediction: number;
    medium_term_prediction: number;
    long_term_prediction: number;
    analysis_type: 'technical' | 'fundamental' | 'sentiment';
  };
}

// Educational content collection schema
export interface EducationalContentDocument extends ChromaDocument {
  document: string; // JSON string of content
  metadata: {
    content_id: string;
    title: string;
    content_type: 'article' | 'tutorial' | 'video' | 'quiz';
    category: string;
    difficulty_level: number;
    estimated_read_time: number;
    tags: string[];
    created_at: string;
    updated_at: string;
    author: string;
    is_published: boolean;
    view_count: number;
    rating: number;
  };
}

// User progress collection schema
export interface UserProgressDocument extends ChromaDocument {
  document: string; // JSON string of progress data
  metadata: {
    user_id: string;
    content_id: string;
    status: 'not_started' | 'in_progress' | 'completed';
    progress: number;
    time_spent: number;
    last_accessed: string;
    quiz_average_score: number;
    completion_date?: string;
  };
}

// Game session collection schema
export interface GameSessionDocument extends ChromaDocument {
  document: string; // JSON string of session data
  metadata: {
    user_id: string;
    session_id: string;
    start_time: string;
    end_time?: string;
    duration_minutes?: number;
    initial_balance: number;
    final_balance: number;
    trades_count: number;
    performance: number;
    achievements_count: number;
    difficulty: 'easy' | 'medium' | 'hard';
    mode: 'tutorial' | 'practice' | 'competitive';
  };
}

// Helper functions to convert between types and ChromaDB documents
export class DocumentMapper {
  static userToDocument(user: User): UserDocument {
    return {
      id: user.id,
      document: JSON.stringify(user),
      metadata: {
        user_id: user.id,
        email: user.email,
        username: user.username,
        created_at: user.createdAt.toISOString(),
        game_level: user.gameLevel,
        total_trades: user.totalTrades,
        experience: user.experience,
        status: 'active'
      }
    };
  }

  static portfolioToDocument(portfolio: Portfolio): PortfolioDocument {
    let performanceCategory: 'excellent' | 'good' | 'average' | 'poor' = 'average';
    if (portfolio.profitPercentage > 20) performanceCategory = 'excellent';
    else if (portfolio.profitPercentage > 10) performanceCategory = 'good';
    else if (portfolio.profitPercentage < -10) performanceCategory = 'poor';

    return {
      id: portfolio.id,
      document: JSON.stringify(portfolio),
      metadata: {
        user_id: portfolio.userId,
        portfolio_id: portfolio.id,
        balance: portfolio.balance,
        bitcoin_holdings: portfolio.bitcoinHoldings,
        total_value: portfolio.totalValue,
        profit: portfolio.profit,
        profit_percentage: portfolio.profitPercentage,
        trades_count: portfolio.trades.length,
        created_at: portfolio.createdAt.toISOString(),
        updated_at: portfolio.updatedAt.toISOString(),
        performance_category: performanceCategory
      }
    };
  }

  static tradeToDocument(trade: Trade): TradeDocument {
    const profitLoss = trade.type === 'sell' ? trade.total - (trade.amount * trade.price) : 0;
    
    return {
      id: trade.id,
      document: JSON.stringify(trade),
      metadata: {
        user_id: trade.userId,
        portfolio_id: trade.portfolioId,
        trade_id: trade.id,
        type: trade.type,
        amount: trade.amount,
        price: trade.price,
        total: trade.total,
        fee: trade.fee,
        timestamp: trade.timestamp.toISOString(),
        status: trade.status,
        profit_loss: profitLoss,
        market_condition: 'sideways' // This would be determined by market analysis
      }
    };
  }

  static bitcoinDataToDocument(data: BitcoinData): BitcoinDataDocument {
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (data.changePercentage24h > 2) trend = 'up';
    else if (data.changePercentage24h < -2) trend = 'down';

    return {
      id: data.id,
      document: JSON.stringify(data),
      metadata: {
        timestamp: data.timestamp.toISOString(),
        price: data.price,
        volume: data.volume,
        market_cap: data.marketCap,
        change_24h: data.change24h,
        change_percentage_24h: data.changePercentage24h,
        high_24h: data.high24h,
        low_24h: data.low24h,
        source: data.source,
        volatility: data.volatility,
        trend,
        time_period: '1h' // Default time period
      }
    };
  }

  static educationalContentToDocument(content: EducationalContent): EducationalContentDocument {
    return {
      id: content.id,
      document: JSON.stringify(content),
      metadata: {
        content_id: content.id,
        title: content.title,
        content_type: content.contentType,
        category: content.category,
        difficulty_level: content.difficultyLevel,
        estimated_read_time: content.estimatedReadTime,
        tags: content.tags,
        created_at: content.createdAt.toISOString(),
        updated_at: content.updatedAt.toISOString(),
        author: content.author,
        is_published: content.isPublished,
        view_count: 0,
        rating: 0
      }
    };
  }
}

// Collection names constants
export const COLLECTION_NAMES = {
  BITCOIN_HISTORICAL_DATA: 'bitcoin_historical_data',
  USER_PORTFOLIOS: 'user_portfolios', 
  GAME_ACHIEVEMENTS: 'game_achievements',
  MARKET_ANALYSIS: 'market_analysis',
  EDUCATIONAL_CONTENT: 'educational_content',
  USER_PROGRESS: 'user_progress',
  GAME_SESSIONS: 'game_sessions',
  TRADES: 'trades'
} as const;