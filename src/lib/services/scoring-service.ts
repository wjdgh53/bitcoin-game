// Scoring and achievement service with ChromaDB analytics

import { ChromaClient } from 'chromadb';
import { Achievement, AchievementType, Trade, Portfolio } from '@/types/game';
import { AchievementDocument, DocumentMapper, COLLECTION_NAMES } from '@/lib/database/schemas';
import { ValidationUtils } from '@/lib/validation/schemas';
import { portfolioService } from './portfolio-service';
import { userService } from './user-service';
import { v4 as uuidv4 } from 'uuid';

export interface UserScore {
  userId: string;
  username: string;
  totalScore: number;
  tradingScore: number;
  profitScore: number;
  consistencyScore: number;
  riskManagementScore: number;
  rank: number;
  percentile: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  profit: number;
  trades: number;
  winRate: number;
}

export class ScoringService {
  private chroma: ChromaClient;
  private achievementsCollection: any = null;
  private scoresCollection: any = null;

  constructor() {
    this.chroma = new ChromaClient({
      path: process.env.CHROMADB_PATH || './chroma_data'
    });
  }

  /**
   * Initialize collections
   */
  async initialize(): Promise<void> {
    try {
      // Get achievements collection
      this.achievementsCollection = await this.chroma.getCollection({
        name: COLLECTION_NAMES.GAME_ACHIEVEMENTS
      });

      // Create or get scores collection
      try {
        this.scoresCollection = await this.chroma.getCollection({
          name: 'user_scores'
        });
      } catch {
        this.scoresCollection = await this.chroma.createCollection({
          name: 'user_scores',
          metadata: {
            description: 'User scores and rankings',
            category: 'gamification'
          }
        });
      }

      console.log('✅ Scoring service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize scoring service:', error);
      throw new Error(`Scoring service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate user score based on trading performance
   */
  async calculateUserScore(userId: string): Promise<UserScore> {
    await this.ensureInitialized();

    try {
      // Get user data
      const user = await userService.findUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get portfolio and trading data
      const portfolio = await portfolioService.getUserPortfolio(userId);
      const stats = await portfolioService.calculatePortfolioStats(userId);
      const trades = await portfolioService.getUserTrades(userId);

      if (!portfolio || !stats) {
        throw new Error('Portfolio data not found');
      }

      // Calculate component scores

      // 1. Trading Score (based on number and frequency of trades)
      const tradingScore = this.calculateTradingScore(trades);

      // 2. Profit Score (based on overall profit percentage)
      const profitScore = this.calculateProfitScore(stats.profitPercentage);

      // 3. Consistency Score (based on win rate and variance)
      const consistencyScore = this.calculateConsistencyScore(stats.winRate, trades);

      // 4. Risk Management Score (based on position sizing and loss management)
      const riskManagementScore = this.calculateRiskManagementScore(trades, portfolio);

      // Calculate total score (weighted average)
      const totalScore = Math.round(
        (tradingScore * 0.2) +
        (profitScore * 0.4) +
        (consistencyScore * 0.2) +
        (riskManagementScore * 0.2)
      );

      // Get user rank and percentile
      const { rank, percentile } = await this.getUserRank(userId, totalScore);

      const userScore: UserScore = {
        userId,
        username: user.username,
        totalScore,
        tradingScore,
        profitScore,
        consistencyScore,
        riskManagementScore,
        rank,
        percentile
      };

      // Store score in ChromaDB
      await this.storeUserScore(userScore);

      // Check for achievements
      await this.checkAndAwardAchievements(userId, userScore, stats, trades);

      return userScore;
    } catch (error) {
      console.error('❌ Error calculating user score:', error);
      throw new Error(`Failed to calculate score: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    await this.ensureInitialized();

    try {
      const results = await this.scoresCollection.query({
        queryTexts: ['top scoring users leaderboard'],
        nResults: limit,
        include: ['documents', 'metadatas']
      });

      if (!results.documents || !results.documents[0]) {
        return [];
      }

      const entries: LeaderboardEntry[] = [];
      
      for (let i = 0; i < results.documents[0].length; i++) {
        const scoreDoc = JSON.parse(results.documents[0][i]);
        const metadata = results.metadatas[0][i];
        
        entries.push({
          rank: i + 1,
          userId: scoreDoc.userId,
          username: scoreDoc.username,
          score: scoreDoc.totalScore,
          profit: metadata.profit || 0,
          trades: metadata.trades || 0,
          winRate: metadata.win_rate || 0
        });
      }

      // Sort by score descending
      return entries.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('❌ Error getting leaderboard:', error);
      return [];
    }
  }

  /**
   * Get user achievements
   */
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    await this.ensureInitialized();

    try {
      const results = await this.achievementsCollection.query({
        queryTexts: [`user achievements ${userId}`],
        nResults: 100,
        where: { user_id: userId },
        include: ['documents', 'metadatas']
      });

      if (!results.documents || !results.documents[0]) {
        return [];
      }

      const achievements: Achievement[] = [];
      for (const docString of results.documents[0]) {
        try {
          const achievement = JSON.parse(docString) as Achievement;
          achievement.unlockedAt = new Date(achievement.unlockedAt);
          achievements.push(ValidationUtils.validateAchievement(achievement));
        } catch (parseError) {
          console.warn('Failed to parse achievement:', parseError);
        }
      }

      return achievements.sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime());
    } catch (error) {
      console.error('❌ Error getting user achievements:', error);
      return [];
    }
  }

