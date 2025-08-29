'use client';

import { useState, useEffect } from 'react';
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
  ChartOptions,
} from 'chart.js';
import { BarChart3, Loader2 } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface BitcoinPrice {
  id: number;
  timestamp: string;
  price: number;
  volume?: number;
  marketCap?: number;
  change24h?: number;
  changePercentage24h?: number;
  high24h?: number;
  low24h?: number;
  source: string;
}

interface BitcoinChartProps {
  height?: number;
  timeRange?: number; // hours
  className?: string;
}

export default function BitcoinChart({ 
  height = 300, 
  timeRange = 24,
  className = "" 
}: BitcoinChartProps) {
  const [priceHistory, setPriceHistory] = useState<BitcoinPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPriceHistory = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/bitcoin/history?hours=${timeRange}`);
      const result = await response.json();

      if (result.success) {
        setPriceHistory(result.data);
      } else {
        setError(result.message || 'Failed to fetch price history');
      }
    } catch (err) {
      console.error('Error fetching price history:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceHistory();
    
    // Refresh chart every 10 minutes to match price updates
    const interval = setInterval(fetchPriceHistory, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [timeRange]);

  // Prepare chart data
  const chartData = {
    labels: priceHistory.map(item => {
      const date = new Date(item.timestamp);
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric'
      });
    }),
    datasets: [
      {
        label: 'Bitcoin Price (USD)',
        data: priceHistory.map(item => item.price),
        borderColor: '#f97316', // orange-500
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
        pointBackgroundColor: '#f97316',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  // Chart options
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#f97316',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            const change = context.dataIndex > 0 
              ? context.parsed.y - priceHistory[context.dataIndex - 1]?.price 
              : 0;
            const changePercent = context.dataIndex > 0 
              ? ((change / priceHistory[context.dataIndex - 1]?.price) * 100)
              : 0;
              
            return [
              `Price: $${value.toLocaleString()}`,
              change !== 0 ? `Change: ${change >= 0 ? '+' : ''}$${change.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)` : ''
            ].filter(Boolean);
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 8,
          color: '#6b7280',
        },
      },
      y: {
        display: true,
        position: 'right',
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
        },
        ticks: {
          callback: function(value) {
            return '$' + Number(value).toLocaleString();
          },
          color: '#6b7280',
        },
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    elements: {
      point: {
        hoverRadius: 8,
      },
    },
  };

  // Calculate price statistics
  const currentPrice = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1]?.price : 0;
  const firstPrice = priceHistory.length > 0 ? priceHistory[0]?.price : 0;
  const priceChange = currentPrice - firstPrice;
  const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
  const high = Math.max(...priceHistory.map(p => p.price));
  const low = Math.min(...priceHistory.map(p => p.price));

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center mb-4">
          <BarChart3 className="h-5 w-5 text-gray-800 mr-2" />
          <h3 className="text-lg font-bold">BTC/USD Live Chart</h3>
        </div>
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="text-center text-gray-800">
            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
            <p>Loading chart data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center mb-4">
          <BarChart3 className="h-5 w-5 text-gray-800 mr-2" />
          <h3 className="text-lg font-bold">BTC/USD Live Chart</h3>
        </div>
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="text-center text-red-500">
            <p>⚠️ {error}</p>
            <button 
              onClick={fetchPriceHistory}
              className="mt-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (priceHistory.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center mb-4">
          <BarChart3 className="h-5 w-5 text-gray-800 mr-2" />
          <h3 className="text-lg font-bold">BTC/USD Live Chart</h3>
        </div>
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="text-center text-gray-800">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No price data available</p>
            <p className="text-sm mt-1">Price updates every 10 minutes</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <BarChart3 className="h-5 w-5 text-gray-800 mr-2" />
          <h3 className="text-lg font-bold">BTC/USD Live Chart</h3>
        </div>
        <div className="text-right text-sm">
          <div className="text-gray-800">Last {timeRange}h</div>
          <div className={`font-bold ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Price Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-xs text-gray-800">Current</div>
          <div className="font-bold text-gray-900">${currentPrice.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-800">High</div>
          <div className="font-bold text-green-600">${high.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-800">Low</div>
          <div className="font-bold text-red-600">${low.toLocaleString()}</div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <Line data={chartData} options={options} />
      </div>

      {/* Chart Info */}
      <div className="mt-3 text-xs text-gray-800 text-center">
        Updates every 10 minutes • {priceHistory.length} data points • Source: {priceHistory[priceHistory.length - 1]?.source || 'Simulation'}
      </div>
    </div>
  );
}