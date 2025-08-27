/**
 * ChromaDB Client Configuration for Bitcoin Trading Game
 * 
 * This module provides a configured ChromaDB client for accessing
 * the game's persistent collections.
 */

import { ChromaClient, Collection } from 'chromadb';
import path from 'path';

// Initialize ChromaDB client with the persistent storage path
const CHROMA_DATA_PATH = path.join(process.cwd(), 'chroma_data');

// Create the ChromaDB client
let client: ChromaClient | null = null;

/**
 * Get or create the ChromaDB client instance
 * @returns Promise<ChromaClient>
 */
export async function getChromaClient(): Promise<ChromaClient> {
  if (!client) {
    try {
      // Initialize with default settings (in-memory for Node.js)
      client = new ChromaClient();
      
      console.log(`ChromaDB client initialized (in-memory)`);
    } catch (error) {
      console.error('Failed to initialize ChromaDB client:', error);
      throw error;
    }
  }
  
  return client;
}

/**
 * Collection names for the Bitcoin Trading Game
 */
export const COLLECTION_NAMES = {
  BITCOIN_HISTORICAL_DATA: 'bitcoin_historical_data',
  USER_PORTFOLIOS: 'user_portfolios',
  GAME_ACHIEVEMENTS: 'game_achievements',
  MARKET_ANALYSIS: 'market_analysis',
  EDUCATIONAL_CONTENT: 'educational_content'
} as const;

/**
 * Get a specific collection by name
 * @param collectionName - Name of the collection to retrieve
 * @returns Promise<Collection>
 */
export async function getCollection(collectionName: string): Promise<Collection> {
  const client = await getChromaClient();
  
  try {
    const collection = await client.getCollection({ name: collectionName });
    return collection;
  } catch (error) {
    console.error(`Failed to get collection '${collectionName}':`, error);
    throw error;
  }
}

/**
 * Get the Bitcoin historical data collection
 * @returns Promise<Collection>
 */
export async function getBitcoinHistoricalDataCollection(): Promise<Collection> {
  return getCollection(COLLECTION_NAMES.BITCOIN_HISTORICAL_DATA);
}

/**
 * Get the user portfolios collection
 * @returns Promise<Collection>
 */
export async function getUserPortfoliosCollection(): Promise<Collection> {
  return getCollection(COLLECTION_NAMES.USER_PORTFOLIOS);
}

/**
 * Get the game achievements collection
 * @returns Promise<Collection>
 */
export async function getGameAchievementsCollection(): Promise<Collection> {
  return getCollection(COLLECTION_NAMES.GAME_ACHIEVEMENTS);
}

/**
 * Get the market analysis collection
 * @returns Promise<Collection>
 */
export async function getMarketAnalysisCollection(): Promise<Collection> {
  return getCollection(COLLECTION_NAMES.MARKET_ANALYSIS);
}

/**
 * Get the educational content collection
 * @returns Promise<Collection>
 */
export async function getEducationalContentCollection(): Promise<Collection> {
  return getCollection(COLLECTION_NAMES.EDUCATIONAL_CONTENT);
}

/**
 * List all collections in the database
 * @returns Promise<string[]> Array of collection names
 */
export async function listCollections(): Promise<string[]> {
  const client = await getChromaClient();
  
  try {
    const collections = await client.listCollections();
    return collections.map(collection => collection.name);
  } catch (error) {
    console.error('Failed to list collections:', error);
    throw error;
  }
}

/**
 * Get collection statistics
 * @returns Promise<Array<{name: string, documentCount: number, metadata: any}>>
 */
export async function getCollectionStats(): Promise<Array<{
  name: string;
  documentCount: number;
  metadata: any;
}>> {
  const client = await getChromaClient();
  
  try {
    const collections = await client.listCollections();
    const stats = [];
    
    for (const collectionInfo of collections) {
      const collection = await client.getCollection({ name: collectionInfo.name });
      const count = await collection.count();
      
      stats.push({
        name: collectionInfo.name,
        documentCount: count,
        metadata: collectionInfo.metadata
      });
    }
    
    return stats;
  } catch (error) {
    console.error('Failed to get collection stats:', error);
    throw error;
  }
}

/**
 * Create a collection if it doesn't exist
 * @param name Collection name
 * @param metadata Collection metadata
 * @returns Promise<Collection>
 */
export async function createCollectionIfNotExists(
  name: string, 
  metadata?: any
): Promise<Collection> {
  const client = await getChromaClient();
  
  try {
    // Try to get the existing collection
    return await client.getCollection({ name });
  } catch {
    // Collection doesn't exist, create it
    console.log(`Creating collection: ${name}`);
    return await client.createCollection({
      name,
      metadata: metadata || {}
    });
  }
}

/**
 * Initialize all required collections
 * @returns Promise<boolean>
 */
export async function initializeCollections(): Promise<boolean> {
  try {
    const collections = [
      {
        name: COLLECTION_NAMES.BITCOIN_HISTORICAL_DATA,
        metadata: {
          description: 'Historical Bitcoin price data, market indicators, and trading volumes',
          category: 'market_data'
        }
      },
      {
        name: COLLECTION_NAMES.USER_PORTFOLIOS,
        metadata: {
          description: 'User trading positions, portfolio performance, and transaction history',
          category: 'user_data'
        }
      },
      {
        name: COLLECTION_NAMES.GAME_ACHIEVEMENTS,
        metadata: {
          description: 'User achievements, progress tracking, rewards, and milestone completions',
          category: 'gamification'
        }
      },
      {
        name: COLLECTION_NAMES.MARKET_ANALYSIS,
        metadata: {
          description: 'Technical analysis results, market predictions, and trading signals',
          category: 'analytics'
        }
      },
      {
        name: COLLECTION_NAMES.EDUCATIONAL_CONTENT,
        metadata: {
          description: 'Trading tutorials, educational materials, tips, and strategy guides',
          category: 'education'
        }
      }
    ];

    for (const collection of collections) {
      await createCollectionIfNotExists(collection.name, collection.metadata);
    }

    console.log('✓ All collections initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize collections:', error);
    return false;
  }
}

/**
 * Check if all required collections exist
 * @returns Promise<boolean>
 */
export async function validateCollections(): Promise<boolean> {
  try {
    // Auto-initialize collections if they don't exist
    await initializeCollections();
    
    const existingCollections = await listCollections();
    const requiredCollections = Object.values(COLLECTION_NAMES);
    
    const missingCollections = requiredCollections.filter(
      name => !existingCollections.includes(name)
    );
    
    if (missingCollections.length > 0) {
      console.error('Missing collections:', missingCollections);
      return false;
    }
    
    console.log('✓ All required collections exist');
    return true;
  } catch (error) {
    console.error('Failed to validate collections:', error);
    return false;
  }
}

export default {
  getChromaClient,
  getCollection,
  createCollectionIfNotExists,
  initializeCollections,
  getBitcoinHistoricalDataCollection,
  getUserPortfoliosCollection,
  getGameAchievementsCollection,
  getMarketAnalysisCollection,
  getEducationalContentCollection,
  listCollections,
  getCollectionStats,
  validateCollections,
  COLLECTION_NAMES
};