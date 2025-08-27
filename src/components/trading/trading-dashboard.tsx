// Real-time trading dashboard with WebSocket integration

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
import { useChartData, usePortfolio, useExecuteTrade } from '@/lib/hooks/use-api';
import { PriceTicker } from './price-ticker';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBoundary, DataLoadError } from '@/components/ui/error-boundary';
import { useNotifications } from '@/components/notifications/notification-system';
import { formatCurrency, formatPercentage, cn } from '@/lib/utils';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface TradingDashboardProps {
  className?: string;
}

export function TradingDashboard({ className }: TradingDashboardProps) {
  const [timeRange, setTimeRange] = useState('1d');
  const [tradeAmount, setTradeAmount] = useState(0.1);
  const [isExecutingTrade, setIsExecutingTrade] = useState(false);

  const { data: chartData, isLoading: chartLoading, error: chartError, refetch: refetchChart } = useChartData(timeRange, 'sma,volume');
  const { data: portfolioData, isLoading: portfolioLoading } = usePortfolio();
  const executeTrade = useExecuteTrade();
  const { showTradeNotification, showErrorNotification, showSuccessNotification } = useNotifications();

  const currentPrice = chartData?.metadata?.latestPrice || 0;
  const portfolio = portfolioData?.portfolio;

  // Chart configuration
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Bitcoin Price Chart',
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            if (context.dataset.label === 'Volume') {
              return `Volume: ${context.parsed.y.toLocaleString()}`;
            }
            return `Price: ${formatCurrency(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: timeRange === '1h' ? 'minute' : timeRange === '1d' ? 'hour' : 'day' as const,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        ticks: {
          callback: (value: any) => formatCurrency(value),
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: (value: any) => value.toLocaleString(),
        },
      },
    },
    animation: {
      duration: 750,
    },
  }), [timeRange]);

  // Handle trade execution
  const handleTrade = async (type: 'buy' | 'sell') => {
    if (!portfolio || !currentPrice || tradeAmount <= 0) return;

    setIsExecutingTrade(true);
    
    try {
      // Validate trade
      const totalCost = tradeAmount * currentPrice;
      
      if (type === 'buy' && portfolio.balance < totalCost) {
        showErrorNotification('Insufficient Balance', `Need ${formatCurrency(totalCost)} but only have ${formatCurrency(portfolio.balance)}`);
        return;
      }
      
      if (type === 'sell' && portfolio.bitcoinHoldings < tradeAmount) {
        showErrorNotification('Insufficient Bitcoin', `Need ${tradeAmount} BTC but only have ${portfolio.bitcoinHoldings} BTC`);
        return;
      }

      await executeTrade.mutateAsync({
        type,
        amount: tradeAmount,
        price: currentPrice,
      });

      showTradeNotification(type, tradeAmount, currentPrice);
      showSuccessNotification('Trade Successful', `${type === 'buy' ? 'Bought' : 'Sold'} ${tradeAmount} BTC`);
      
      // Reset trade amount
      setTradeAmount(0.1);
      
    } catch (error) {
      showErrorNotification('Trade Failed', error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsExecutingTrade(false);
    }
  };

  if (chartLoading && !chartData) {
    return (
      <div className={cn('flex items-center justify-center h-96', className)}>
        <LoadingSpinner size="lg" />
        <span className="ml-2">Loading trading dashboard...</span>
      </div>
    );
  }

  if (chartError) {
    return (
      <div className={className}>
        <DataLoadError onRetry={refetchChart} />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Price Ticker */}
      <PriceTicker />

      {/* Portfolio Summary */}
      {portfolio && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-500">Portfolio Value</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(portfolio.totalValue)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className={cn(
                  'h-8 w-8',
                  portfolio.profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                )} />
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-500">Total P&L</div>
                <div className={cn(
                  'text-lg font-semibold',
                  portfolio.profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {formatCurrency(portfolio.profit)} ({formatPercentage(portfolio.profitPercentage)})
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">₿</span>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-500">Bitcoin Holdings</div>
                <div className="text-lg font-semibold text-gray-900">
                  {portfolio.bitcoinHoldings.toFixed(6)} BTC
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">$</span>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-500">Cash Balance</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(portfolio.balance)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart and Trading Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Price Chart</h3>
            
            <div className="flex gap-2">
              {['1h', '4h', '1d', '1w'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    'px-3 py-1 text-sm rounded-md transition-colors',
                    range === timeRange
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="h-96">
            <ErrorBoundary fallback={<DataLoadError onRetry={refetchChart} />}>
              {chartData?.config && (
                <Line data={chartData.config.data} options={chartOptions} />
              )}
            </ErrorBoundary>
          </div>
        </div>

        {/* Trading Panel */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Trade</h3>
          
          <div className="space-y-4">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (BTC)
              </label>
              <input
                type="number"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(parseFloat(e.target.value) || 0)}
                step="0.001"
                min="0.001"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              {/* Quick amount buttons */}
              <div className="flex gap-2 mt-2">
                {[0.001, 0.01, 0.1, 1].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setTradeAmount(amount)}
                    className="flex-1 px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                  >
                    {amount} BTC
                  </button>
                ))}
              </div>
            </div>

            {/* Trade Value */}
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-600">Trade Value</div>
              <div className="text-lg font-semibold">
                {formatCurrency(tradeAmount * currentPrice)}
              </div>
            </div>

            {/* Trade Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleTrade('buy')}
                disabled={isExecutingTrade || portfolioLoading || !portfolio || portfolio.balance < tradeAmount * currentPrice}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExecutingTrade ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
                BUY
              </button>
              
              <button
                onClick={() => handleTrade('sell')}
                disabled={isExecutingTrade || portfolioLoading || !portfolio || portfolio.bitcoinHoldings < tradeAmount}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExecutingTrade ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                SELL
              </button>
            </div>

            {/* Market Status */}
            <div className="flex items-center gap-2 mt-4 p-2 bg-green-50 rounded-md">
              <Zap className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800">Market Open</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}