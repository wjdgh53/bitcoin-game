// Zod validation schemas for Bitcoin trading game

import { z } from 'zod';

// User validation schemas
export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark']),
  notifications: z.boolean(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  chartType: z.enum(['candlestick', 'line', 'area'])
});

export const UserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long'),
  createdAt: z.date(),
  gameLevel: z.number().int().min(1).max(100),
  totalTrades: z.number().int().min(0),
  experience: z.number().int().min(0),
  preferences: UserPreferencesSchema
});

// Portfolio validation schemas  
export const TradeSchema = z.object({
  id: z.string().min(1, 'Trade ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  portfolioId: z.string().min(1, 'Portfolio ID is required'),
  type: z.enum(['buy', 'sell']),
  amount: z.number().positive('Amount must be positive'),
  price: z.number().positive('Price must be positive'),
  total: z.number().positive('Total must be positive'),
  fee: z.number().min(0, 'Fee cannot be negative'),
  timestamp: z.date(),
  status: z.enum(['pending', 'completed', 'failed']),
  reason: z.string().optional()
});

export const PortfolioSchema = z.object({
  id: z.string().min(1, 'Portfolio ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  balance: z.number().min(0, 'Balance cannot be negative'),
  bitcoinHoldings: z.number().min(0, 'Holdings cannot be negative'),
  totalValue: z.number().min(0, 'Total value cannot be negative'),
  profit: z.number(),
  profitPercentage: z.number(),
  trades: z.array(TradeSchema),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Achievement validation schemas
export const AchievementRequirementSchema = z.object({
  metric: z.string().min(1),
  operator: z.enum(['>=', '<=', '==', '>']),
  value: z.union([z.number(), z.string()])
});

export const AchievementSchema = z.object({
  id: z.string().min(1, 'Achievement ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  type: z.enum([
    'first_trade', 
    'profit_milestone', 
    'consecutive_wins', 
    'loss_recovery', 
    'education_complete', 
    'trading_volume',
    'market_timing',
    'risk_management'
  ]),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  points: z.number().int().positive('Points must be positive'),
  unlockedAt: z.date(),
  category: z.enum(['trading', 'education', 'social', 'milestone']),
  badge: z.string().min(1, 'Badge is required'),
  requirements: z.array(AchievementRequirementSchema)
});

// Bitcoin data validation schemas
export const BitcoinDataSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  timestamp: z.date(),
  price: z.number().positive('Price must be positive'),
  volume: z.number().min(0, 'Volume cannot be negative'),
  marketCap: z.number().positive('Market cap must be positive'),
  change24h: z.number(),
  changePercentage24h: z.number(),
  high24h: z.number().positive('High must be positive'),
  low24h: z.number().positive('Low must be positive'),
  source: z.string().min(1, 'Source is required'),
  volatility: z.number().min(0, 'Volatility cannot be negative')
});

// Technical indicators validation
export const TechnicalIndicatorsSchema = z.object({
  rsi: z.number().min(0).max(100, 'RSI must be between 0 and 100'),
  sma20: z.number().positive('SMA20 must be positive'),
  sma50: z.number().positive('SMA50 must be positive'),
  ema12: z.number().positive('EMA12 must be positive'),
  ema26: z.number().positive('EMA26 must be positive'),
  macd: z.number(),
  bollingerUpper: z.number().positive('Bollinger upper must be positive'),
  bollingerLower: z.number().positive('Bollinger lower must be positive'),
  support: z.number().positive('Support must be positive'),
  resistance: z.number().positive('Resistance must be positive')
});

export const MarketSentimentSchema = z.object({
  score: z.number().min(-1, 'Sentiment score must be >= -1').max(1, 'Sentiment score must be <= 1'),
  label: z.enum(['bearish', 'neutral', 'bullish']),
  newsCount: z.number().int().min(0, 'News count cannot be negative'),
  socialMediaMentions: z.number().int().min(0, 'Social media mentions cannot be negative'),
  fearGreedIndex: z.number().min(0).max(100, 'Fear & Greed Index must be between 0 and 100')
});

export const PricePredictionSchema = z.object({
  shortTerm: z.number().positive('Short term prediction must be positive'),
  mediumTerm: z.number().positive('Medium term prediction must be positive'),
  longTerm: z.number().positive('Long term prediction must be positive'),
  confidence: z.object({
    shortTerm: z.number().min(0).max(1, 'Confidence must be between 0 and 1'),
    mediumTerm: z.number().min(0).max(1, 'Confidence must be between 0 and 1'),
    longTerm: z.number().min(0).max(1, 'Confidence must be between 0 and 1')
  })
});

export const MarketAnalysisSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  timestamp: z.date(),
  price: z.number().positive('Price must be positive'),
  indicators: TechnicalIndicatorsSchema,
  sentiment: MarketSentimentSchema,
  prediction: PricePredictionSchema,
  confidence: z.number().min(0).max(1, 'Confidence must be between 0 and 1')
});

