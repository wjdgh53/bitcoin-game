#!/usr/bin/env tsx

/**
 * Test script to verify ChromaDB collections are accessible from TypeScript
 */

import { validateCollections, getCollectionStats, COLLECTION_NAMES } from '../src/lib/database/chroma-client';

async function main() {
  console.log("🧪 Testing ChromaDB Connection for Bitcoin Trading Game");
  console.log("=" * 55);
  
  try {
    // Validate collections exist
    console.log("1. Validating collections...");
    const isValid = await validateCollections();
    
    if (!isValid) {
      console.log("❌ Validation failed. Run 'npm run init-chroma' first.");
      process.exit(1);
    }
    
    // Get collection statistics
    console.log("\n2. Getting collection statistics...");
    const stats = await getCollectionStats();
    
    console.log("\nCollection Statistics:");
    console.log("-".repeat(25));
    
    stats.forEach((stat, index) => {
      console.log(`${index + 1}. ${stat.name}`);
      console.log(`   Documents: ${stat.documentCount}`);
      console.log(`   Category: ${stat.metadata.category}`);
      console.log(`   Data Types: ${stat.metadata.data_types}`);
      console.log();
    });
    
    console.log("✅ All tests passed! ChromaDB is ready for the Bitcoin Trading Game.");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run the test
main();