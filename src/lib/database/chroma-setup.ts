import { ChromaClient, Collection } from 'chromadb';

// ChromaDB client configuration
// Using default path (in-memory/local file system) instead of requiring server
const client = new ChromaClient();

export interface CollectionConfig {
  name: string;
  metadata: {
    description: string;
    data_types: string[];
    usage: string;
  };
}

// Collection configurations for the Bitcoin trading game
export const COLLECTION_CONFIGS: CollectionConfig[] = [
  {
    name: "bitcoin_historical_data",
    metadata: {
      description: "Historical Bitcoin price data, market indicators, and trading volumes for game analysis",
      data_types: ["price", "volume", "market_cap", "technical_indicators", "timestamps"],
      usage: "Store and query historical Bitcoin data for game scenarios and backtesting"
    }
  },
  {
    name: "user_portfolios", 
    metadata: {
      description: "User trading positions, portfolio performance, and transaction history",
      data_types: ["user_id", "positions", "balance", "transactions", "performance_metrics"],
      usage: "Track user portfolio state and trading activity across game sessions"
    }
  },
  {
    name: "game_achievements",
    metadata: {
      description: "User achievements, progress tracking, rewards, and milestone completions",
      data_types: ["user_id", "achievement_type", "completion_date", "rewards", "progress"],
      usage: "Store and retrieve user progress for gamification and reward systems"
    }
  },
  {
    name: "market_analysis",
    metadata: {
      description: "Technical analysis results, market predictions, and trading signals",
      data_types: ["analysis_type", "predictions", "confidence_scores", "trading_signals", "timeframes"],
      usage: "Store AI-generated market analysis and trading recommendations for the game"
    }
  },
  {
    name: "educational_content",
    metadata: {
      description: "Trading tutorials, educational materials, tips, and strategy guides",
      data_types: ["content_type", "difficulty_level", "topics", "media_urls", "learning_objectives"],
      usage: "Provide educational content to help users learn trading concepts and strategies"
    }
  }
];

/**
 * Creates all ChromaDB collections for the Bitcoin trading game
 * @returns Promise<Collection[]> Array of created collections
 */
export async function createCollections(): Promise<Collection[]> {
  const collections: Collection[] = [];
  
  try {
    console.log("Initializing ChromaDB collections for Bitcoin Trading Game...\n");
    
    for (const config of COLLECTION_CONFIGS) {
      console.log(`Creating collection: ${config.name}`);
      console.log(`Description: ${config.metadata.description}`);
      console.log(`Data types: ${config.metadata.data_types.join(", ")}`);
      console.log(`Usage: ${config.metadata.usage}\n`);
      
      try {
        // Try to get existing collection first
        let collection: Collection;
        try {
          collection = await client.getCollection({ name: config.name });
          console.log(`✓ Collection '${config.name}' already exists\n`);
        } catch (error) {
          // Collection doesn't exist, create it
          collection = await client.createCollection({
            name: config.name,
            metadata: config.metadata
          });
          console.log(`✓ Created collection '${config.name}'\n`);
        }
        
        collections.push(collection);
        
      } catch (error) {
        console.error(`✗ Failed to create collection '${config.name}':`, error);
        throw error;
      }
    }
    
    console.log(`Successfully initialized ${collections.length} collections!\n`);
    return collections;
    
  } catch (error) {
    console.error("Failed to initialize ChromaDB collections:", error);
    throw error;
  }
}

/**
 * Lists all collections in ChromaDB
 * @returns Promise<string[]> Array of collection names
 */
export async function listAllCollections(): Promise<string[]> {
  try {
    const collections = await client.listCollections();
    const collectionNames = collections.map(collection => collection.name);
    
    console.log("Current ChromaDB Collections:");
    console.log("============================");
    
    if (collectionNames.length === 0) {
      console.log("No collections found.");
    } else {
      collectionNames.forEach((name, index) => {
        console.log(`${index + 1}. ${name}`);
      });
    }
    
    console.log(`\nTotal collections: ${collectionNames.length}\n`);
    return collectionNames;
    
  } catch (error) {
    console.error("Failed to list collections:", error);
    throw error;
  }
}

/**
 * Gets detailed information about all collections
 * @returns Promise<void>
 */
export async function getCollectionDetails(): Promise<void> {
  try {
    console.log("Collection Details:");
    console.log("==================\n");
    
    for (const config of COLLECTION_CONFIGS) {
      try {
        const collection = await client.getCollection({ name: config.name });
        const count = await collection.count();
        
        console.log(`Collection: ${config.name}`);
        console.log(`Description: ${config.metadata.description}`);
        console.log(`Document count: ${count}`);
        console.log(`Metadata:`, collection.metadata);
        console.log("-".repeat(50));
        
      } catch (error) {
        console.log(`Collection '${config.name}' not found or error occurred:`, error);
        console.log("-".repeat(50));
      }
    }
  } catch (error) {
    console.error("Failed to get collection details:", error);
    throw error;
  }
}

/**
 * Initializes the complete ChromaDB setup for the Bitcoin trading game
 * Creates collections and verifies setup
 */
export async function initializeBitcoinGameDatabase(): Promise<void> {
  try {
    console.log("🎮 Bitcoin Trading Game - Database Initialization");
    console.log("================================================\n");
    
    // Create all collections
    const collections = await createCollections();
    
    // List all collections to verify
    await listAllCollections();
    
    // Show detailed collection information
    await getCollectionDetails();
    
    console.log("✅ Bitcoin Trading Game database setup completed successfully!");
    console.log("Ready to store game data with proper indexing for efficient queries.\n");
    
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

// Export the ChromaDB client for use in other parts of the application
export { client };