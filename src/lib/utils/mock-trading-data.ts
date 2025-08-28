import { 
  TradingHistoryItem, 
  PerformanceMetrics, 
  AgentPrompt,
  PromptCategory 
} from '@/types/trading';

// Generate mock trading history
export function generateMockTradingHistory(count: number = 50): TradingHistoryItem[] {
  const symbols = ['BTC', 'ETH', 'SOL', 'MATIC', 'AVAX', 'DOT'];
  const strategies = ['모멘텀 추적', '평균 회귀', '브레이크아웃', '스윙 트레이딩', '차익 거래'];
  
  const trades: TradingHistoryItem[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getTime() - Math.random() * 180 * 24 * 60 * 60 * 1000); // Last 6 months
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const action = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const quantity = Math.random() * 5 + 0.1;
    const price = Math.random() * 50000 + 20000;
    const total = quantity * price;
    const fee = total * 0.001; // 0.1% fee
    
    const trade: TradingHistoryItem = {
      id: `trade-${i}`,
      agentId: 'agent-1',
      symbol,
      action: action as 'BUY' | 'SELL',
      quantity: parseFloat(quantity.toFixed(4)),
      price: parseFloat(price.toFixed(2)),
      timestamp: date,
      reasoning: `${symbol}의 기술적 지표가 ${action === 'BUY' ? '상승' : '하락'} 신호를 보임`,
      strategyUsed: strategies[Math.floor(Math.random() * strategies.length)],
      fee: parseFloat(fee.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    };
    
    // Add result for sell orders and some buy orders (already closed)
    if (action === 'SELL' || Math.random() > 0.3) {
      const profitLoss = (Math.random() - 0.45) * total * 0.2; // -9% to +11% range, slightly positive bias
      const percentReturn = (profitLoss / total) * 100;
      const holdingPeriod = Math.random() * 168 + 1; // 1 to 168 hours (1 week)
      
      trade.result = {
        profitLoss: parseFloat(profitLoss.toFixed(2)),
        percentReturn: parseFloat(percentReturn.toFixed(2)),
        holdingPeriod: parseFloat(holdingPeriod.toFixed(1)),
        exitPrice: price * (1 + percentReturn / 100),
        exitTimestamp: new Date(date.getTime() + holdingPeriod * 60 * 60 * 1000),
      };
    }
    
    trades.push(trade);
  }
  
  return trades.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// Generate mock performance metrics
export function generateMockPerformanceMetrics(trades: TradingHistoryItem[]): PerformanceMetrics {
  const closedTrades = trades.filter(t => t.result);
  const winningTrades = closedTrades.filter(t => t.result && t.result.profitLoss > 0);
  const losingTrades = closedTrades.filter(t => t.result && t.result.profitLoss < 0);
  
  const totalReturn = closedTrades.reduce((sum, t) => sum + (t.result?.profitLoss || 0), 0);
  const totalInvested = closedTrades.reduce((sum, t) => sum + t.total, 0);
  const totalReturnPercent = (totalReturn / totalInvested) * 100;
  
  const winRate = (winningTrades.length / closedTrades.length) * 100;
  
  const averageReturn = closedTrades.length > 0
    ? closedTrades.reduce((sum, t) => sum + (t.result?.percentReturn || 0), 0) / closedTrades.length
    : 0;
    
  const averageWin = winningTrades.length > 0
    ? winningTrades.reduce((sum, t) => sum + (t.result?.percentReturn || 0), 0) / winningTrades.length
    : 0;
    
  const averageLoss = losingTrades.length > 0
    ? losingTrades.reduce((sum, t) => sum + (t.result?.percentReturn || 0), 0) / losingTrades.length
    : 0;
  
  const averageHoldingPeriod = closedTrades.length > 0
    ? closedTrades.reduce((sum, t) => sum + (t.result?.holdingPeriod || 0), 0) / closedTrades.length
    : 0;
  
  // Calculate monthly returns
  const monthlyReturns: Record<string, number> = {};
  closedTrades.forEach(trade => {
    if (trade.result) {
      const month = `${trade.timestamp.getFullYear()}-${String(trade.timestamp.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyReturns[month]) monthlyReturns[month] = 0;
      monthlyReturns[month] += trade.result.percentReturn;
    }
  });
  
  // Generate equity curve
  let currentValue = 100000; // Starting with $100k
  const equityCurve = trades.map((trade, index) => {
    if (trade.result) {
      currentValue += trade.result.profitLoss;
    }
    const drawdown = ((currentValue - 100000) / 100000) * 100;
    return {
      date: trade.timestamp,
      value: currentValue,
      drawdown: Math.min(0, drawdown),
    };
  });
  
  // Find best and worst trades
  const sortedByReturn = closedTrades
    .filter(t => t.result)
    .sort((a, b) => (b.result?.percentReturn || 0) - (a.result?.percentReturn || 0));
  
  const bestTrade = sortedByReturn[0];
  const worstTrade = sortedByReturn[sortedByReturn.length - 1];
  
  // Calculate max drawdown
  let peak = 100000;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;
  
  equityCurve.forEach(point => {
    if (point.value > peak) {
      peak = point.value;
    }
    const drawdown = peak - point.value;
    const drawdownPercent = (drawdown / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPercent = drawdownPercent;
    }
  });
  
  // Calculate Sharpe ratio (simplified)
  const returns = closedTrades.map(t => t.result?.percentReturn || 0);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized
  
  return {
    totalReturn: parseFloat(totalReturn.toFixed(2)),
    totalReturnPercent: parseFloat(totalReturnPercent.toFixed(2)),
    winRate: parseFloat(winRate.toFixed(1)),
    averageReturn: parseFloat(averageReturn.toFixed(2)),
    averageWin: parseFloat(averageWin.toFixed(2)),
    averageLoss: parseFloat(averageLoss.toFixed(2)),
    sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    maxDrawdownPercent: parseFloat(maxDrawdownPercent.toFixed(2)),
    volatility: parseFloat(stdDev.toFixed(2)),
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    averageHoldingPeriod: parseFloat(averageHoldingPeriod.toFixed(1)),
    bestTrade: bestTrade ? {
      symbol: bestTrade.symbol,
      return: bestTrade.result?.percentReturn || 0,
      date: bestTrade.timestamp,
    } : {
      symbol: 'N/A',
      return: 0,
      date: new Date(),
    },
    worstTrade: worstTrade ? {
      symbol: worstTrade.symbol,
      return: worstTrade.result?.percentReturn || 0,
      date: worstTrade.timestamp,
    } : {
      symbol: 'N/A',
      return: 0,
      date: new Date(),
    },
    monthlyReturns,
    equityCurve,
  };
}

// Generate mock agent prompts
export function generateMockAgentPrompts(agentId: string): AgentPrompt[] {
  const categories: PromptCategory[] = [
    'personality',
    'strategy',
    'analysis',
    'risk_management',
    'market_interpretation',
    'decision_making',
  ];
  
  const promptTemplates: Record<PromptCategory, string[]> = {
    personality: [
      `당신은 {{agentName}}이며, {{personality}} 성향을 가진 투자 AI입니다.
항상 신중하고 체계적인 접근을 통해 시장을 분석하며,
감정적 판단을 배제하고 데이터 기반의 의사결정을 내립니다.`,
      `투자 철학: 장기적 가치 투자를 추구하며, 단기적 변동성에 흔들리지 않습니다.
리스크 관리를 최우선으로 하며, 자본 보전을 중요시합니다.`,
    ],
    strategy: [
      `주요 전략: {{strategies}}
- 기술적 분석과 기본적 분석을 균형있게 활용
- 시장 트렌드를 파악하여 적절한 진입/청산 시점 결정
- 포트폴리오 다각화를 통한 리스크 분산`,
      `거래 규칙:
1. 손절선: -5%
2. 목표 수익률: +10%
3. 포지션 크기: 전체 자본의 최대 20%`,
    ],
    analysis: [
      `분석 방법론:
- RSI, MACD, 볼린저 밴드 등 기술적 지표 활용
- 거래량 분석을 통한 추세 강도 확인
- 지지/저항선 식별 및 활용`,
      `시장 분석 프레임워크:
1. 거시경제 지표 모니터링
2. 섹터별 순환 패턴 분석
3. 개별 자산의 펀더멘털 평가`,
    ],
    risk_management: [
      `리스크 관리 원칙:
- 켈리 공식을 활용한 포지션 사이징
- VAR(Value at Risk) 모니터링
- 상관관계 분석을 통한 포트폴리오 최적화`,
      `자금 관리:
- 단일 거래 최대 리스크: 2%
- 일일 최대 손실 한도: 5%
- 월간 최대 손실 한도: 15%`,
    ],
    market_interpretation: [
      `시장 심리 해석:
- 공포/탐욕 지수 모니터링
- 뉴스 센티먼트 분석
- 소셜 미디어 트렌드 추적`,
      `시장 사이클 인식:
- 축적 → 상승 → 분배 → 하락 사이클 식별
- 각 단계별 적절한 전략 적용`,
    ],
    decision_making: [
      `의사결정 프로세스:
1. 시그널 확인 (최소 3개 이상 일치)
2. 리스크/보상 비율 계산 (최소 1:2)
3. 포지션 크기 결정
4. 진입 실행 및 모니터링`,
      `거래 체크리스트:
□ 트렌드 방향 확인
□ 지지/저항 레벨 확인
□ 거래량 패턴 분석
□ 리스크 관리 계획 수립`,
    ],
  };
  
  const prompts: AgentPrompt[] = [];
  
  categories.forEach((category, catIndex) => {
    const templates = promptTemplates[category];
    templates.forEach((template, templateIndex) => {
      const prompt: AgentPrompt = {
        id: `prompt-${catIndex}-${templateIndex}`,
        agentId,
        category,
        content: template,
        version: Math.floor(Math.random() * 3) + 1,
        isActive: Math.random() > 0.3,
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        previousVersions: [],
      };
      
      // Add some version history
      if (prompt.version > 1) {
        for (let v = prompt.version - 1; v > 0 && v > prompt.version - 3; v--) {
          prompt.previousVersions.push({
            content: template + `\n\n[버전 ${v} 수정사항]`,
            version: v,
            timestamp: new Date(Date.now() - (prompt.version - v) * 30 * 24 * 60 * 60 * 1000),
            changeReason: `성능 개선 및 정확도 향상 (v${v})`,
          });
        }
      }
      
      prompts.push(prompt);
    });
  });
  
  return prompts;
}