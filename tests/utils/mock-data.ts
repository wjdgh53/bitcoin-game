// Mock data for testing

export const mockAgents = [
  {
    id: 'agent-1',
    name: 'Conservative Bob',
    type: 'conservative-agent-1234567890',
    personality: 'conservative',
    strategy: ['가치 투자', '장기 보유', '리스크 관리'],
    description: '안정적이고 보수적인 투자 전략을 선호하는 AI 에이전트입니다.',
    isActive: true,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
    patterns: [
      {
        id: 'pattern-1',
        name: '가치주 저점 매수',
        description: 'PER 10 이하, PBR 1 이하인 가치주를 찾아 매수하는 패턴',
        priority: 1,
        confidenceRate: 85,
        examples: ['삼성전자 55,000원 매수', 'LG화학 380,000원 매수'],
        isActive: true,
        createdAt: '2024-01-15T10:00:00.000Z'
      },
      {
        id: 'pattern-2', 
        name: '배당주 장기보유',
        description: '배당수익률 4% 이상인 우량주를 장기 보유하는 패턴',
        priority: 2,
        confidenceRate: 78,
        examples: ['SK텔레콤 장기보유', '한국전력 배당주 보유'],
        isActive: true,
        createdAt: '2024-01-16T10:00:00.000Z'
      }
    ],
    watchlistItems: [
      {
        id: 'watchlist-1',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        category: '가치투자',
        reason: 'PER 대비 저평가되어 있으며, 안정적인 수익 구조',
        agentView: '현재 주가가 적정 가치보다 15% 저평가된 것으로 판단됩니다.',
        alertPrice: 150.0,
        alertType: 'below',
        addedAt: '2024-01-15T10:00:00.000Z',
        lastReviewedAt: '2024-01-20T10:00:00.000Z'
      }
    ]
  },
  {
    id: 'agent-2',
    name: 'Aggressive Alice',
    type: 'aggressive-agent-1234567891',
    personality: 'aggressive',
    strategy: ['모멘텀 트레이딩', '기술적 분석', '단기 매매'],
    description: '공격적이고 수익성을 추구하는 단기 트레이딩 전문 AI 에이전트입니다.',
    isActive: true,
    createdAt: '2024-01-16T10:00:00.000Z',
    updatedAt: '2024-01-16T10:00:00.000Z',
    patterns: [
      {
        id: 'pattern-3',
        name: '돌파매수 패턴',
        description: '저항선 돌파 시 즉시 매수하는 모멘텀 패턴',
        priority: 1,
        confidenceRate: 92,
        examples: ['비트코인 70,000$ 돌파 매수', '테슬라 250$ 돌파 매수'],
        isActive: true,
        createdAt: '2024-01-16T10:00:00.000Z'
      }
    ],
    watchlistItems: [
      {
        id: 'watchlist-2',
        symbol: 'BTC',
        name: 'Bitcoin',
        category: '단기트레이딩',
        reason: '강력한 상승 모멘텀과 높은 변동성',
        agentView: '단기적으로 20% 이상 상승 가능성이 높다고 판단됩니다.',
        alertPrice: 75000.0,
        alertType: 'above',
        addedAt: '2024-01-16T10:00:00.000Z',
        lastReviewedAt: '2024-01-21T10:00:00.000Z'
      }
    ]
  },
  {
    id: 'agent-3',
    name: 'Balanced Charlie',
    type: 'balanced-agent-1234567892',
    personality: 'balanced',
    strategy: ['포트폴리오 다변화', 'DCA (분할매수)', '기술적 분석'],
    description: '균형잡힌 포트폴리오 관리와 리스크 분산을 중시하는 AI 에이전트입니다.',
    isActive: false,
    createdAt: '2024-01-17T10:00:00.000Z',
    updatedAt: '2024-01-17T10:00:00.000Z',
    patterns: [],
    watchlistItems: []
  }
];

export const mockChatMessages = [
  {
    id: 'msg-1',
    agentId: 'agent-1',
    userId: 'user-1',
    content: '안녕하세요, 현재 시장 상황에 대해 어떻게 생각하시나요?',
    type: 'user' as const,
    metadata: '{}',
    isRead: true,
    createdAt: '2024-01-22T10:00:00.000Z',
    updatedAt: '2024-01-22T10:00:00.000Z'
  },
  {
    id: 'msg-2',
    agentId: 'agent-1',
    userId: 'user-1',
    content: '안녕하세요! 현재 시장은 불확실성이 높은 상황입니다. 보수적인 관점에서 볼 때, 안전 자산에 대한 비중을 높이고 가치주 중심의 포트폴리오를 구성하는 것을 추천드립니다.',
    type: 'agent' as const,
    metadata: '{"confidence": 0.85}',
    isRead: true,
    createdAt: '2024-01-22T10:01:00.000Z',
    updatedAt: '2024-01-22T10:01:00.000Z'
  }
];

export const mockReports = [
  {
    id: 'report-1',
    title: '2024년 1월 주간 투자 분석 보고서',
    content: '이번 주 주요 시장 동향과 투자 기회를 분석한 보고서입니다.',
    type: 'weekly',
    status: 'published',
    createdAt: '2024-01-22T00:00:00.000Z',
    updatedAt: '2024-01-22T00:00:00.000Z'
  },
  {
    id: 'report-2', 
    title: 'AI 에이전트 성과 분석 리포트',
    content: '지난달 AI 에이전트들의 투자 성과를 분석한 보고서입니다.',
    type: 'performance',
    status: 'draft',
    createdAt: '2024-01-21T00:00:00.000Z',
    updatedAt: '2024-01-21T00:00:00.000Z'
  }
];

export const mockBitcoinData = {
  current: {
    price: 67850.25,
    change: 1245.30,
    changePercent: 1.87,
    lastUpdated: '2024-01-22T10:30:00.000Z'
  },
  history: [
    { timestamp: '2024-01-21T00:00:00.000Z', price: 66605 },
    { timestamp: '2024-01-20T00:00:00.000Z', price: 65420 },
    { timestamp: '2024-01-19T00:00:00.000Z', price: 68150 },
    { timestamp: '2024-01-18T00:00:00.000Z', price: 69200 },
    { timestamp: '2024-01-17T00:00:00.000Z', price: 67800 }
  ]
};

export const mockPortfolio = {
  totalValue: 125000.50,
  dailyChange: 2350.25,
  dailyChangePercent: 1.92,
  positions: [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      quantity: 1.5,
      avgPrice: 65000,
      currentPrice: 67850.25,
      totalValue: 101775.38,
      unrealizedPnL: 4275.38,
      unrealizedPnLPercent: 4.37
    },
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      quantity: 150,
      avgPrice: 150,
      currentPrice: 155.50,
      totalValue: 23325,
      unrealizedPnL: 825,
      unrealizedPnLPercent: 3.67
    }
  ]
};

export const mockTradeHistory = [
  {
    id: 'trade-1',
    symbol: 'BTC',
    type: 'buy',
    quantity: 0.5,
    price: 65000,
    totalAmount: 32500,
    timestamp: '2024-01-20T10:30:00.000Z',
    agentId: 'agent-1'
  },
  {
    id: 'trade-2',
    symbol: 'AAPL',
    type: 'sell',
    quantity: 50,
    price: 155,
    totalAmount: 7750,
    timestamp: '2024-01-19T14:15:00.000Z',
    agentId: 'agent-2'
  }
];