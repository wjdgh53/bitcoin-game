# Feature Development Pattern for Bitcoin Trading Game

This document outlines the comprehensive feature development pattern for the Bitcoin Trading Game project. Follow this pattern to ensure consistent, scalable, and well-tested feature implementation.

## Architecture Overview

The Bitcoin Trading Game uses a multi-layered architecture:
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Node.js API routes with Prisma ORM
- **Database**: SQLite with Prisma for relational data
- **Search & Analytics**: ChromaDB for semantic search and AI agent data
- **AI Integration**: Dynamic AI agents with different trading personalities

## Feature Development Workflow

### Phase 1: Planning & Design

#### 1.1 Requirements Analysis
```markdown
- [ ] Define user story and acceptance criteria
- [ ] Identify data models and relationships
- [ ] Plan API endpoints and data flow
- [ ] Consider ChromaDB integration needs
- [ ] Assess AI agent integration requirements
```

#### 1.2 Architecture Design
```typescript
// Define TypeScript interfaces first
interface FeatureInput {
  // Input validation schema
}

interface FeatureOutput {
  // Output data structure
}

interface FeatureSearchResult {
  // ChromaDB search result structure
}
```

#### 1.3 Database Schema
```sql
-- Define Prisma schema additions
model FeatureTable {
  id          String   @id @default(cuid())
  userId      String
  data        Json
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Add relationships
  user        User     @relation(fields: [userId], references: [id])
}
```

### Phase 2: Implementation

#### 2.1 Database Layer
1. **Update Prisma Schema** (`prisma/schema.prisma`)
2. **Create Migration**: `npx prisma migrate dev --name add_feature`
3. **Update Types**: `npx prisma generate`

#### 2.2 Service Layer Pattern
```typescript
// src/lib/services/feature-service.ts
import { ChromaClient } from 'chromadb';
import { prisma } from '@/lib/database/prisma-client';
import { ValidationUtils } from '@/lib/validation/schemas';

export class FeatureService {
  private chroma: ChromaClient;
  private collection: any = null;
  private collectionName = 'feature_collection';

  constructor() {
    this.chroma = new ChromaClient({
      path: process.env.CHROMADB_PATH || './chroma_data'
    });
  }

  async initialize(): Promise<void> {
    try {
      this.collection = await this.chroma.getCollection({
        name: this.collectionName
      });
    } catch {
      this.collection = await this.chroma.createCollection({
        name: this.collectionName,
        metadata: {
          description: 'Feature-specific data collection',
          category: 'feature_data'
        }
      });
    }
  }

  async createFeature(data: FeatureInput): Promise<FeatureOutput> {
    await this.ensureInitialized();
    
    // Validate input
    const validatedData = ValidationUtils.validateFeatureInput(data);
    
    // Store in database
    const record = await prisma.featureTable.create({
      data: validatedData
    });

    // Store in ChromaDB for search
    await this.storeInChroma(record);

    return this.transformToOutput(record);
  }

  async searchFeatures(query: string, limit: number = 10): Promise<FeatureSearchResult[]> {
    await this.ensureInitialized();
    
    const results = await this.collection.query({
      queryTexts: [query],
      nResults: limit,
      include: ['documents', 'metadatas']
    });

    return this.processSearchResults(results);
  }

  private async storeInChroma(data: any): Promise<void> {
    const document = {
      id: data.id,
      document: JSON.stringify(data),
      metadata: {
        user_id: data.userId,
        created_at: data.createdAt.toISOString(),
        type: 'feature_data'
      }
    };

    await this.collection.add({
      ids: [document.id],
      documents: [document.document],
      metadatas: [document.metadata]
    });
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.collection) {
      await this.initialize();
    }
  }
}

export const featureService = new FeatureService();
```

#### 2.3 API Routes Pattern
```typescript
// src/app/api/features/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { featureService } from '@/lib/services/feature-service';
import { validateAuth } from '@/lib/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const user = await validateAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const feature = await featureService.createFeature({
      ...body,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      data: feature
    });
  } catch (error) {
    console.error('Feature creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await validateAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    const results = await featureService.searchFeatures(query, limit);

    return NextResponse.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Feature search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
```

#### 2.4 Frontend Integration
```typescript
// Custom React hook for feature management
// src/lib/hooks/use-feature.ts
import { useState, useEffect } from 'react';
import { useApi } from './use-api';

interface UseFeatureOptions {
  autoLoad?: boolean;
  query?: string;
}

export function useFeature(options: UseFeatureOptions = {}) {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { post, get } = useApi();

  const createFeature = async (data: FeatureInput) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await post('/api/features', data);
      if (response.success) {
        await loadFeatures(); // Refresh list
        return response.data;
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create feature';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadFeatures = async (searchQuery?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      
      const response = await get(`/api/features?${params.toString()}`);
      if (response.success) {
        setFeatures(response.data);
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load features';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const searchFeatures = (query: string) => {
    loadFeatures(query);
  };

  useEffect(() => {
    if (options.autoLoad) {
      loadFeatures(options.query);
    }
  }, [options.autoLoad, options.query]);

  return {
    features,
    loading,
    error,
    createFeature,
    loadFeatures,
    searchFeatures
  };
}
```

### Phase 3: Testing

