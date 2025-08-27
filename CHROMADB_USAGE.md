# ChromaDB Usage Guide for Bitcoin Trading Game

This guide explains how to use the ChromaDB collections in your Bitcoin Trading Game.

## Quick Start

### 1. Initialize Collections
```bash
npm run init-chroma
```

This creates 5 primary collections with proper metadata and indexing.

### 2. Using Collections in Your Code

```typescript
import { 
  getBitcoinHistoricalDataCollection,
  getUserPortfoliosCollection,
  getGameAchievementsCollection,
  getMarketAnalysisCollection,
  getEducationalContentCollection,
  validateCollections 
} from '@/lib/database/chroma-client';

// Validate all collections exist
const isValid = await validateCollections();

// Get a specific collection
const marketData = await getBitcoinHistoricalDataCollection();
```

## Collections Overview

### 1. `bitcoin_historical_data`
**Purpose**: Store historical Bitcoin price data and market indicators

**Data Types**: `price`, `volume`, `market_cap`, `technical_indicators`, `timestamps`

**Usage Example**:
```typescript
const collection = await getBitcoinHistoricalDataCollection();

// Add historical price data
await collection.add({
  ids: ['btc_2024_01_01'],
  documents: ['Bitcoin price data for 2024-01-01'],
  metadatas: [{
    price: 45000.00,
    volume: 1234567890,
    timestamp: '2024-01-01T00:00:00Z',
    market_cap: 900000000000
  }],
  embeddings: [[0.1, 0.2, 0.3, ...]] // Optional vector embeddings
});

// Query price data
const results = await collection.query({
  nResults: 10,
  where: { price: { '$gte': 40000 } }
});
```

### 2. `user_portfolios`
**Purpose**: Track user trading positions and performance

**Data Types**: `user_id`, `positions`, `balance`, `transactions`, `performance_metrics`

**Usage Example**:
```typescript
const collection = await getUserPortfoliosCollection();

// Store user portfolio data
await collection.add({
  ids: [`portfolio_${userId}_${Date.now()}`],
  documents: [`Portfolio state for user ${userId}`],
  metadatas: [{
    user_id: userId,
    balance: 10000.00,
    total_trades: 25,
    profit_loss: 250.00,
    last_updated: new Date().toISOString()
  }]
});
```

### 3. `game_achievements`
**Purpose**: Store user achievements and progress tracking

**Data Types**: `user_id`, `achievement_type`, `completion_date`, `rewards`, `progress`

**Usage Example**:
```typescript
const collection = await getGameAchievementsCollection();

// Award achievement
await collection.add({
  ids: [`achievement_${userId}_first_trade`],
  documents: ['First successful trade achievement'],
  metadatas: [{
    user_id: userId,
    achievement_type: 'first_trade',
    completion_date: new Date().toISOString(),
    reward_points: 100,
    badge: 'Trading Novice'
  }]
});
```

### 4. `market_analysis`
**Purpose**: Store AI-generated market analysis and predictions

**Data Types**: `analysis_type`, `predictions`, `confidence_scores`, `trading_signals`, `timeframes`

**Usage Example**:
```typescript
const collection = await getMarketAnalysisCollection();

// Store market analysis
await collection.add({
  ids: [`analysis_${Date.now()}`],
  documents: ['Technical analysis suggests bullish trend for BTC'],
  metadatas: [{
    analysis_type: 'technical',
    prediction: 'bullish',
    confidence_score: 0.75,
    timeframe: '24h',
    signal_strength: 'strong',
    generated_at: new Date().toISOString()
  }]
});
```

### 5. `educational_content`
**Purpose**: Store trading tutorials and educational materials

**Data Types**: `content_type`, `difficulty_level`, `topics`, `media_urls`, `learning_objectives`

**Usage Example**:
```typescript
const collection = await getEducationalContentCollection();

// Add educational content
await collection.add({
  ids: ['tutorial_candle_patterns'],
  documents: ['Learn to read candlestick patterns for Bitcoin trading'],
  metadatas: [{
    content_type: 'tutorial',
    difficulty_level: 'beginner',
    topic: 'candlestick_patterns',
    estimated_time: 15, // minutes
    learning_objectives: 'Identify basic candlestick patterns'
  }]
});
```

## Common Operations

### Query Collections
```typescript
// Search for similar content using vector similarity
const results = await collection.query({
  queryTexts: ['Bitcoin price prediction'],
  nResults: 5,
  where: { confidence_score: { '$gte': 0.7 } }
});

// Get documents by IDs
const documents = await collection.get({
  ids: ['btc_2024_01_01', 'btc_2024_01_02']
});
```

### Update Documents
```typescript
// Update existing documents
await collection.update({
  ids: ['portfolio_user123_123456'],
  metadatas: [{
    balance: 10250.00,
    total_trades: 26,
    profit_loss: 500.00,
    last_updated: new Date().toISOString()
  }]
});
```

### Delete Documents
```typescript
// Delete specific documents
await collection.delete({
  ids: ['old_analysis_123456']
});

// Delete by metadata filter
await collection.delete({
  where: { 
    user_id: 'inactive_user123',
    last_updated: { '$lt': '2024-01-01' }
  }
});
```

## Database Management

### Check Collection Status
```typescript
import { getCollectionStats, validateCollections } from '@/lib/database/chroma-client';

// Validate all collections exist
const isValid = await validateCollections();

// Get collection statistics
const stats = await getCollectionStats();
console.log('Collection Stats:', stats);
```

### Reinitialize Collections
```bash
# If you need to recreate collections
npm run init-chroma
```

## Best Practices

1. **Use Descriptive IDs**: Create meaningful unique IDs for your documents
2. **Include Timestamps**: Always include timestamps for time-series data
3. **Index Key Fields**: Use metadata fields for filtering and querying
4. **Batch Operations**: Use batch operations for better performance when adding multiple documents
5. **Error Handling**: Always wrap database operations in try-catch blocks

## Troubleshooting

### Collections Not Found
```bash
npm run init-chroma
```

### Performance Issues
- Use metadata filters to reduce query scope
- Consider using vector embeddings for similarity search
- Batch operations when possible

### Data Persistence
- Collections are stored in `./chroma_data/` directory
- Database persists between application restarts
- Back up `chroma_data` directory for data safety