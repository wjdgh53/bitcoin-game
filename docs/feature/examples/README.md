# Feature Development Examples

This directory contains complete, working examples of features implemented following the Bitcoin Trading Game development patterns.

## Available Examples

### 📝 [Basic CRUD Feature: Trading Notes](./basic-crud-feature.md)

A comprehensive example implementing a complete Trading Notes feature that demonstrates:

**Core Functionality:**
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Database integration with Prisma ORM
- ✅ ChromaDB semantic search integration
- ✅ RESTful API endpoints with validation
- ✅ React hooks for frontend integration
- ✅ Complete test suite

**Bitcoin Game Specific Features:**
- 🚀 Real-time Bitcoin price context in notes
- 🚀 Sentiment analysis (bullish/bearish/neutral)
- 🚀 Tag-based categorization system
- 🚀 User analytics and insights
- 🚀 Public/private note sharing

**Architecture Layers Covered:**
1. **Database Schema** - Prisma model with relationships
2. **ChromaDB Integration** - Collection setup and document mapping
3. **Service Layer** - Business logic with comprehensive error handling
4. **API Routes** - Next.js API routes with validation and auth
5. **React Hooks** - Custom hooks for data management
6. **Frontend Components** - Complete React component with UI
7. **Testing** - Unit tests, integration tests, and API tests

**Key Learning Points:**
- Service layer pattern implementation
- ChromaDB semantic search patterns
- Error handling and validation strategies
- React state management with custom hooks
- API route design with proper error responses
- Testing strategies for all layers

## How to Use These Examples

### 1. Study the Complete Implementation

Each example shows the complete feature implementation from database to UI:

```bash
# Review the example structure
docs/feature/examples/basic-crud-feature.md
├── Database Schema (Prisma)
├── TypeScript Types
├── ChromaDB Setup
├── Service Layer
├── API Routes  
├── React Hooks
├── Frontend Components
└── Test Suite
```

### 2. Adapt to Your Feature

Use the examples as templates by:

1. **Copy the structure** - Use the same file organization
2. **Modify the data models** - Adapt schema and types to your needs
3. **Customize business logic** - Update service methods for your use case
4. **Adjust API endpoints** - Modify routes for your feature requirements
5. **Update UI components** - Customize the frontend for your feature

### 3. Follow the Patterns

Each example demonstrates key patterns:

**Service Layer Pattern:**
```typescript
export class FeatureService {
  private chroma: ChromaClient;
  private collection: any = null;
  
  async initialize(): Promise<void> { /* ChromaDB setup */ }
  async createItem(data: Input): Promise<Output> { /* CRUD with validation */ }
  async searchItems(query: string): Promise<Result[]> { /* Semantic search */ }
}
```

**API Route Pattern:**
```typescript
export async function POST(request: NextRequest) {
  const user = await validateAuth(request);
  const body = await request.json();
  const validated = Schema.parse(body);
  const result = await service.createItem(validated);
  return NextResponse.json({ success: true, data: result });
}
```

**React Hook Pattern:**
```typescript
export function useFeature() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const createItem = async (input) => { /* API integration */ };
  const loadItems = async () => { /* Data fetching */ };
  
  return { data, loading, error, createItem, loadItems };
}
```

## Implementation Checklist

When implementing a new feature using these examples:

### Planning Phase ✅
- [ ] Review the relevant example thoroughly
- [ ] Identify required modifications for your use case
- [ ] Plan database schema changes
- [ ] Design API endpoints
- [ ] Sketch UI components

### Implementation Phase 🔧
- [ ] Create Prisma schema and migration
- [ ] Implement TypeScript types
- [ ] Set up ChromaDB collection
- [ ] Build service layer with all methods
- [ ] Create API routes with validation
- [ ] Implement React hooks
- [ ] Build UI components
- [ ] Add comprehensive error handling

### Testing Phase 🧪
- [ ] Write unit tests for service layer
- [ ] Create API endpoint tests
- [ ] Test React hooks functionality
- [ ] Add integration tests
- [ ] Verify ChromaDB search functionality
- [ ] Test error scenarios

### Quality Assurance 🛡️
- [ ] TypeScript strict mode compliance
- [ ] Error handling in all layers
- [ ] Input validation and sanitization  
- [ ] Authentication and authorization
- [ ] Performance optimization
- [ ] Security review

## Best Practices Demonstrated

### 1. **Separation of Concerns**
Each layer has a specific responsibility:
- Database layer handles data persistence
- Service layer contains business logic
- API layer manages HTTP communication
- Hook layer manages React state
- Component layer handles UI rendering

### 2. **Error Handling Strategy**
Comprehensive error handling at every level:
- Service layer catches and transforms errors
- API routes return proper HTTP status codes
- React hooks manage error states
- UI components display user-friendly messages

### 3. **Type Safety**
Full TypeScript integration:
- Strict types for all data structures
- Input/output validation with Zod schemas
- No `any` types in production code
- Proper error type handling

### 4. **Search Integration**
ChromaDB semantic search patterns:
- Document structure optimization for search
- Metadata design for filtering
- Search result relevance scoring
- Performance optimization strategies

### 5. **Testing Strategy**
Multiple testing levels:
- Unit tests for individual functions
- Integration tests for workflows
- API tests for endpoints
- Mock strategies for external dependencies

## Next Steps

1. **Choose Your Starting Point**: Pick the example most similar to your feature
2. **Read the Full Example**: Understand all implementation layers
3. **Plan Your Modifications**: Identify what needs to be changed
4. **Follow the Checklist**: Use the implementation checklist for guidance
5. **Test Thoroughly**: Implement the same testing strategies
6. **Document Your Feature**: Add your own example to this directory

## Common Customizations

### Database Schema Changes
```prisma
// Add fields specific to your feature
model YourFeature {
  // Core fields from example
  id        String   @id @default(cuid())
  userId    String
  createdAt DateTime @default(now())
  
  // Your custom fields
  customField1 String?
  customField2 Json?
  customField3 Float?
  
  // Relationships
  user User @relation(fields: [userId], references: [id])
}
```

### Service Layer Extensions
```typescript
export class YourFeatureService extends BaseService {
  // Add your specific business logic
  async customMethod(input: CustomInput): Promise<CustomOutput> {
    // Implementation specific to your feature
  }
  
  // Override search behavior if needed
  async customSearch(query: string): Promise<CustomResult[]> {
    // Feature-specific search logic
  }
}
```

### API Route Customizations
```typescript
// Add feature-specific endpoints
export async function PATCH(request: NextRequest) {
  // Custom PATCH logic for your feature
}

// Add custom query parameters
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customParam = searchParams.get('customParam');
  // Use custom parameter in your logic
}
```

---

These examples provide a solid foundation for implementing robust, scalable features in the Bitcoin Trading Game project. Use them as starting points and adapt them to your specific requirements while maintaining the established patterns and quality standards.