# Bitcoin Price Simulation & Live Dashboard

## Overview

This feature implements a realistic Bitcoin price simulation system with live updates, historical data storage, and comprehensive dashboard visualization.

## Key Features

### 1. Realistic Price Simulation
- **Algorithm**: Random walk with momentum-based price movement
- **Volatility**: 2% typical volatility with realistic bounds
- **Price Range**: $10,000 - $150,000 safety bounds
- **Base Price**: Starts from real market data or fallback to $45k-$55k range

### 2. Live Price Updates
- **Frequency**: Every 10 minutes (configurable)
- **Scheduler**: Node-cron based automatic updates
- **Persistence**: All price data stored in SQLite database
- **History Cleanup**: Automatically removes data older than 7 days

### 3. Portfolio Management
- **Real-time Valuation**: Portfolio value updates with each price change
- **Asset Allocation**: Visual breakdown of cash vs Bitcoin holdings
- **P&L Tracking**: Real-time profit/loss calculation with percentages
- **Initial Investment**: $10,000 starting balance

### 4. Live Dashboard Chart
- **Library**: Chart.js with responsive design
- **Data Points**: Real-time price history visualization
- **Interactivity**: Hover tooltips with price changes
- **Statistics**: High/Low/Current price display
- **Auto-refresh**: Chart updates every 10 minutes

## Technical Implementation

### Database Schema

#### BitcoinPrice Table
```sql
CREATE TABLE bitcoin_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  price REAL NOT NULL,
  volume REAL,
  market_cap REAL,
  change_24h REAL,
  change_percentage_24h REAL,
  high_24h REAL,
  low_24h REAL,
  source VARCHAR(255) DEFAULT 'realistic-simulation'
);
```

#### Portfolio Table
```sql
CREATE TABLE portfolios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id VARCHAR(255) UNIQUE DEFAULT 'demo-user',
  balance REAL DEFAULT 10000.0,
  bitcoin_holdings REAL DEFAULT 0.0,
  total_value REAL DEFAULT 10000.0,
  profit REAL DEFAULT 0.0,
  profit_percentage REAL DEFAULT 0.0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Price Generation Algorithm

```typescript
private generateRealisticPrice(lastPrice: number) {
  const volatility = 0.02; // 2% volatility
  const trend = (Math.random() - 0.5) * 0.001; // Small random trend
  
  const randomComponent = (Math.random() - 0.5) * volatility;
  const momentumComponent = trend;
  
  const priceChange = lastPrice * (randomComponent + momentumComponent);
  let newPrice = lastPrice + priceChange;
  
  // Safety bounds
  newPrice = Math.max(10000, Math.min(150000, newPrice));
  
  return {
    price: Math.round(newPrice * 100) / 100,
    volume: baseVolume * volumeMultiplier * (0.8 + Math.random() * 0.4),
    marketCap: Math.round(newPrice * 19700000),
    // ... other calculated fields
  };
}
```

### Scheduler Configuration

```typescript
// Updates every 10 minutes
cron.schedule('0 */10 * * * *', async () => {
  await this.updatePrice();
}, {
  scheduled: true,
  timezone: 'America/New_York'
});
```

## API Endpoints

### GET /api/bitcoin/current
Returns the latest Bitcoin price data.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "price": 47850.23,
    "volume": 523000000,
    "marketCap": 942495530000,
    "change24h": 1250.45,
    "changePercentage24h": 2.68,
    "high24h": 48100.00,
    "low24h": 46500.00,
    "source": "realistic-simulation"
  }
}
```

### GET /api/bitcoin/history?hours=24
Returns Bitcoin price history for the specified time range.

**Parameters:**
- `hours` (optional): Number of hours to fetch (1-168, default: 24)

**Response:**
```json
{
  "success": true,
  "data": [...], // Array of BitcoinPrice objects
  "count": 144,
  "timeRange": "24 hours"
}
```

### GET /api/portfolio
Returns current portfolio information.

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

## Component Structure

### BitcoinChart Component
- **Location**: `src/components/charts/BitcoinChart.tsx`
- **Props**: `height`, `timeRange`, `className`
- **Features**: Live chart with Chart.js, price statistics, auto-refresh

### PortfolioTable Component
- **Location**: `src/components/portfolio/PortfolioTable.tsx`
- **Props**: `className`, `refreshInterval`
- **Features**: Asset allocation visualization, performance metrics, real-time updates

## Configuration Options

### Environment Variables
```env
NODE_ENV=development
DATABASE_URL="file:./dev.db"
```

### Scheduler Settings
- **Update Interval**: 10 minutes (configurable in `price-scheduler.ts`)
- **Data Retention**: 7 days (configurable in cleanup function)
- **Timezone**: America/New_York (configurable in scheduler)

## Performance Considerations

### Caching Strategy
- Client-side price caching (15 minutes)
- Database indexing on timestamp fields
- Automatic cleanup of old data

### Memory Management
- Batch database operations
- Connection pooling with Prisma
- Efficient chart data processing

## Testing Strategy

### Price Simulation Testing
```bash
npm run test-bitcoin  # Test price generation and API endpoints
```

### Integration Testing
- Price update workflow
- Portfolio calculation accuracy
- Chart data consistency
- API endpoint responses

## Monitoring & Logging

### Price Update Logs
```
✅ Realistic price update completed in 156ms
💰 Bitcoin Price: $47,850 (realistic-simulation)
📊 24h Change: +2.68%
📈 Volume: 523,000,000
⏰ Next update in 10 minutes
```

### Error Handling
- API fallback mechanisms
- Database connection retry logic
- Client-side error recovery
- Graceful degradation for chart display

## Future Enhancements

### Planned Features
1. **Multi-timeframe Charts**: 1H, 4H, 1D, 1W views
2. **Technical Indicators**: RSI, MACD, Moving Averages
3. **Price Alerts**: Custom price threshold notifications
4. **Historical Analysis**: Backtesting with simulated data
5. **Market Events**: Simulated news impact on price movement

### Scalability Improvements
1. **Database Migration**: PostgreSQL for production
2. **Real-time Updates**: WebSocket integration
3. **Multiple Assets**: Ethereum, other cryptocurrencies
4. **Advanced Analytics**: Volatility modeling, trend analysis

## Usage Instructions

### For Users
1. Navigate to `/dashboard` to view live price updates
2. Price updates automatically every 10 minutes
3. Portfolio values are recalculated in real-time
4. Historical data is available via interactive charts

### For Developers
1. Start the development server: `npm run dev`
2. Price scheduler auto-starts in development mode
3. Manual price updates available via API
4. Database migrations handled by Prisma

## Troubleshooting

### Common Issues
1. **Price not updating**: Check scheduler logs and database connection
2. **Chart not loading**: Verify Chart.js dependencies and API endpoints
3. **Portfolio calculation errors**: Check price data consistency
4. **Performance issues**: Monitor database query performance and cleanup old data

### Debug Commands
```bash
# Test price service
npm run test-bitcoin

# Check database status
npx prisma studio

# View scheduler logs
# Check console output in development mode
```