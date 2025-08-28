# Portfolio Management System

## Overview

Comprehensive portfolio management system for tracking Bitcoin holdings, cash balance, and real-time performance metrics in a trading simulation environment.

## Core Features

### 1. Real-time Portfolio Tracking
- **Live Valuation**: Automatic portfolio value updates every 10 minutes
- **Multi-asset Support**: Cash (USD) and Bitcoin (BTC) holdings
- **Performance Metrics**: Profit/loss tracking with percentage calculations
- **Historical Context**: Initial investment baseline ($10,000)

### 2. Asset Allocation Visualization
- **Interactive Charts**: Real-time allocation breakdown
- **Percentage Distribution**: Visual representation of cash vs crypto
- **Dynamic Updates**: Allocation changes with price movements
- **Performance Indicators**: Color-coded profit/loss displays

### 3. Advanced Portfolio Analytics
- **Total Value Tracking**: Combined cash and crypto holdings
- **Profit/Loss Calculation**: Real-time P&L with percentage changes
- **Risk Assessment**: Portfolio concentration metrics
- **Performance Benchmarking**: Comparison to initial investment

## Technical Architecture

### Database Schema

#### Portfolio Table
```sql
CREATE TABLE portfolios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id VARCHAR(255) UNIQUE DEFAULT 'demo-user',
  balance REAL DEFAULT 10000.0,           -- Cash balance in USD
  bitcoin_holdings REAL DEFAULT 0.0,      -- BTC amount
  total_value REAL DEFAULT 10000.0,       -- Combined USD value
  profit REAL DEFAULT 0.0,                -- Total profit/loss in USD
  profit_percentage REAL DEFAULT 0.0,     -- P&L percentage
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Trade History Table
```sql
CREATE TABLE trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id VARCHAR(255) DEFAULT 'demo-user',
  type VARCHAR(10) NOT NULL,              -- 'buy' or 'sell'
  amount REAL NOT NULL,                   -- BTC amount
  price REAL NOT NULL,                    -- BTC price at trade
  total REAL NOT NULL,                    -- Total USD value
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Core Services

#### Portfolio Service Methods
```typescript
class BitcoinPriceService {
  // Portfolio initialization
  async initializeDemoPortfolio(): Promise<Portfolio>
  
  // Real-time value updates
  async updatePortfolioValue(): Promise<Portfolio | null>
  
  // Trading execution
  async executeTrade(type: 'buy' | 'sell', amount: number): Promise<{success: boolean, message: string}>
  
  // Portfolio retrieval
  async getDemoPortfolio(): Promise<Portfolio | null>
  
  // Trade history
  async getTradeHistory(limit: number): Promise<Trade[]>
}
```

### Portfolio Calculations

#### Total Value Calculation
```typescript
const bitcoinValue = portfolio.bitcoinHoldings * currentBTCPrice;
const totalValue = portfolio.balance + bitcoinValue;
```

#### Profit/Loss Calculation
```typescript
const profit = totalValue - INITIAL_INVESTMENT; // $10,000
const profitPercentage = (profit / INITIAL_INVESTMENT) * 100;
```

#### Asset Allocation Calculation
```typescript
const cashPercentage = (portfolio.balance / portfolio.totalValue) * 100;
const bitcoinPercentage = (bitcoinValue / portfolio.totalValue) * 100;
```

## API Endpoints

### GET /api/portfolio
Retrieves current portfolio status and metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": "demo-user",
    "balance": 8500.00,
    "bitcoinHoldings": 0.031415,
    "totalValue": 10003.45,
    "profit": 3.45,
    "profitPercentage": 0.03,
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

### POST /api/trade
Executes buy or sell trades.

**Request:**
```json
{
  "type": "buy",
  "amount": 0.001
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bought 0.001 BTC for $47.85",
  "trade": {
    "id": 123,
    "type": "buy",
    "amount": 0.001,
    "price": 47850.00,
    "total": 47.85,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### GET /api/trades
Retrieves trade history.

**Parameters:**
- `limit` (optional): Number of trades to return (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "userId": "demo-user",
      "type": "buy",
      "amount": 0.001,
      "price": 47850.00,
      "total": 47.85,
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

## Component Implementation

### PortfolioTable Component

#### Key Features
```typescript
interface PortfolioTableProps {
  className?: string;
  refreshInterval?: number; // minutes (default: 10)
}

// Main sections:
// 1. Portfolio Overview Cards
// 2. Asset Allocation Visualization  
// 3. Performance Metrics
// 4. Real-time Updates
```

#### Visual Elements
1. **Total Value Card**: Combined portfolio worth
2. **P&L Card**: Profit/loss with trend indicators
3. **BTC Holdings Card**: Bitcoin amount and USD value
4. **Cash Balance Card**: Available USD for trading

#### Interactive Features
- **Manual Refresh**: Force portfolio update
- **Real-time Updates**: Auto-refresh every 10 minutes
- **Responsive Design**: Mobile-friendly layout
- **Error Handling**: Network error recovery

### Dashboard Integration

#### Layout Structure
```tsx
// Dashboard page structure
<div className="dashboard">
  {/* Price Ticker */}
  <PriceTicker />
  
  {/* Portfolio Stats (Legacy - Simple) */}
  <PortfolioStats />
  
  {/* Trading Panel */}
  <div className="grid grid-cols-2">
    <BitcoinChart />
    <AIAnalysis />
  </div>
  
  {/* Trade History Table */}
  <TradeHistoryTable />
  
  {/* Enhanced Portfolio Overview */}
  <PortfolioTable />
