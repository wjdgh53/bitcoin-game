'use client';

import React, { useState, useMemo } from 'react';
import { PerformanceMetrics, HeatmapData, ChartDataPoint } from '@/types/trading';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Percent,
  Calendar,
  Award,
  AlertTriangle,
  BarChart3,
  PieChart,
  Target,
  Clock,
} from 'lucide-react';

interface PerformanceMetricsProps {
  metrics: PerformanceMetrics;
  onBenchmarkCompare?: () => void;
}

export default function PerformanceMetricsComponent({ 
  metrics, 
  onBenchmarkCompare 
}: PerformanceMetricsProps) {
  const [selectedChart, setSelectedChart] = useState<'equity' | 'returns' | 'drawdown'>('equity');
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('ALL');

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format percent
  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Prepare chart data based on timeframe
  const chartData = useMemo(() => {
    const now = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '1M':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setFullYear(2000); // Very old date for "ALL"
    }

    return metrics.equityCurve.filter(point => 
      new Date(point.date) >= startDate
    ).map(point => ({
      date: new Date(point.date).toLocaleDateString('ko-KR'),
      value: point.value,
      drawdown: point.drawdown,
    }));
  }, [metrics.equityCurve, timeframe]);

  // Prepare monthly returns heatmap data
  const heatmapData: HeatmapData[] = useMemo(() => {
    return Object.entries(metrics.monthlyReturns).map(([yearMonth, returnValue]) => {
      const [year, month] = yearMonth.split('-');
      return {
        month: month,
        year: parseInt(year),
        return: returnValue,
        trades: 0, // This would need to be calculated from trade data
      };
    });
  }, [metrics.monthlyReturns]);

  // Get heatmap color based on return value
  const getHeatmapColor = (value: number) => {
    if (value > 10) return '#10b981'; // Strong green
    if (value > 5) return '#34d399';
    if (value > 2) return '#86efac';
    if (value > 0) return '#bbf7d0';
    if (value === 0) return '#f3f4f6';
    if (value > -2) return '#fecaca';
    if (value > -5) return '#fca5a5';
    if (value > -10) return '#f87171';
    return '#dc2626'; // Strong red
  };

  // Metric cards data
  const metricCards = [
    {
      title: '총 수익률',
      value: formatPercent(metrics.totalReturnPercent),
      amount: formatCurrency(metrics.totalReturn),
      icon: TrendingUp,
      color: metrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: metrics.totalReturn >= 0 ? 'bg-green-100' : 'bg-red-100',
    },
    {
      title: '승률',
      value: `${metrics.winRate.toFixed(1)}%`,
      amount: `${metrics.winningTrades}/${metrics.totalTrades}`,
      icon: Target,
      color: metrics.winRate >= 50 ? 'text-blue-600' : 'text-orange-600',
      bgColor: metrics.winRate >= 50 ? 'bg-blue-100' : 'bg-orange-100',
    },
    {
      title: '샤프 비율',
      value: metrics.sharpeRatio.toFixed(2),
      amount: metrics.sharpeRatio >= 1 ? '우수' : '보통',
      icon: BarChart3,
      color: metrics.sharpeRatio >= 1 ? 'text-purple-600' : 'text-gray-800',
      bgColor: metrics.sharpeRatio >= 1 ? 'bg-purple-100' : 'bg-gray-100',
    },
    {
      title: '최대 낙폭',
      value: formatPercent(metrics.maxDrawdownPercent),
      amount: formatCurrency(metrics.maxDrawdown),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${card.bgColor} rounded-xl`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-800 mb-2">{card.title}</h3>
            <div className={`text-2xl font-bold ${card.color} mb-1`}>
              {card.value}
            </div>
            <div className="text-sm text-gray-800">
              {card.amount}
            </div>
          </div>
        ))}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">거래 통계</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-800">총 거래 횟수</span>
              <span className="font-bold text-gray-900">{metrics.totalTrades}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-800">평균 수익</span>
              <span className={`font-bold ${metrics.averageReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(metrics.averageReturn)}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-800">평균 수익 (승리)</span>
              <span className="font-bold text-green-600">
                {formatPercent(metrics.averageWin)}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-800">평균 손실 (패배)</span>
              <span className="font-bold text-red-600">
                {formatPercent(Math.abs(metrics.averageLoss))}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-800">평균 보유 기간</span>
              <span className="font-bold text-gray-900">
                {metrics.averageHoldingPeriod.toFixed(1)} 시간
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-800">변동성</span>
              <span className="font-bold text-gray-900">
                {metrics.volatility.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">최고/최저 거래</h3>
          <div className="space-y-6">
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center mb-2">
                <Award className="w-5 h-5 text-green-600 mr-2" />
                <span className="font-bold text-green-900">최고 수익 거래</span>
              </div>
              <div className="text-2xl font-bold text-green-600 mb-1">
                +{metrics.bestTrade.return.toFixed(2)}%
              </div>
              <div className="text-sm text-green-700">
                {metrics.bestTrade.symbol} · {new Date(metrics.bestTrade.date).toLocaleDateString('ko-KR')}
              </div>
            </div>
            
            <div className="bg-red-50 rounded-xl p-4">
              <div className="flex items-center mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <span className="font-bold text-red-900">최대 손실 거래</span>
              </div>
              <div className="text-2xl font-bold text-red-600 mb-1">
                {metrics.worstTrade.return.toFixed(2)}%
              </div>
              <div className="text-sm text-red-700">
                {metrics.worstTrade.symbol} · {new Date(metrics.worstTrade.date).toLocaleDateString('ko-KR')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        {/* Chart Type Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedChart('equity')}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                selectedChart === 'equity'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              자산 곡선
            </button>
            <button
              onClick={() => setSelectedChart('returns')}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                selectedChart === 'returns'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              수익률
            </button>
            <button
              onClick={() => setSelectedChart('drawdown')}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                selectedChart === 'drawdown'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              낙폭
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {['1M', '3M', '6M', '1Y', 'ALL'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf as any)}
                className={`px-3 py-1 rounded-md font-medium text-sm transition-all ${
                  timeframe === tf
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-800 hover:text-gray-900'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            {selectedChart === 'equity' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  strokeWidth={2}
                />
              </AreaChart>
            ) : selectedChart === 'returns' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any) => `${value.toFixed(2)}%`}
                />
                <Bar dataKey="value">
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.value >= 0 ? '#10b981' : '#ef4444'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  tickFormatter={(value) => `${value}%`}
                  reversed
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any) => `${value.toFixed(2)}%`}
                />
                <Area 
                  type="monotone" 
                  dataKey="drawdown" 
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#colorDrawdown)" 
                  strokeWidth={2}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Returns Heatmap */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">월별 수익률 히트맵</h3>
        
        <div className="overflow-x-auto">
          <div className="grid grid-cols-13 gap-2 min-w-[600px]">
            {/* Header row */}
            <div className="font-bold text-sm text-gray-800 text-center">연도</div>
            {['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'].map((month) => (
              <div key={month} className="font-bold text-xs text-gray-800 text-center">
                {month}
              </div>
            ))}
            
            {/* Data rows */}
            {Array.from(new Set(heatmapData.map(d => d.year))).sort((a, b) => b - a).map((year) => (
              <React.Fragment key={year}>
                <div className="font-bold text-sm text-gray-900 text-center">
                  {year}
                </div>
                {Array.from({ length: 12 }, (_, monthIndex) => {
                  const monthData = heatmapData.find(
                    d => d.year === year && parseInt(d.month) === monthIndex + 1
                  );
                  const returnValue = monthData?.return || 0;
                  
                  return (
                    <div
                      key={`${year}-${monthIndex}`}
                      className="relative h-10 rounded-md flex items-center justify-center text-xs font-bold transition-all hover:scale-110 hover:shadow-lg cursor-pointer"
                      style={{ backgroundColor: getHeatmapColor(returnValue) }}
                      title={`${year}년 ${monthIndex + 1}월: ${formatPercent(returnValue)}`}
                    >
                      {monthData && (
                        <span className={returnValue < -5 || returnValue > 5 ? 'text-white' : 'text-gray-800'}>
                          {returnValue.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-800">손실</span>
            <div className="flex gap-1">
              {[-15, -10, -5, -2, 0, 2, 5, 10, 15].map((val) => (
                <div
                  key={val}
                  className="w-8 h-6 rounded"
                  style={{ backgroundColor: getHeatmapColor(val) }}
                />
              ))}
            </div>
            <span className="text-gray-800">수익</span>
          </div>
        </div>
      </div>

      {/* Benchmark Comparison Button */}
      {onBenchmarkCompare && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">벤치마크 비교</h3>
              <p className="text-gray-800">BTC, S&P 500 등 주요 지수와 성과를 비교해보세요.</p>
            </div>
            <button
              onClick={onBenchmarkCompare}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl"
            >
              비교하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}