// Core game data types for Bitcoin trading game

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  gameLevel: number;
  totalTrades: number;
  experience: number;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  chartType: 'candlestick' | 'line' | 'area';
}

export interface Portfolio {
  id: string;
  userId: string;
  balance: number;
  bitcoinHoldings: number;
  totalValue: number;
  profit: number;
  profitPercentage: number;
  trades: Trade[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Trade {
  id: string;
  userId: string;
  portfolioId: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
  fee: number;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  reason?: string;
}

export interface Achievement {
  id: string;
  userId: string;
  type: AchievementType;
  title: string;
  description: string;
  points: number;
  unlockedAt: Date;
  category: AchievementCategory;
  badge: string;
  requirements: AchievementRequirement[];
}

export type AchievementType = 
  | 'first_trade' 
  | 'profit_milestone' 
  | 'consecutive_wins' 
  | 'loss_recovery' 
  | 'education_complete' 
  | 'trading_volume'
  | 'market_timing'
  | 'risk_management';

export type AchievementCategory = 'trading' | 'education' | 'social' | 'milestone';

export interface AchievementRequirement {
  metric: string;
  operator: '>=' | '<=' | '==' | '>';
  value: number | string;
}

export interface BitcoinData {
  id: string;
  timestamp: Date;
  price: number;
  volume: number;
  marketCap: number;
  change24h: number;
  changePercentage24h: number;
  high24h: number;
  low24h: number;
  source: string;
  volatility: number;
}

export interface MarketAnalysis {
  id: string;
  timestamp: Date;
  price: number;
  indicators: TechnicalIndicators;
  sentiment: MarketSentiment;
  prediction: PricePrediction;
  confidence: number;
}

export interface TechnicalIndicators {
  rsi: number;
  sma20: number;
  sma50: number;
  ema12: number;
  ema26: number;
  macd: number;
  bollingerUpper: number;
  bollingerLower: number;
  support: number;
  resistance: number;
}

export interface MarketSentiment {
  score: number; // -1 to 1
  label: 'bearish' | 'neutral' | 'bullish';
  newsCount: number;
  socialMediaMentions: number;
  fearGreedIndex: number;
}

export interface PricePrediction {
  shortTerm: number; // 1 hour
  mediumTerm: number; // 24 hours  
  longTerm: number; // 7 days
  confidence: {
    shortTerm: number;
    mediumTerm: number;
    longTerm: number;
  };
}

export interface EducationalContent {
  id: string;
  title: string;
  description: string;
  content: string;
  contentType: 'article' | 'tutorial' | 'video' | 'quiz';
  category: EducationCategory;
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  estimatedReadTime: number;
  prerequisites: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  author: string;
  isPublished: boolean;
}

export type EducationCategory = 
  | 'basics' 
  | 'technical_analysis' 
  | 'risk_management' 
  | 'psychology' 
  | 'advanced_strategies'
  | 'market_fundamentals';

export interface UserProgress {
  userId: string;
  contentId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number; // 0-100
  timeSpent: number; // minutes
  lastAccessed: Date;
  quizScores: number[];
  notes: string;
}

// Game-specific types
export interface GameSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  initialBalance: number;
  finalBalance: number;
  tradesCount: number;
  performance: number;
  achievements: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  mode: 'tutorial' | 'practice' | 'competitive';
}

// Agent-specific types
export interface Agent {
  id: string;
  name: string;
  type: string;
  personality: AgentPersonality;
  strategy: string[]; // Trading strategies
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  patterns: Pattern[];
  watchlistItems: AgentWatchlistItem[];
}

export type AgentPersonality = 
  | 'conservative' 
  | 'aggressive' 
  | 'balanced' 
  | 'quantitative' 
  | 'contrarian';

export interface Pattern {
  id: string;
  agentId: string;
  name: string;
  description: string;
  priority: number; // 1 = highest priority, 10 = lowest
  confidenceRate: number; // 0-100%
  examples: string[]; // Array of pattern examples
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentWatchlistItem {
  id: string;
  agentId: string;
  symbol: string; // e.g., 'BTC', 'ETH'
  name: string; // e.g., 'Bitcoin', 'Ethereum'
  category: WatchlistCategory;
  reason: string; // Why the agent is interested in this asset
  agentView: string; // Agent's perspective/prediction on the asset
  alertPrice?: number; // Price threshold for alerts
  alertType?: 'above' | 'below' | 'both';
  isActive: boolean;
  addedAt: Date;
  lastReviewedAt: Date;
  updatedAt: Date;
}

export type WatchlistCategory = 
  | '장기투자' 
  | '단기트레이딩' 
  | '모멘텀' 
  | '가치투자' 
  | '성장주' 
  | '배당주' 
  | '투기적투자' 
  | '안전자산'
  | '대체투자';

export interface PatternPerformance {
  patternId: string;
  successCount: number;
  failureCount: number;
  totalTrades: number;
  averageReturn: number;
  winRate: number;
  lastUpdated: Date;
}

export interface AgentInteraction {
  id: string;
  agentId: string;
  userId: string;
  type: 'question' | 'feedback' | 'suggestion';
  content: string;
  response?: string;
  relatedPatternId?: string;
  relatedWatchlistItemId?: string;
  createdAt: Date;
  responseAt?: Date;
}

export interface ChatMessage {
  id: string;
  agentId: string;
  userId: string;
  content: string;
  type: 'user' | 'agent' | 'system';
  metadata: string; // JSON string
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  agent?: Agent;
}

export interface ParsedCommand {
  type: 'strategy' | 'pattern' | 'watchlist' | 'info' | 'general';
  action: 'add' | 'remove' | 'update' | 'list' | 'help' | 'none';
  parameters: Record<string, any>;
  confidence: number;
  originalMessage: string;
}