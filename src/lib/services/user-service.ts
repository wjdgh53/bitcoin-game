// User service with ChromaDB integration

import { ChromaClient } from 'chromadb';
import bcrypt from 'bcryptjs';
import { User, UserPreferences, Portfolio } from '@/types/game';
import { UserDocument, PortfolioDocument, DocumentMapper, COLLECTION_NAMES } from '@/lib/database/schemas';
import { ValidationUtils, CreateUserInputSchema } from '@/lib/validation/schemas';
import { v4 as uuidv4 } from 'uuid';

export class UserService {
  private chroma: ChromaClient;
  private userCollection: any = null;
  private portfolioCollection: any = null;

  constructor() {
    this.chroma = new ChromaClient();
  }

  /**
   * Initialize collections
   */
  async initialize(): Promise<void> {
    try {
      // Get or create user profiles collection
      try {
        this.userCollection = await this.chroma.getCollection({
          name: 'user_profiles'
        });
      } catch {
        this.userCollection = await this.chroma.createCollection({
          name: 'user_profiles',
          metadata: {
            description: 'User profiles and authentication data',
            category: 'user_data'
          }
        });
      }

      // Get existing portfolio collection
      this.portfolioCollection = await this.chroma.getCollection({
        name: COLLECTION_NAMES.USER_PORTFOLIOS
      });

      console.log('✅ User service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize user service:', error);
      throw new Error(`User service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new user
   */
  async createUser(email: string, username: string, hashedPassword: string): Promise<User> {
    await this.ensureInitialized();

    try {
      // Check if user already exists
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const existingUsername = await this.findUserByUsername(username);
      if (existingUsername) {
        throw new Error('Username is already taken');
      }

      // Create new user
      const user: User = {
        id: uuidv4(),
        email,
        username,
        createdAt: new Date(),
        gameLevel: 1,
        totalTrades: 0,
        experience: 0,
        preferences: {
          theme: 'light',
          notifications: true,
          difficulty: 'medium',
          chartType: 'candlestick'
        }
      };

      // Validate user data
      const validatedUser = ValidationUtils.validateUser(user);

      // Store user with password hash in metadata
      const userDoc: UserDocument = {
        id: user.id,
        document: JSON.stringify(validatedUser),
        metadata: {
          user_id: user.id,
          email: user.email,
          username: user.username,
          created_at: user.createdAt.toISOString(),
          game_level: user.gameLevel,
          total_trades: user.totalTrades,
          experience: user.experience,
          status: 'active',
          password_hash: hashedPassword // Store password hash in metadata for auth
        }
      };

      await this.userCollection.add({
        ids: [userDoc.id],
        documents: [userDoc.document],
        metadatas: [userDoc.metadata]
      });

      // Create initial portfolio for the user
      await this.createInitialPortfolio(user.id);

      console.log(`✅ User created successfully: ${username}`);
      return validatedUser;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    await this.ensureInitialized();

    try {
      const results = await this.userCollection.query({
        queryTexts: [`user email ${email}`],
        nResults: 1,
        where: { email },
        include: ['documents', 'metadatas']
      });

      if (!results.documents || !results.documents[0] || results.documents[0].length === 0) {
        return null;
      }

      const userDoc = JSON.parse(results.documents[0][0]) as User;
      userDoc.createdAt = new Date(userDoc.createdAt);
      
      return ValidationUtils.validateUser(userDoc);
    } catch (error) {
      console.error('❌ Error finding user by email:', error);
      return null;
    }
  }

  /**
   * Find user by username
   */
  async findUserByUsername(username: string): Promise<User | null> {
    await this.ensureInitialized();

    try {
      const results = await this.userCollection.query({
        queryTexts: [`username ${username}`],
        nResults: 1,
        where: { username },
        include: ['documents', 'metadatas']
      });

      if (!results.documents || !results.documents[0] || results.documents[0].length === 0) {
        return null;
      }

      const userDoc = JSON.parse(results.documents[0][0]) as User;
      userDoc.createdAt = new Date(userDoc.createdAt);
      
      return ValidationUtils.validateUser(userDoc);
    } catch (error) {
      console.error('❌ Error finding user by username:', error);
      return null;
    }
  }

  /**
   * Find user by ID
   */
  async findUserById(userId: string): Promise<User | null> {
    await this.ensureInitialized();

    try {
      const results = await this.userCollection.get({
        ids: [userId],
        include: ['documents', 'metadatas']
      });

      if (!results.documents || results.documents.length === 0) {
        return null;
      }

      const userDoc = JSON.parse(results.documents[0]) as User;
      userDoc.createdAt = new Date(userDoc.createdAt);
      
      return ValidationUtils.validateUser(userDoc);
    } catch (error) {
      console.error('❌ Error finding user by ID:', error);
      return null;
    }
  }

  /**
   * Get user's password hash for authentication
   */
  async getUserPasswordHash(email: string): Promise<string | null> {
    await this.ensureInitialized();

    try {
      const results = await this.userCollection.query({
        queryTexts: [`user email ${email}`],
        nResults: 1,
        where: { email },
        include: ['metadatas']
      });

      if (!results.metadatas || !results.metadatas[0] || results.metadatas[0].length === 0) {
        return null;
      }

      return results.metadatas[0][0].password_hash || null;
    } catch (error) {
      console.error('❌ Error getting user password hash:', error);
      return null;
    }
  }

  /**
   * Validate user password
   */
  async validatePassword(email: string, password: string): Promise<boolean> {
    const passwordHash = await this.getUserPasswordHash(email);
    if (!passwordHash) {
      return false;
    }

    return bcrypt.compare(password, passwordHash);
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    await this.ensureInitialized();

    try {
      const existingUser = await this.findUserById(userId);
      if (!existingUser) {
        throw new Error('User not found');
      }

      // Merge updates with existing user
      const updatedUser: User = {
        ...existingUser,
        ...updates,
        id: existingUser.id, // Ensure ID doesn't change
        createdAt: existingUser.createdAt // Ensure creation date doesn't change
      };

      // Validate updated user
      const validatedUser = ValidationUtils.validateUser(updatedUser);

      // Update in ChromaDB
      const userDoc = DocumentMapper.userToDocument(validatedUser);
      
      await this.userCollection.update({
        ids: [userId],
        documents: [userDoc.document],
        metadatas: [userDoc.metadata]
      });

      console.log(`✅ User updated successfully: ${userId}`);
      return validatedUser;
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user experience and level
   */
  async updateUserExperience(userId: string, experienceGained: number): Promise<User | null> {
    await this.ensureInitialized();

    try {
      const user = await this.findUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Calculate new experience and level
      const newExperience = user.experience + experienceGained;
      const newLevel = Math.floor(newExperience / 1000) + 1; // Level up every 1000 XP

      return await this.updateUser(userId, {
        experience: newExperience,
        gameLevel: newLevel
      });
    } catch (error) {
      console.error('❌ Error updating user experience:', error);
      return null;
    }
  }

  /**
   * Create initial portfolio for new user
   */
  private async createInitialPortfolio(userId: string): Promise<void> {
    try {
      const initialBalance = parseFloat(process.env.INITIAL_BALANCE || '10000');
      
      const portfolio: Portfolio = {
        id: uuidv4(),
        userId,
        balance: initialBalance,
        bitcoinHoldings: 0,
        totalValue: initialBalance,
        profit: 0,
        profitPercentage: 0,
        trades: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const portfolioDoc = DocumentMapper.portfolioToDocument(portfolio);
      
      await this.portfolioCollection.add({
        ids: [portfolioDoc.id],
        documents: [portfolioDoc.document],
        metadatas: [portfolioDoc.metadata]
      });

      console.log(`✅ Initial portfolio created for user: ${userId}`);
    } catch (error) {
      console.error('❌ Error creating initial portfolio:', error);
      throw new Error(`Failed to create initial portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<any> {
    await this.ensureInitialized();

    try {
      const user = await this.findUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get portfolio data
      const portfolioResults = await this.portfolioCollection.query({
        queryTexts: [`user portfolio ${userId}`],
        nResults: 1,
        where: { user_id: userId },
        include: ['metadatas']
      });

      const portfolioMeta = portfolioResults.metadatas?.[0]?.[0] || {};

      return {
        userId: user.id,
        username: user.username,
        gameLevel: user.gameLevel,
        experience: user.experience,
        totalTrades: user.totalTrades,
        portfolio: {
          balance: portfolioMeta.balance || 0,
          bitcoinHoldings: portfolioMeta.bitcoin_holdings || 0,
          totalValue: portfolioMeta.total_value || 0,
          profit: portfolioMeta.profit || 0,
          profitPercentage: portfolioMeta.profit_percentage || 0
        },
        memberSince: user.createdAt
      };
    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      throw new Error(`Failed to get user stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete user (for testing or GDPR compliance)
   */
  async deleteUser(userId: string): Promise<boolean> {
    await this.ensureInitialized();

    try {
      // Delete user document
      await this.userCollection.delete({
        ids: [userId]
      });

      // Delete user's portfolio
      const portfolioResults = await this.portfolioCollection.query({
        queryTexts: [`user portfolio ${userId}`],
        nResults: 10,
        where: { user_id: userId },
        include: ['metadatas']
      });

      if (portfolioResults.ids && portfolioResults.ids[0]) {
        await this.portfolioCollection.delete({
          ids: portfolioResults.ids[0]
        });
      }

      console.log(`✅ User deleted successfully: ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      return false;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.userCollection || !this.portfolioCollection) {
      await this.initialize();
    }
  }
}

// Export singleton instance
export const userService = new UserService();