// Trading history and performance types for agent detail page enhancements

export interface TradingHistoryItem {
  id: string;
  agentId: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: Date;
  reasoning: string;
  strategyUsed: string;
  result?: TradeResult;
  fee: number;
  total: number;
}

export interface TradeResult {
  profitLoss: number;
  percentReturn: number;
  holdingPeriod: number; // in hours
  exitPrice?: number;
  exitTimestamp?: Date;
}

export interface PerformanceMetrics {
  totalReturn: number;
  totalReturnPercent: number;
  winRate: number;
  averageReturn: number;
  averageWin: number;
  averageLoss: number;
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  volatility: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageHoldingPeriod: number;
  bestTrade: {
    symbol: string;
    return: number;
    date: Date;
  };
  worstTrade: {
    symbol: string;
    return: number;
    date: Date;
  };
  monthlyReturns: Record<string, number>; // year-month: return
  equityCurve: EquityPoint[];
}

export interface EquityPoint {
  date: Date;
  value: number;
  drawdown: number;
}

export interface AgentPrompt {
  id: string;
  agentId: string;
  category: PromptCategory;
  content: string;
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  previousVersions: PromptVersion[];
}

export type PromptCategory = 
  | 'personality'
  | 'strategy'
  | 'analysis'
  | 'risk_management'
  | 'market_interpretation'
  | 'decision_making';

export interface PromptVersion {
  content: string;
  version: number;
  timestamp: Date;
  changeReason?: string;
}

// Filter and sorting types for trading history
export interface TradingHistoryFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  symbol?: string;
  action?: 'BUY' | 'SELL' | 'ALL';
  outcome?: 'profitable' | 'unprofitable' | 'all';
  minAmount?: number;
  maxAmount?: number;
  strategy?: string;
}

export type TradingHistorySortField = 
  | 'timestamp'
  | 'symbol'
  | 'profitLoss'
  | 'percentReturn'
  | 'quantity'
  | 'price'
  | 'total';

export interface TradingHistorySortConfig {
  field: TradingHistorySortField;
  direction: 'asc' | 'desc';
}

// Chart data types for performance visualization
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  tooltip?: string;
}

export interface HeatmapData {
  month: string;
  year: number;
  return: number;
  trades: number;
}

// Export format types
export interface ExportConfig {
  format: 'csv' | 'json' | 'xlsx';
  includeMetrics: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Real-time update types
export interface TradeUpdate {
  type: 'new_trade' | 'trade_closed' | 'metrics_update';
  data: TradingHistoryItem | PerformanceMetrics;
  timestamp: Date;
}

// Benchmark comparison types
export interface BenchmarkData {
  name: string;
  symbol: string;
  returns: Array<{
    date: Date;
    value: number;
  }>;
  totalReturn: number;
  volatility: number;
  sharpeRatio: number;
}