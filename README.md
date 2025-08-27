# 🚀 Bitcoin Trading Game with AI Agents

A sophisticated Bitcoin trading simulation game featuring dynamic AI agents with unique personalities and trading strategies. Built with Next.js 14, TypeScript, and advanced AI integration.

## ✨ Features

### 🤖 Dynamic AI Trading Agents
- **Conservative Agent**: Long-term value investing approach with risk management focus
- **Aggressive Agent**: High-frequency momentum trading with quick decision making
- **Quantitative Agent**: Statistical and mathematical analysis using Z-scores and volatility metrics
- **Balanced Agent**: Risk-reward optimization with moderate approach
- **Contrarian Agent**: Counter-trend investment strategies

### 📊 Real-Time Market Data
- Live Bitcoin price tracking via CoinGecko API
- 15-minute automated price updates
- Historical price data storage and analysis
- Portfolio performance tracking with profit/loss calculations

### 📈 Comprehensive Dashboard
- Real-time portfolio overview
- Interactive trading history
- AI-generated market analysis reports
- Agent management and customization

### 🎯 Agent Management System
- Create custom agents with different personalities
- Select from 15+ predefined trading strategies
- Dynamic report generation based on agent characteristics
- Filter and view reports by specific agents

## 🛠️ Technical Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Node.js API routes with RESTful architecture
- **Database**: SQLite with Prisma ORM for data management
- **AI/ML**: ChromaDB for vector storage and advanced analytics
- **Real-time**: Scheduled price updates with node-cron
- **UI/UX**: Responsive design with Lucide React icons

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/wjdgh53/bitcoin-game.git
cd bitcoin-game
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Add your environment variables (optional for development)
```

4. **Initialize the database**
```bash
npx prisma generate
npx prisma db push
```

5. **Start the development server**
```bash
npm run dev
```

6. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 API Endpoints

### Agents
- `GET /api/agents` - List all agents
- `POST /api/agents` - Create new agent
- `PUT /api/agents/[id]` - Update agent
- `DELETE /api/agents/[id]` - Delete agent

### Reports
- `GET /api/reports` - Get all reports
- `GET /api/reports?agent=[type]` - Filter reports by agent
- `POST /api/reports` - Generate new report
- `GET /api/reports/[id]` - Get specific report

### Portfolio & Trading
- `GET /api/portfolio` - Get portfolio status
- `GET /api/trades` - Get trading history
- `GET /api/bitcoin/current` - Get current Bitcoin price
- `GET /api/bitcoin/history` - Get price history

## 🧠 AI Agent Personalities

### Conservative Agent 🛡️
- **Philosophy**: "Safety first, profits second"
- **Strategy**: Long-term value investing with strict risk management
- **Triggers**: Acts on significant moves (±8%+), high portfolio profits (20%+)
- **Focus**: Stability, capital preservation, dividend-like steady growth

### Aggressive Agent ⚡
- **Philosophy**: "Strike fast, strike hard"
- **Strategy**: Momentum-based rapid trading with high leverage
- **Triggers**: Quick reactions to small moves (±2%), momentum shifts
- **Focus**: Maximum profit potential, rapid execution, trend following

### Quantitative Agent 📊
- **Philosophy**: "Numbers don't lie"
- **Strategy**: Mathematical models, statistical analysis, Z-scores
- **Triggers**: Statistical outliers (Z-score ±1.2), volatility patterns
- **Focus**: Data-driven decisions, backtested strategies, risk metrics

### Balanced Agent ⚖️
- **Philosophy**: "Steady wins the race"
- **Strategy**: Risk-reward optimization with diversification
- **Triggers**: Moderate moves (±5%), portfolio rebalancing opportunities
- **Focus**: Consistent returns, balanced risk exposure, stability

### Contrarian Agent 🔄
- **Philosophy**: "When others are fearful, be greedy"
- **Strategy**: Counter-trend investing, buying dips, selling peaks
- **Triggers**: Extreme market sentiment (±5%+ moves), momentum reversals
- **Focus**: Value opportunities, market corrections, anti-trend positions

## 🗄️ Database Schema

### Agents Table
```sql
- id: String (CUID)
- name: String (unique)
- type: String (auto-generated, unique)
- personality: Enum (conservative|aggressive|balanced|quantitative|contrarian)
- strategy: JSON Array (selected strategies)
- description: String
- isActive: Boolean
- createdAt/updatedAt: DateTime
```

### Analysis Reports Table
```sql
- id: String
- agentName/agentType: String
- recommendation: Enum (buy|sell|hold)
- confidence: Float (0-100)
- title/executiveSummary: String
- marketAnalysis/technicalAnalysis: String
- riskAssessment/strategyRationale: String
- currentPrice/priceChange24h: Float
- trend/momentum: String/Float
```

## 📁 Project Structure

```
bitcoin-game/
├── src/
│   ├── app/
│   │   ├── agents/          # Agent management page
│   │   ├── dashboard/       # Trading dashboard
│   │   ├── reports/         # AI analysis reports
│   │   └── api/            # API routes
│   ├── components/         # Reusable UI components
│   ├── lib/
│   │   ├── services/       # Business logic services
│   │   ├── database/       # Database connections
│   │   └── scheduler/      # Background tasks
│   └── types/              # TypeScript definitions
├── prisma/                 # Database schema & migrations
└── scripts/                # Utility scripts
```

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npx prisma studio        # Database GUI
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema changes

# Testing
npm run lint             # ESLint check
npm run type-check       # TypeScript check
```

## 🌟 Key Features in Detail

### Dynamic Agent Creation
- Users can create unlimited AI agents
- Each agent has a unique personality that affects its analysis
- 15+ trading strategies to choose from (Value Investing, Momentum Trading, Technical Analysis, etc.)
- Strategies are stored as JSON arrays for maximum flexibility

### Intelligent Report Generation
- Each agent generates unique market analysis based on its personality
- Reports include executive summary, market analysis, technical analysis, risk assessment
- Confidence scores and recommendations (buy/sell/hold)
- Real-time price data integration

### Advanced Portfolio Tracking
- Real-time portfolio value calculations
- Profit/loss tracking with percentages
- Complete trading history with timestamps
- Balance and Bitcoin holdings management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- CoinGecko API for real-time Bitcoin price data
- Vercel for deployment platform
- The open-source community for amazing tools and libraries

---

**Built with ❤️ using Claude Code**

*This project was developed as a demonstration of advanced AI integration in financial applications and serves as an educational tool for understanding cryptocurrency markets and AI-driven trading strategies.*
