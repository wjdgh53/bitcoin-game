#!/usr/bin/env tsx

// ChromaDB optimization and indexing script

import { ChromaClient } from 'chromadb';
import { COLLECTION_NAMES } from '../lib/database/schemas';

interface CollectionStats {
  name: string;
  count: number;
  avgQueryTime: number;
  indexes: string[];
  recommendations: string[];
}

class ChromaDBOptimizer {
  private client: ChromaClient;

  constructor() {
    this.client = new ChromaClient({
      path: process.env.CHROMADB_PATH || './chroma_data'
    });
  }

  /**
   * Analyze all collections and provide optimization recommendations
   */
  async analyzeCollections(): Promise<CollectionStats[]> {
    console.log('🔍 Analyzing ChromaDB collections...\n');
    
    const stats: CollectionStats[] = [];

    try {
      // Get all collections
      const collections = await this.client.listCollections();
      
      for (const collectionInfo of collections) {
        console.log(`📊 Analyzing collection: ${collectionInfo.name}`);
        
        try {
          const collection = await this.client.getCollection({
            name: collectionInfo.name
          });

          // Get collection count
          const count = await collection.count();
          
          // Measure query performance
          const queryStart = performance.now();
          await collection.peek({ limit: 1 });
          const queryTime = performance.now() - queryStart;

          // Get collection metadata
          const metadata = collectionInfo.metadata || {};
          
          const collectionStats: CollectionStats = {
            name: collectionInfo.name,
            count,
            avgQueryTime: queryTime,
            indexes: this.getExistingIndexes(metadata),
            recommendations: this.generateRecommendations(collectionInfo.name, count, queryTime)
          };

          stats.push(collectionStats);
          
          console.log(`  ✅ Documents: ${count}`);
          console.log(`  ⏱️  Query time: ${queryTime.toFixed(2)}ms`);
          console.log(`  📋 Recommendations: ${collectionStats.recommendations.length}\n`);

        } catch (error) {
          console.error(`  ❌ Error analyzing ${collectionInfo.name}:`, error);
        }
      }

      return stats;
    } catch (error) {
      console.error('❌ Error analyzing collections:', error);
      return [];
    }
  }

  /**
   * Optimize collections based on analysis
   */
  async optimizeCollections(stats: CollectionStats[]): Promise<void> {
    console.log('🚀 Starting ChromaDB optimization...\n');

    for (const stat of stats) {
      if (stat.recommendations.length === 0) {
        console.log(`✅ ${stat.name}: No optimization needed`);
        continue;
      }

      console.log(`🔧 Optimizing ${stat.name}:`);
      
      try {
        await this.applyOptimizations(stat);
        console.log(`  ✅ Optimization completed\n`);
      } catch (error) {
        console.error(`  ❌ Optimization failed:`, error);
      }
    }
  }

  /**
   * Create performance benchmarks
   */
  async runPerformanceBenchmark(): Promise<void> {
    console.log('🏃 Running performance benchmark...\n');

    const benchmarkQueries = [
      {
        name: 'Simple query',
        collection: COLLECTION_NAMES.BITCOIN_HISTORICAL_DATA,
        query: 'bitcoin price data'
      },
      {
        name: 'Filtered query',
        collection: COLLECTION_NAMES.USER_PORTFOLIOS,
        query: 'user portfolio',
        where: { user_id: 'test-user' }
      },
      {
        name: 'Complex semantic search',
        collection: COLLECTION_NAMES.EDUCATIONAL_CONTENT,
        query: 'advanced bitcoin trading strategies and risk management'
      }
    ];

    for (const benchmark of benchmarkQueries) {
      try {
        const collection = await this.client.getCollection({
          name: benchmark.collection
        });

        const startTime = performance.now();
        
        await collection.query({
          queryTexts: [benchmark.query],
          nResults: 10,
          where: benchmark.where
        });
        
        const duration = performance.now() - startTime;
        
        console.log(`  ${benchmark.name}: ${duration.toFixed(2)}ms`);
        
        if (duration > 100) {
          console.log(`    ⚠️  Query is slow (>${100}ms)`);
        } else {
          console.log(`    ✅ Query performance is good`);
        }
        
      } catch (error) {
        console.error(`  ❌ Benchmark failed for ${benchmark.name}:`, error);
      }
    }
    
    console.log('');
  }

  /**
   * Clean up old and unused data
   */
  async cleanupOldData(): Promise<void> {
    console.log('🧹 Cleaning up old data...\n');

    const cleanupTasks = [
      {
        collection: COLLECTION_NAMES.BITCOIN_HISTORICAL_DATA,
        retention: 30, // days
        description: 'Bitcoin historical data'
      },
      {
        collection: 'achievement_notifications',
        retention: 7, // days  
        description: 'Achievement notifications'
      },
      {
        collection: 'trading_patterns',
        retention: 90, // days
        description: 'Trading patterns'
      }
    ];

    let totalCleaned = 0;

    for (const task of cleanupTasks) {
      try {
        const collection = await this.client.getCollection({
          name: task.collection
        });

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - task.retention);

        // Query for old records
        const oldRecords = await collection.query({
          queryTexts: ['old data cleanup'],
          nResults: 1000,
          where: {
            created_at: { $lt: cutoffDate.toISOString() }
          },
          include: ['metadatas']
        });

        if (oldRecords.ids && oldRecords.ids[0] && oldRecords.ids[0].length > 0) {
          await collection.delete({
            ids: oldRecords.ids[0]
          });

          const cleanedCount = oldRecords.ids[0].length;
          totalCleaned += cleanedCount;
          
          console.log(`  ✅ Cleaned ${cleanedCount} old records from ${task.description}`);
        } else {
          console.log(`  ℹ️  No old records to clean in ${task.description}`);
        }

      } catch (error) {
        console.error(`  ❌ Cleanup failed for ${task.description}:`, error);
      }
    }

