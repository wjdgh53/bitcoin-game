#!/usr/bin/env tsx

/**
 * Database initialization script for Bitcoin Trading Game
 * 
 * This script creates the primary ChromaDB collections needed for the game:
 * 1. bitcoin_historical_data - Price history and market indicators
 * 2. user_portfolios - Trading positions and performance
 * 3. game_achievements - User progress and rewards  
 * 4. market_analysis - Technical analysis and predictions
 * 5. educational_content - Trading guides and tutorials
 * 
 * Usage: npm run init-db
 */

import { initializeBitcoinGameDatabase } from '../src/lib/database/chroma-setup';

async function main() {
  try {
    await initializeBitcoinGameDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Run the initialization
main();