// Educational content validation
export const EducationalContentSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
  content: z.string().min(1, 'Content is required'),
  contentType: z.enum(['article', 'tutorial', 'video', 'quiz']),
  category: z.enum(['basics', 'technical_analysis', 'risk_management', 'psychology', 'advanced_strategies', 'market_fundamentals']),
  difficultyLevel: z.number().int().min(1).max(5, 'Difficulty level must be between 1 and 5'),
  estimatedReadTime: z.number().int().positive('Estimated read time must be positive'),
  prerequisites: z.array(z.string()),
  tags: z.array(z.string().min(1, 'Tag cannot be empty')),
  createdAt: z.date(),
  updatedAt: z.date(),
  author: z.string().min(1, 'Author is required'),
  isPublished: z.boolean()
});

export const UserProgressSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  contentId: z.string().min(1, 'Content ID is required'),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  progress: z.number().min(0).max(100, 'Progress must be between 0 and 100'),
  timeSpent: z.number().min(0, 'Time spent cannot be negative'),
  lastAccessed: z.date(),
  quizScores: z.array(z.number().min(0).max(100)),
  notes: z.string().max(2000, 'Notes too long')
});

// Game session validation
export const GameSessionSchema = z.object({
  id: z.string().min(1, 'Session ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  startTime: z.date(),
  endTime: z.date().optional(),
  initialBalance: z.number().positive('Initial balance must be positive'),
  finalBalance: z.number().min(0, 'Final balance cannot be negative'),
  tradesCount: z.number().int().min(0, 'Trades count cannot be negative'),
  performance: z.number(),
  achievements: z.array(z.string()),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  mode: z.enum(['tutorial', 'practice', 'competitive'])
});

// Input validation schemas for API endpoints
export const CreateTradeInputSchema = z.object({
  type: z.enum(['buy', 'sell']),
  amount: z.number().positive('Amount must be positive'),
  price: z.number().positive('Price must be positive').optional() // Optional for market orders
});

export const UpdatePortfolioInputSchema = z.object({
  balance: z.number().min(0, 'Balance cannot be negative').optional(),
  bitcoinHoldings: z.number().min(0, 'Holdings cannot be negative').optional()
});

export const CreateUserInputSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long'),
  preferences: UserPreferencesSchema.optional()
});

export const UpdateUserInputSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  preferences: UserPreferencesSchema.optional()
});

// Validation utility functions
export class ValidationUtils {
  static validateUser(data: unknown) {
    return UserSchema.parse(data);
  }

  static validatePortfolio(data: unknown) {
    return PortfolioSchema.parse(data);
  }

  static validateTrade(data: unknown) {
    return TradeSchema.parse(data);
  }

  static validateAchievement(data: unknown) {
    return AchievementSchema.parse(data);
  }

  static validateBitcoinData(data: unknown) {
    return BitcoinDataSchema.parse(data);
  }

  static validateMarketAnalysis(data: unknown) {
    return MarketAnalysisSchema.parse(data);
  }

  static validateEducationalContent(data: unknown) {
    return EducationalContentSchema.parse(data);
  }

  static validateGameSession(data: unknown) {
    return GameSessionSchema.parse(data);
  }

  // Safe parsing that returns validation result instead of throwing
  static safeValidateUser(data: unknown) {
    return UserSchema.safeParse(data);
  }

  static safeValidatePortfolio(data: unknown) {
    return PortfolioSchema.safeParse(data);
  }

  static safeValidateTrade(data: unknown) {
    return TradeSchema.safeParse(data);
  }

  static safeValidateBitcoinData(data: unknown) {
    return BitcoinDataSchema.safeParse(data);
  }

  // API input validation helpers
  static validateCreateTradeInput(data: unknown) {
    return CreateTradeInputSchema.parse(data);
  }

  static validateCreateUserInput(data: unknown) {
    return CreateUserInputSchema.parse(data);
  }

  static validateUpdateUserInput(data: unknown) {
    return UpdateUserInputSchema.parse(data);
  }

  static validateUpdatePortfolioInput(data: unknown) {
    return UpdatePortfolioInputSchema.parse(data);
  }
}

// Error handling utilities
export function formatValidationError(error: z.ZodError): string {
  const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
  return errors.join(', ');
}

export function isValidationError(error: unknown): error is z.ZodError {
  return error instanceof z.ZodError;
}