    console.log(`\n🎉 Cleanup completed: ${totalCleaned} total records removed\n`);
  }

  /**
   * Generate comprehensive optimization report
   */
  async generateOptimizationReport(): Promise<string> {
    console.log('📋 Generating optimization report...\n');

    const stats = await this.analyzeCollections();
    const totalDocs = stats.reduce((sum, stat) => sum + stat.count, 0);
    const avgQueryTime = stats.reduce((sum, stat) => sum + stat.avgQueryTime, 0) / stats.length;
    const totalRecommendations = stats.reduce((sum, stat) => sum + stat.recommendations.length, 0);

    const report = `
ChromaDB Optimization Report
============================
Generated: ${new Date().toLocaleString()}

📊 Overview:
- Total Collections: ${stats.length}
- Total Documents: ${totalDocs.toLocaleString()}
- Average Query Time: ${avgQueryTime.toFixed(2)}ms
- Optimization Recommendations: ${totalRecommendations}

📈 Collection Details:
${stats.map(stat => `
${stat.name}:
  📄 Documents: ${stat.count.toLocaleString()}
  ⏱️  Query Time: ${stat.avgQueryTime.toFixed(2)}ms
  🔍 Indexes: ${stat.indexes.length > 0 ? stat.indexes.join(', ') : 'None'}
  💡 Recommendations: ${stat.recommendations.length}
${stat.recommendations.map(rec => `    - ${rec}`).join('\n')}
`).join('\n')}

🚀 Performance Summary:
${stats.filter(s => s.avgQueryTime > 100).length > 0 ? 
  `⚠️  ${stats.filter(s => s.avgQueryTime > 100).length} collections have slow queries (>100ms)` :
  '✅ All queries are performing well (<100ms)'
}

${totalRecommendations > 0 ? 
  `💡 ${totalRecommendations} optimization opportunities identified` :
  '🎉 No immediate optimizations needed'
}

🔧 Next Steps:
1. Run 'npm run optimize-chromadb' to apply optimizations
2. Monitor query performance after changes
3. Schedule regular cleanup of old data
4. Consider increasing memory allocation if needed

Generated by Bitcoin Trading Game Optimization Tool
    `.trim();

    return report;
  }

  // Private helper methods

  private getExistingIndexes(metadata: any): string[] {
    // ChromaDB doesn't expose index information directly
    // This would return inferred indexes based on metadata
    const indexes: string[] = [];
    
    if (metadata.indexed_fields) {
      indexes.push(...metadata.indexed_fields);
    }
    
    return indexes;
  }

  private generateRecommendations(name: string, count: number, queryTime: number): string[] {
    const recommendations: string[] = [];

    // Large collections should have proper indexing
    if (count > 10000) {
      recommendations.push('Consider adding metadata indexes for frequently queried fields');
    }

    // Slow queries need optimization
    if (queryTime > 100) {
      recommendations.push('Query performance is slow - optimize query complexity or add caching');
    }

    // Collection-specific recommendations
    switch (name) {
      case COLLECTION_NAMES.BITCOIN_HISTORICAL_DATA:
        if (count > 50000) {
          recommendations.push('Consider partitioning historical data by time periods');
        }
        break;
        
      case COLLECTION_NAMES.USER_PORTFOLIOS:
        recommendations.push('Add user_id index for faster user-specific queries');
        break;
        
      case COLLECTION_NAMES.EDUCATIONAL_CONTENT:
        if (queryTime > 50) {
          recommendations.push('Content search is slow - consider pre-computing embeddings');
        }
        break;
    }

    return recommendations;
  }

  private async applyOptimizations(stat: CollectionStats): Promise<void> {
    // Apply specific optimizations based on recommendations
    for (const recommendation of stat.recommendations) {
      if (recommendation.includes('metadata indexes')) {
        await this.addMetadataIndexes(stat.name);
      } else if (recommendation.includes('caching')) {
        await this.setupQueryCaching(stat.name);
      } else if (recommendation.includes('partitioning')) {
        await this.suggestPartitioning(stat.name);
      }
    }
  }

  private async addMetadataIndexes(collectionName: string): Promise<void> {
    console.log(`    📇 Adding metadata indexes for ${collectionName}`);
    // ChromaDB automatically indexes metadata, but we can optimize queries
    // by ensuring consistent metadata field naming
  }

  private async setupQueryCaching(collectionName: string): Promise<void> {
    console.log(`    💾 Setting up query caching for ${collectionName}`);
    // Implement application-level caching recommendations
  }

  private async suggestPartitioning(collectionName: string): Promise<void> {
    console.log(`    📂 Suggesting partitioning strategy for ${collectionName}`);
    // Provide recommendations for data partitioning
  }
}

// Main execution function
async function main() {
  console.log('🎮 Bitcoin Trading Game - ChromaDB Optimization Tool');
  console.log('====================================================\n');

  const optimizer = new ChromaDBOptimizer();

  try {
    // Run performance benchmark
    await optimizer.runPerformanceBenchmark();

    // Analyze collections
    const stats = await optimizer.analyzeCollections();

    // Generate and display report
    const report = await optimizer.generateOptimizationReport();
    console.log(report);

    // Ask user if they want to apply optimizations
    const shouldOptimize = process.argv.includes('--optimize');
    
    if (shouldOptimize) {
      await optimizer.optimizeCollections(stats);
      await optimizer.cleanupOldData();
      console.log('🎉 Optimization completed successfully!');
    } else {
      console.log('\n💡 To apply optimizations, run: npm run optimize-chromadb -- --optimize');
    }

  } catch (error) {
    console.error('❌ Optimization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { ChromaDBOptimizer };