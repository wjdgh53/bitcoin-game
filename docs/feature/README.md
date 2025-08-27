# Bitcoin Trading Game - Feature Development Documentation

This directory contains comprehensive documentation for feature development in the Bitcoin Trading Game project.

## Documentation Structure

### 📋 Core Documentation
- **[`pattern.md`](./pattern.md)** - Complete feature development pattern and workflow
- **[`checklist.md`](./checklist.md)** - Phase-by-phase development checklist
- **[`search-patterns.md`](./search-patterns.md)** - ChromaDB integration and search patterns

### 💡 Examples
- **[`examples/`](./examples/)** - Complete feature implementation examples
  - [`basic-crud-feature.md`](./examples/basic-crud-feature.md) - Full CRUD feature example
  - [`README.md`](./examples/README.md) - Examples directory guide

## Quick Start Guide

### For New Features
1. **Read the Pattern**: Start with [`pattern.md`](./pattern.md) to understand the complete workflow
2. **Use the Checklist**: Follow [`checklist.md`](./checklist.md) to ensure nothing is missed
3. **Study Examples**: Review [`examples/basic-crud-feature.md`](./examples/basic-crud-feature.md) for implementation details
4. **Setup ChromaDB**: Follow [`search-patterns.md`](./search-patterns.md) for search integration

### For Existing Features
1. **Review Standards**: Check [`pattern.md`](./pattern.md) for current best practices
2. **Quality Check**: Use [`checklist.md`](./checklist.md) to audit existing features
3. **Optimize Search**: Apply [`search-patterns.md`](./search-patterns.md) for better search performance

## Architecture Overview

The Bitcoin Trading Game follows a layered architecture:

```
┌─────────────────────────────────────────────┐
│                Frontend                     │
│  Next.js 14 + TypeScript + Tailwind CSS   │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│                API Layer                    │
│        Next.js API Routes + Auth           │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│              Service Layer                  │
│    Business Logic + ChromaDB Integration   │
└─────────────────────────────────────────────┘
┌─────────────────┬───────────────────────────┐
│   Database      │      Search & AI          │
│ SQLite + Prisma │   ChromaDB + AI Agents    │
└─────────────────┴───────────────────────────┘
```

## Key Technologies

### Core Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, React Hooks
- **Backend**: Node.js, Next.js API Routes, Prisma ORM
- **Database**: SQLite with Prisma for relational data
- **Search**: ChromaDB for semantic search and analytics
- **AI**: Dynamic AI agents with different trading personalities

### Development Tools
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + TypeScript strict mode
- **Formatting**: Prettier
- **Git**: Conventional commits with feature branches

## Development Standards

### Code Quality
- ✅ TypeScript strict mode (no `any` types)
- ✅ Comprehensive error handling
- ✅ Input validation with Zod schemas
- ✅ JSDoc documentation for public APIs
- ✅ >80% test coverage requirement

### Performance
- 🚀 API responses < 500ms
- 🚀 ChromaDB searches < 1s
- 🚀 Database query optimization
- 🚀 Memory leak prevention

### Security
- 🔒 JWT authentication for protected routes
- 🔒 Input sanitization and validation
- 🔒 SQL injection prevention via Prisma
- 🔒 Environment variable security

## Feature Categories

### 1. Data Management Features
Features that primarily handle CRUD operations and data storage.
- Portfolio management
- Trading history
- User preferences
- Agent configurations

### 2. AI Integration Features
Features that involve AI agents and intelligent analysis.
- Market analysis reports
- Trading recommendations
- Sentiment analysis
- Automated trading decisions

### 3. Search & Analytics Features
Features focusing on data discovery and insights.
- Semantic search across trading data
- Performance analytics
- Trend analysis
- Historical data exploration

### 4. Real-time Features
Features requiring live data updates.
- Bitcoin price tracking
- Live portfolio values
- Real-time notifications
- Market alerts

## Common Patterns

### Service Layer Pattern
```typescript
export class FeatureService {
  private chroma: ChromaClient;
  private collection: any = null;
  
  async initialize(): Promise<void> { /* Setup ChromaDB */ }
  async createItem(data: Input): Promise<Output> { /* CRUD operations */ }
  async searchItems(query: string): Promise<SearchResult[]> { /* Search */ }
}
```

### API Route Pattern
```typescript
export async function POST(request: NextRequest) {
  const user = await validateAuth(request);
  const body = await request.json();
  const result = await service.createItem({ ...body, userId: user.id });
  return NextResponse.json({ success: true, data: result });
}
```

### React Hook Pattern
```typescript
export function useFeature() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { post, get } = useApi();
  
  const createItem = async (input) => { /* API calls */ };
  const loadItems = async () => { /* Data fetching */ };
  
  return { data, loading, createItem, loadItems };
}
```

## Getting Help

### Documentation Issues
- Check the [examples directory](./examples/) for complete implementations
- Review [`pattern.md`](./pattern.md) for detailed workflows
- Use [`checklist.md`](./checklist.md) to ensure completeness

### Technical Issues
- Test ChromaDB connection: `npm run test-chroma`
- Reset database: `npx prisma migrate reset`
- View database: `npx prisma studio`
- Run tests: `npm test`

### Best Practices
1. **Always start with planning** - Use the pattern document to design before coding
2. **Test early and often** - Write tests alongside implementation
3. **Document as you go** - Update docs with any pattern changes
4. **Review security** - All features must pass security review
5. **Performance first** - Consider performance implications from the start

## Contributing to Documentation

When adding new patterns or examples:
1. Follow the existing documentation structure
2. Include complete, working code examples
3. Add to the appropriate section in this README
4. Update the ChromaDB collections with searchable content
5. Test all examples before committing

---

*This documentation is maintained as part of the Bitcoin Trading Game development standards. For updates or questions, please refer to the main project repository.*