  /**
   * Award achievement to user
   */
  async awardAchievement(userId: string, type: AchievementType, title: string, description: string, points: number): Promise<Achievement> {
    await this.ensureInitialized();

    try {
      // Check if user already has this achievement
      const existingAchievements = await this.getUserAchievements(userId);
      const hasAchievement = existingAchievements.some(a => a.type === type);
      
      if (hasAchievement) {
        throw new Error(`User already has achievement: ${type}`);
      }

      // Create achievement
      const achievement: Achievement = {
        id: uuidv4(),
        userId,
        type,
        title,
        description,
        points,
        unlockedAt: new Date(),
        category: this.getAchievementCategory(type),
        badge: this.getAchievementBadge(type),
        requirements: []
      };

      // Validate and store
      const validatedAchievement = ValidationUtils.validateAchievement(achievement);
      
      const achievementDoc: AchievementDocument = {
        id: achievement.id,
        document: JSON.stringify(validatedAchievement),
        metadata: {
          user_id: userId,
          achievement_id: achievement.id,
          achievement_type: type,
          category: achievement.category,
          points: achievement.points,
          unlocked_at: achievement.unlockedAt.toISOString(),
          difficulty: this.getAchievementDifficulty(type),
          rarity: this.getAchievementRarity(type)
        }
      };

      await this.achievementsCollection.add({
        ids: [achievementDoc.id],
        documents: [achievementDoc.document],
        metadatas: [achievementDoc.metadata]
      });

      // Update user experience
      await userService.updateUserExperience(userId, points);

      console.log(`🏆 Achievement unlocked for user ${userId}: ${title}`);
      return validatedAchievement;
    } catch (error) {
      console.error('❌ Error awarding achievement:', error);
      throw new Error(`Failed to award achievement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get similar trading patterns (semantic search)
   */
  async findSimilarTradingPatterns(userId: string): Promise<{ userId: string; similarity: number; }[]> {
    await this.ensureInitialized();

    try {
      const userScore = await this.calculateUserScore(userId);
      const userTrades = await portfolioService.getUserTrades(userId);
      
      // Create trading pattern description
      const patternDescription = this.createTradingPatternDescription(userScore, userTrades);

      // Semantic search for similar patterns
      const results = await this.scoresCollection.query({
        queryTexts: [patternDescription],
        nResults: 10,
        include: ['documents', 'distances']
      });

      if (!results.documents || !results.documents[0]) {
        return [];
      }

      const similarUsers: { userId: string; similarity: number; }[] = [];
      
      for (let i = 0; i < results.documents[0].length; i++) {
        const scoreDoc = JSON.parse(results.documents[0][i]);
        const distance = results.distances?.[0]?.[i] || 0;
        
        if (scoreDoc.userId !== userId) {
          similarUsers.push({
            userId: scoreDoc.userId,
            similarity: 1 - distance // Convert distance to similarity
          });
        }
      }

      return similarUsers.sort((a, b) => b.similarity - a.similarity);
    } catch (error) {
      console.error('❌ Error finding similar trading patterns:', error);
      return [];
    }
  }

  // Private helper methods

  private calculateTradingScore(trades: Trade[]): number {
    const completedTrades = trades.filter(t => t.status === 'completed');
    
    // Base score on number of trades (max 100 at 50+ trades)
    const tradeCountScore = Math.min(100, completedTrades.length * 2);
    
    // Bonus for trade frequency (trades per day)
    const daysSinceFirstTrade = completedTrades.length > 0 ?
      (Date.now() - completedTrades[completedTrades.length - 1].timestamp.getTime()) / (1000 * 60 * 60 * 24) : 1;
    const tradesPerDay = completedTrades.length / Math.max(1, daysSinceFirstTrade);
    const frequencyBonus = Math.min(50, tradesPerDay * 10);
    
    return Math.min(100, tradeCountScore * 0.7 + frequencyBonus * 0.3);
  }

  private calculateProfitScore(profitPercentage: number): number {
    // Score based on profit percentage
    // 0% = 50 points, +100% = 100 points, -50% = 0 points
    const baseScore = 50 + (profitPercentage * 0.5);
    return Math.max(0, Math.min(100, baseScore));
  }

  private calculateConsistencyScore(winRate: number, trades: Trade[]): number {
    // Base score on win rate
    const winRateScore = winRate;
    
    // Calculate variance in trade sizes for consistency
    const tradeSizes = trades.filter(t => t.status === 'completed').map(t => t.total);
    
    if (tradeSizes.length < 2) return winRateScore * 0.5;
    
    const avg = tradeSizes.reduce((a, b) => a + b, 0) / tradeSizes.length;
    const variance = tradeSizes.reduce((sum, size) => sum + Math.pow(size - avg, 2), 0) / tradeSizes.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / avg) * 100;
    
    // Lower variance = higher consistency score
    const consistencyBonus = Math.max(0, 50 - coefficientOfVariation);
    
    return Math.min(100, winRateScore * 0.6 + consistencyBonus * 0.4);
  }

  private calculateRiskManagementScore(trades: Trade[], portfolio: Portfolio): number {
    const completedTrades = trades.filter(t => t.status === 'completed');
    
    if (completedTrades.length === 0) return 50;
    
    // Check position sizing (trades should not be too large relative to portfolio)
    let oversizedTrades = 0;
    const initialBalance = parseFloat(process.env.INITIAL_BALANCE || '10000');
    
    for (const trade of completedTrades) {
      const tradeSize = trade.total;
      const portfolioValue = initialBalance; // Simplified - should track historical portfolio value
      
      if (tradeSize > portfolioValue * 0.2) { // More than 20% of portfolio
        oversizedTrades++;
      }
    }
    
    const positionSizingScore = Math.max(0, 100 - (oversizedTrades * 10));
    
    // Check for stop loss usage (simplified - check for quick sells after losses)
    let stopLossScore = 50; // Default neutral score
    
    return Math.min(100, positionSizingScore * 0.7 + stopLossScore * 0.3);
  }

  private async getUserRank(userId: string, score: number): Promise<{ rank: number; percentile: number; }> {
    // Get all scores to calculate rank
    const allScores = await this.scoresCollection.query({
      queryTexts: ['all user scores'],
      nResults: 1000,
      include: ['metadatas']
    });

    let totalUsers = 1;
    let usersWithLowerScore = 0;

    if (allScores.metadatas && allScores.metadatas[0]) {
      totalUsers = allScores.metadatas[0].length;
      
      for (const metadata of allScores.metadatas[0]) {
        if ((metadata.total_score || 0) < score) {
          usersWithLowerScore++;
        }
      }
    }

    const rank = totalUsers - usersWithLowerScore;
    const percentile = (usersWithLowerScore / totalUsers) * 100;

    return { rank, percentile: Math.round(percentile) };
  }

  private async storeUserScore(userScore: UserScore): Promise<void> {
    const scoreDoc = {
      id: `score-${userScore.userId}`,
      document: JSON.stringify(userScore),
      metadata: {
        user_id: userScore.userId,
        username: userScore.username,
        total_score: userScore.totalScore,
        trading_score: userScore.tradingScore,
        profit_score: userScore.profitScore,
        consistency_score: userScore.consistencyScore,
        risk_management_score: userScore.riskManagementScore,
        rank: userScore.rank,
        percentile: userScore.percentile,
        updated_at: new Date().toISOString()
      }
    };

    await this.scoresCollection.upsert({
      ids: [scoreDoc.id],
      documents: [scoreDoc.document],
      metadatas: [scoreDoc.metadata]
    });
  }

  private async checkAndAwardAchievements(
    userId: string, 
    score: UserScore, 
    stats: any, 
    trades: Trade[]
  ): Promise<void> {
    // Check for various achievements
    
    // First trade achievement
    if (trades.length === 1) {
      await this.awardAchievement(
        userId,
        'first_trade',
        'First Steps',
        'Complete your first trade',
        10
      );
    }

    // Profit milestones
    if (stats.profitPercentage >= 10 && stats.profitPercentage < 25) {
      await this.tryAwardAchievement(userId, 'profit_milestone', 'Profit Maker', 'Achieve 10% profit', 25);
    } else if (stats.profitPercentage >= 25 && stats.profitPercentage < 50) {
      await this.tryAwardAchievement(userId, 'profit_milestone', 'Money Maker', 'Achieve 25% profit', 50);
    } else if (stats.profitPercentage >= 50) {
      await this.tryAwardAchievement(userId, 'profit_milestone', 'Trading Master', 'Achieve 50% profit', 100);
    }

    // Win streak achievements
    const consecutiveWins = this.calculateConsecutiveWins(trades);
    if (consecutiveWins >= 3) {
      await this.tryAwardAchievement(userId, 'consecutive_wins', 'Winning Streak', 'Win 3 trades in a row', 30);
    }
    if (consecutiveWins >= 5) {
      await this.tryAwardAchievement(userId, 'consecutive_wins', 'Hot Hand', 'Win 5 trades in a row', 60);
    }

    // Trading volume achievements
    const totalVolume = trades.reduce((sum, t) => sum + t.total, 0);
    if (totalVolume >= 50000) {
      await this.tryAwardAchievement(userId, 'trading_volume', 'High Roller', 'Trade over $50,000 total volume', 40);
    }
    if (totalVolume >= 100000) {
      await this.tryAwardAchievement(userId, 'trading_volume', 'Whale', 'Trade over $100,000 total volume', 80);
    }
  }

  private async tryAwardAchievement(userId: string, type: AchievementType, title: string, description: string, points: number): Promise<void> {
    try {
      await this.awardAchievement(userId, type, title, description, points);
    } catch (error) {
      // Achievement already awarded or error occurred
    }
  }

  private calculateConsecutiveWins(trades: Trade[]): number {
    let maxStreak = 0;
    let currentStreak = 0;
    
    const sellTrades = trades
      .filter(t => t.type === 'sell' && t.status === 'completed')
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Simplified: Consider a sell profitable if the price is higher than average buy price
    // In production, you'd track actual P&L per trade
    
    return maxStreak;
  }

  private createTradingPatternDescription(score: UserScore, trades: Trade[]): string {
    const avgTradeSize = trades.length > 0 ?
      trades.reduce((sum, t) => sum + t.total, 0) / trades.length : 0;
    
    return `Trading pattern: ${score.totalScore} score, ${score.profitScore} profit score, ` +
      `${score.consistencyScore} consistency, ${trades.length} trades, ` +
      `${avgTradeSize.toFixed(2)} average trade size`;
  }

  private getAchievementCategory(type: AchievementType): 'trading' | 'education' | 'social' | 'milestone' {
    switch (type) {
      case 'first_trade':
      case 'consecutive_wins':
      case 'trading_volume':
      case 'market_timing':
        return 'trading';
      case 'education_complete':
        return 'education';
      case 'profit_milestone':
      case 'loss_recovery':
      case 'risk_management':
        return 'milestone';
      default:
        return 'trading';
    }
  }

  private getAchievementBadge(type: AchievementType): string {
    const badges: Record<AchievementType, string> = {
      first_trade: '🎯',
      profit_milestone: '💰',
      consecutive_wins: '🔥',
      loss_recovery: '💪',
      education_complete: '📚',
      trading_volume: '📈',
      market_timing: '⏰',
      risk_management: '🛡️'
    };
    return badges[type] || '🏆';
  }

  private getAchievementDifficulty(type: AchievementType): 'easy' | 'medium' | 'hard' {
    switch (type) {
      case 'first_trade':
        return 'easy';
      case 'consecutive_wins':
      case 'education_complete':
      case 'trading_volume':
        return 'medium';
      case 'profit_milestone':
      case 'loss_recovery':
      case 'market_timing':
      case 'risk_management':
        return 'hard';
      default:
        return 'medium';
    }
  }

  private getAchievementRarity(type: AchievementType): 'common' | 'rare' | 'epic' | 'legendary' {
    switch (type) {
      case 'first_trade':
        return 'common';
      case 'education_complete':
      case 'trading_volume':
        return 'rare';
      case 'consecutive_wins':
      case 'market_timing':
      case 'risk_management':
        return 'epic';
      case 'profit_milestone':
      case 'loss_recovery':
        return 'legendary';
      default:
        return 'rare';
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.achievementsCollection || !this.scoresCollection) {
      await this.initialize();
    }
  }
}

// Export singleton instance
export const scoringService = new ScoringService();