</div>
```

## Performance Optimization

### Caching Strategy
```typescript
// Client-side caching for portfolio data
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const cachedPortfolio = localStorage.getItem('portfolio');
const cacheTime = localStorage.getItem('portfolioTime');
```

### Database Optimization
- Indexed queries on `userId` and `timestamp`
- Efficient JOIN operations for trade history
- Connection pooling with Prisma ORM

### Real-time Updates
```typescript
// Auto-refresh mechanism
useEffect(() => {
  const interval = setInterval(() => {
    fetchPortfolioData();
  }, refreshInterval * 60 * 1000);
  
  return () => clearInterval(interval);
}, [refreshInterval]);
```

## Trading Logic

### Buy Transaction
```typescript
if (portfolio.balance < totalCost) {
  return { success: false, message: 'Insufficient balance' };
}

await prisma.$transaction([
  // Deduct cash
  prisma.portfolio.update({
    where: { userId: 'demo-user' },
    data: {
      balance: { decrement: totalCost },
      bitcoinHoldings: { increment: amount }
    }
  }),
  // Record trade
  prisma.trade.create({
    data: { userId, type: 'buy', amount, price, total: totalCost }
  })
]);
```

### Sell Transaction
```typescript
if (portfolio.bitcoinHoldings < amount) {
  return { success: false, message: 'Insufficient Bitcoin holdings' };
}

await prisma.$transaction([
  // Add cash, remove BTC
  prisma.portfolio.update({
    where: { userId: 'demo-user' },
    data: {
      balance: { increment: totalValue },
      bitcoinHoldings: { decrement: amount }
    }
  }),
  // Record trade
  prisma.trade.create({
    data: { userId, type: 'sell', amount, price, total: totalValue }
  })
]);
```

## Error Handling

### Common Scenarios
1. **Insufficient Funds**: Clear error messages for failed trades
2. **Network Errors**: Retry mechanisms and user feedback
3. **Database Errors**: Graceful degradation and error recovery
4. **Price Data Issues**: Fallback to cached values

### Error Recovery
```typescript
try {
  await fetchPortfolioData();
} catch (error) {
  setError(error.message);
  // Attempt recovery with cached data
  const cachedData = localStorage.getItem('portfolio');
  if (cachedData) {
    setPortfolio(JSON.parse(cachedData));
  }
}
```

## Security Considerations

### Data Validation
- Input sanitization for trade amounts
- Boundary checks for portfolio calculations
- Type safety with TypeScript interfaces

### Transaction Safety
- Database transactions for atomic operations
- Rollback mechanisms for failed trades
- Audit trail for all portfolio changes

## Testing Strategy

### Unit Tests
```typescript
// Portfolio calculation tests
describe('Portfolio Calculations', () => {
  test('should calculate total value correctly', () => {
    const result = calculateTotalValue(balance, btcHoldings, btcPrice);
    expect(result).toBe(expectedValue);
  });
  
  test('should handle zero holdings', () => {
    const result = calculateProfitPercentage(0, INITIAL_INVESTMENT);
    expect(result).toBe(0);
  });
});
```

### Integration Tests
- API endpoint validation
- Database transaction integrity
- Component rendering with real data

### Performance Tests
- Portfolio calculation speed
- Database query optimization
- Component render performance

## Monitoring & Analytics

### Key Metrics
1. **Portfolio Performance**: Track profit/loss over time
2. **Trading Activity**: Monitor buy/sell patterns
3. **System Performance**: API response times
4. **Error Rates**: Failed transactions and network errors

### Logging
```typescript
console.log(`Portfolio updated: ${portfolio.totalValue}`);
console.log(`P&L: ${portfolio.profit} (${portfolio.profitPercentage}%)`);
console.log(`Allocation: ${cashPercentage}% cash, ${btcPercentage}% BTC`);
```

## Future Enhancements

### Planned Features
1. **Multiple Portfolios**: Support for different trading strategies
2. **Advanced Metrics**: Sharpe ratio, maximum drawdown
3. **Rebalancing**: Automatic portfolio rebalancing
4. **Export Features**: Portfolio history export
5. **Benchmarking**: Compare against market indices

### Technical Improvements
1. **WebSocket Updates**: Real-time portfolio streaming
2. **Advanced Caching**: Redis integration
3. **Backup & Recovery**: Portfolio data backup
4. **Multi-user Support**: Individual user portfolios

## Usage Guidelines

### Best Practices
1. Monitor portfolio allocation regularly
2. Use stop-loss strategies for risk management
3. Diversify investments (when multi-asset support is added)
4. Track performance against benchmarks

### Performance Tips
1. Keep trade history reasonable (automatic cleanup)
2. Monitor for memory leaks in real-time updates
3. Use browser caching effectively
4. Optimize database queries for large datasets