#### 3.1 Unit Tests
```typescript
// tests/services/feature-service.test.ts
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { featureService } from '@/lib/services/feature-service';

describe('FeatureService', () => {
  beforeEach(async () => {
    await featureService.initialize();
  });

  afterEach(async () => {
    // Cleanup test data
  });

  test('should create feature successfully', async () => {
    const input: FeatureInput = {
      // Test data
    };

    const result = await featureService.createFeature(input);
    
    expect(result).toBeDefined();
    expect(result.id).toBeTruthy();
  });

  test('should search features by query', async () => {
    // Create test data first
    await featureService.createFeature(testData);

    const results = await featureService.searchFeatures('test query');
    
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThan(0);
  });
});
```

#### 3.2 API Tests
```typescript
// tests/api/features.test.ts
import { describe, test, expect } from '@jest/globals';
import { POST, GET } from '@/app/api/features/route';

describe('/api/features', () => {
  test('POST should create feature with authentication', async () => {
    const request = new Request('http://localhost/api/features', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify(testFeatureData)
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
  });

  test('GET should return 401 without authentication', async () => {
    const request = new Request('http://localhost/api/features');
    
    const response = await GET(request);
    
    expect(response.status).toBe(401);
  });
});
```

#### 3.3 Integration Tests
```typescript
// tests/integration/feature-workflow.test.ts
import { describe, test, expect } from '@jest/globals';

describe('Feature Integration Workflow', () => {
  test('complete feature lifecycle', async () => {
    // 1. Create feature
    const created = await featureService.createFeature(testData);
    expect(created.id).toBeDefined();

    // 2. Search should find the feature
    const searchResults = await featureService.searchFeatures('test');
    expect(searchResults.some(r => r.id === created.id)).toBe(true);

    // 3. Database should contain the record
    const dbRecord = await prisma.featureTable.findUnique({
      where: { id: created.id }
    });
    expect(dbRecord).toBeTruthy();
  });
});
```

### Phase 4: Bitcoin Game Specific Integration

#### 4.1 AI Agent Integration
```typescript
// If feature needs AI agent integration
import { dynamicAgentService } from '@/lib/services/dynamic-agent-service';

class FeatureWithAI extends FeatureService {
  async analyzeWithAI(featureData: any, agentType: string): Promise<AIAnalysis> {
    const agent = await dynamicAgentService.getAgent(agentType);
    
    return await agent.analyze({
      data: featureData,
      context: 'feature_analysis',
      instructions: 'Analyze this feature data for trading insights'
    });
  }
}
```

#### 4.2 Price Data Integration
```typescript
// If feature needs Bitcoin price data
import { bitcoinAPI } from '@/lib/services/bitcoin-api';
import { bitcoinStorage } from '@/lib/services/bitcoin-storage';

class FeatureWithPriceData extends FeatureService {
  async enrichWithPriceData(data: any): Promise<EnrichedData> {
    const currentPrice = await bitcoinAPI.getCurrentPrice();
    const historicalData = await bitcoinStorage.queryLatestBitcoinData(24);
    
    return {
      ...data,
      currentPrice: currentPrice.price,
      priceChange24h: this.calculatePriceChange(historicalData),
      marketContext: this.analyzeMarketContext(historicalData)
    };
  }
}
```

#### 4.3 Report Integration
```typescript
// If feature generates reports
import { reportService } from '@/lib/services/report-service';

class FeatureWithReports extends FeatureService {
  async generateReport(featureId: string, agentType: string): Promise<Report> {
    const featureData = await this.getFeature(featureId);
    
    return await reportService.generateReport({
      type: 'feature_analysis',
      agentType,
      data: featureData,
      metadata: {
        featureId,
        timestamp: new Date()
      }
    });
  }
}
```

## Quality Standards

### Code Quality Requirements
- **TypeScript**: Strict mode, no `any` types
- **Error Handling**: Comprehensive try-catch with proper error messages
- **Validation**: Input validation using Zod or similar
- **Documentation**: JSDoc comments for public methods
- **Testing**: Minimum 80% code coverage

### Performance Standards
- **API Response Time**: < 500ms for CRUD operations
- **ChromaDB Queries**: < 1s for search operations
- **Database Queries**: Use proper indexing and query optimization
- **Memory Usage**: Monitor for memory leaks in long-running processes

### Security Standards
- **Authentication**: All protected routes must validate JWT tokens
- **Input Sanitization**: Validate and sanitize all user inputs
- **SQL Injection**: Use Prisma's type-safe queries
- **Rate Limiting**: Implement rate limiting for API endpoints

## Deployment Checklist

- [ ] All tests passing (unit, integration, API)
- [ ] Database migrations applied
- [ ] ChromaDB collections created and indexed
- [ ] Environment variables configured
- [ ] Error monitoring and logging setup
- [ ] Performance metrics baseline established
- [ ] Documentation updated
- [ ] Code review completed
- [ ] Feature flag configuration (if applicable)

## Examples and References

See the `examples/` directory for complete feature implementations:
- `basic-crud-feature.md` - Complete CRUD example with all layers
- `ai-integrated-feature.md` - AI agent integration example
- `search-heavy-feature.md` - ChromaDB-focused implementation

## Troubleshooting

### Common Issues
1. **ChromaDB Connection Errors**: Check `CHROMADB_PATH` environment variable
2. **Prisma Migration Issues**: Run `npx prisma db push` to sync schema
3. **Authentication Failures**: Verify JWT_SECRET configuration
4. **Search Performance**: Consider ChromaDB collection optimization

### Debug Commands
```bash
# Test ChromaDB connection
npm run test-chroma

# Reset database
npx prisma migrate reset

# View database
npx prisma studio

# Run specific test suite
npm test -- --testPathPattern=features
```

This pattern ensures consistent, maintainable, and scalable feature development across the Bitcoin Trading Game project.