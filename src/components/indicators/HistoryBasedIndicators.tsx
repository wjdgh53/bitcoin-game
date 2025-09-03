'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Types for the API response
interface CurrentPrice {
  price: number;
  change: number;
  changePercentage: number;
  timestamp: string;
  volume?: number;
}

interface TechnicalIndicators {
  movingAverages: {
    sma5?: number;
    sma10?: number;
    sma20?: number;
    sma50?: number;
    ema12?: number;
    ema26?: number;
  };
  oscillators: {
    rsi?: number;
    stochK?: number;
    stochD?: number;
  };
  macd: {
    macd?: number;
    signal?: number;
    histogram?: number;
  };
  bollingerBands: {
    upper?: number;
    middle?: number;
    lower?: number;
    width?: number;
  };
  levels: {
    support?: number;
    resistance?: number;
  };
}

interface TrendAnalysis {
  trend: 'bullish' | 'bearish' | 'neutral' | 'sideways';
  strength: number;
  confidence: number;
}

interface TradingSignal {
  type: 'buy' | 'sell';
  indicator: string;
  value: number;
  message: string;
  strength: 'weak' | 'medium' | 'strong';
}

interface ChartDataPoint {
  timestamp: string;
  price: number;
  volume?: number;
  sma20?: number;
  sma50?: number;
}

interface HistoryIndicatorsData {
  currentPrice: CurrentPrice;
  indicators: TechnicalIndicators;
  analysis: TrendAnalysis;
  signals: TradingSignal[];
  chartData: ChartDataPoint[];
  metadata: {
    dataPoints: number;
    timeRange: string;
    lastUpdated: string;
    calculationMethod: string;
  };
}

interface HistoryBasedIndicatorsProps {
  hours?: number;
  refreshInterval?: number;
  className?: string;
}

const HistoryBasedIndicators: React.FC<HistoryBasedIndicatorsProps> = ({
  hours = 72,
  refreshInterval = 30000,
  className = ''
}) => {
  const [data, setData] = useState<HistoryIndicatorsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [webSocketStatus, setWebSocketStatus] = useState<'unknown' | 'starting' | 'running' | 'failed'>('unknown');

  const checkAndStartWebSocketServices = async () => {
    try {
      setWebSocketStatus('starting');
      const statusResponse = await fetch('/api/websocket/status?auto-start=true');
      const statusResult = await statusResponse.json();
      
      if (statusResult.success && statusResult.data.healthy) {
        setWebSocketStatus('running');
        return true;
      } else {
        setWebSocketStatus('failed');
        return false;
      }
    } catch (error) {
      console.error('Error checking/starting WebSocket services:', error);
      setWebSocketStatus('failed');
      return false;
    }
  };

  const fetchData = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/bitcoin/history-indicators?hours=${hours}`);
      const result = await response.json();

      if (!response.ok) {
        // If no data available, try to start WebSocket services and retry once
        if (response.status === 404 && result.message?.includes('No price history data available')) {
          const webSocketStarted = await checkAndStartWebSocketServices();
          if (webSocketStarted) {
            // Wait a moment for data collection to begin, then retry
            await new Promise(resolve => setTimeout(resolve, 2000));
            return fetchData(); // Recursive retry after starting services
          }
        }
        throw new Error(result.message || 'Failed to fetch data');
      }

      if (result.success) {
        setData(result.data);
        setLastUpdate(new Date());
        setWebSocketStatus('running'); // Mark as running if we got data successfully
      } else {
        throw new Error(result.message || 'Failed to load indicators');
      }
    } catch (err) {
      console.error('Error fetching indicators:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [hours, refreshInterval]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toFixed(decimals);
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish': return 'text-green-600 bg-green-50';
      case 'bearish': return 'text-red-600 bg-red-50';
      case 'sideways': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSignalColor = (type: string, strength: string) => {
    if (type === 'buy') {
      return strength === 'strong' ? 'bg-green-100 text-green-800 border-green-200' 
           : strength === 'medium' ? 'bg-green-50 text-green-700 border-green-100'
           : 'bg-green-25 text-green-600 border-green-50';
    } else {
      return strength === 'strong' ? 'bg-red-100 text-red-800 border-red-200'
           : strength === 'medium' ? 'bg-red-50 text-red-700 border-red-100' 
           : 'bg-red-25 text-red-600 border-red-50';
    }
  };

  const getRSICondition = (rsi: number) => {
    if (rsi >= 70) return { text: 'Overbought', color: 'text-red-600' };
    if (rsi <= 30) return { text: 'Oversold', color: 'text-green-600' };
    if (rsi > 50) return { text: 'Bullish', color: 'text-green-500' };
    return { text: 'Bearish', color: 'text-red-500' };
  };

  if (loading) {
    const getLoadingMessage = () => {
      switch (webSocketStatus) {
        case 'starting':
          return 'Starting WebSocket data collection...';
        case 'running':
          return 'Loading technical indicators...';
        case 'failed':
          return 'Loading indicators (WebSocket services unavailable)...';
        default:
          return 'Loading technical indicators...';
      }
    };

    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <LoadingSpinner />
            <span className="ml-3 text-gray-600">{getLoadingMessage()}</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    const getStatusColor = () => {
      switch (webSocketStatus) {
        case 'running': return 'text-green-600';
        case 'starting': return 'text-yellow-600';
        case 'failed': return 'text-red-600';
        default: return 'text-gray-600';
      }
    };

    const getStatusText = () => {
      switch (webSocketStatus) {
        case 'running': return 'WebSocket services: Running ✅';
        case 'starting': return 'WebSocket services: Starting... 🔄';
        case 'failed': return 'WebSocket services: Failed ❌';
        default: return 'WebSocket services: Unknown';
      }
    };

    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-600">
              <h3 className="text-lg font-medium mb-2">Error Loading Indicators</h3>
              <p className="mb-3">{error}</p>
              <div className={`text-sm mb-4 ${getStatusColor()}`}>
                {getStatusText()}
              </div>
              {webSocketStatus === 'failed' && (
                <div className="text-sm text-gray-600 mb-4 bg-yellow-50 p-3 rounded border">
                  <p className="font-medium">💡 Troubleshooting:</p>
                  <p>Data collection may need to be manually started. This usually happens on first run.</p>
                </div>
              )}
              <button 
                onClick={() => {
                  setLoading(true);
                  setWebSocketStatus('unknown');
                  fetchData();
                }}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry & Start Services
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-600">
              No data available
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Current Price */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Bitcoin Technical Indicators</span>
            <div className="text-sm text-gray-500">
              {lastUpdate && `Last updated: ${lastUpdate.toLocaleTimeString()}`}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold">
                {formatPrice(data.currentPrice.price)}
              </div>
              <div className={`text-sm ${data.currentPrice.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.currentPrice.change >= 0 ? '+' : ''}{formatPrice(data.currentPrice.change)} 
                ({data.currentPrice.changePercentage >= 0 ? '+' : ''}{formatNumber(data.currentPrice.changePercentage, 2)}%)
              </div>
            </div>
            <div className="text-right">
              <Badge className={getTrendColor(data.analysis.trend)}>
                {data.analysis.trend.toUpperCase()}
              </Badge>
              <div className="text-sm text-gray-600 mt-1">
                Strength: {formatNumber(data.analysis.strength)}%
              </div>
              <div className="text-sm text-gray-600">
                Confidence: {formatNumber(data.analysis.confidence)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Signals */}
      {data.signals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Trading Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.signals.map((signal, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${getSignalColor(signal.type, signal.strength)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Badge variant={signal.type === 'buy' ? 'default' : 'destructive'}>
                        {signal.type.toUpperCase()}
                      </Badge>
                      <span className="ml-2 font-medium">{signal.indicator}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {signal.strength.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm">{signal.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Moving Averages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Moving Averages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.indicators.movingAverages.sma5 && (
                <div className="flex justify-between">
                  <span>SMA 5:</span>
                  <span className="font-medium">{formatPrice(data.indicators.movingAverages.sma5)}</span>
                </div>
              )}
              {data.indicators.movingAverages.sma20 && (
                <div className="flex justify-between">
                  <span>SMA 20:</span>
                  <span className="font-medium">{formatPrice(data.indicators.movingAverages.sma20)}</span>
                </div>
              )}
              {data.indicators.movingAverages.sma50 && (
                <div className="flex justify-between">
                  <span>SMA 50:</span>
                  <span className="font-medium">{formatPrice(data.indicators.movingAverages.sma50)}</span>
                </div>
              )}
              {data.indicators.movingAverages.ema12 && (
                <div className="flex justify-between">
                  <span>EMA 12:</span>
                  <span className="font-medium">{formatPrice(data.indicators.movingAverages.ema12)}</span>
                </div>
              )}
              {data.indicators.movingAverages.ema26 && (
                <div className="flex justify-between">
                  <span>EMA 26:</span>
                  <span className="font-medium">{formatPrice(data.indicators.movingAverages.ema26)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Oscillators */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Oscillators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.indicators.oscillators.rsi && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span>RSI (14):</span>
                    <span className="font-medium">{formatNumber(data.indicators.oscillators.rsi)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        data.indicators.oscillators.rsi >= 70 ? 'bg-red-500' :
                        data.indicators.oscillators.rsi <= 30 ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${data.indicators.oscillators.rsi}%` }}
                    />
                  </div>
                  <div className={`text-sm mt-1 ${getRSICondition(data.indicators.oscillators.rsi).color}`}>
                    {getRSICondition(data.indicators.oscillators.rsi).text}
                  </div>
                </div>
              )}
              {data.indicators.oscillators.stochK && (
                <div className="flex justify-between">
                  <span>Stochastic %K:</span>
                  <span className="font-medium">{formatNumber(data.indicators.oscillators.stochK)}</span>
                </div>
              )}
              {data.indicators.oscillators.stochD && (
                <div className="flex justify-between">
                  <span>Stochastic %D:</span>
                  <span className="font-medium">{formatNumber(data.indicators.oscillators.stochD)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* MACD */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">MACD</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.indicators.macd.macd && (
                <div className="flex justify-between">
                  <span>MACD:</span>
                  <span className={`font-medium ${data.indicators.macd.macd > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatNumber(data.indicators.macd.macd, 4)}
                  </span>
                </div>
              )}
              {data.indicators.macd.signal && (
                <div className="flex justify-between">
                  <span>Signal:</span>
                  <span className="font-medium">{formatNumber(data.indicators.macd.signal, 4)}</span>
                </div>
              )}
              {data.indicators.macd.histogram && (
                <div className="flex justify-between">
                  <span>Histogram:</span>
                  <span className={`font-medium ${data.indicators.macd.histogram > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatNumber(data.indicators.macd.histogram, 4)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bollinger Bands & Levels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bollinger Bands */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bollinger Bands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.indicators.bollingerBands.upper && (
                <div className="flex justify-between">
                  <span>Upper Band:</span>
                  <span className="font-medium text-red-600">{formatPrice(data.indicators.bollingerBands.upper)}</span>
                </div>
              )}
              {data.indicators.bollingerBands.middle && (
                <div className="flex justify-between">
                  <span>Middle Band:</span>
                  <span className="font-medium">{formatPrice(data.indicators.bollingerBands.middle)}</span>
                </div>
              )}
              {data.indicators.bollingerBands.lower && (
                <div className="flex justify-between">
                  <span>Lower Band:</span>
                  <span className="font-medium text-green-600">{formatPrice(data.indicators.bollingerBands.lower)}</span>
                </div>
              )}
              {data.indicators.bollingerBands.width && (
                <div className="flex justify-between">
                  <span>Band Width:</span>
                  <span className="font-medium">{formatPrice(data.indicators.bollingerBands.width)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Support & Resistance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.indicators.levels.resistance && (
                <div className="flex justify-between">
                  <span>Resistance:</span>
                  <span className="font-medium text-red-600">{formatPrice(data.indicators.levels.resistance)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Current Price:</span>
                <span className="font-medium">{formatPrice(data.currentPrice.price)}</span>
              </div>
              {data.indicators.levels.support && (
                <div className="flex justify-between">
                  <span>Support:</span>
                  <span className="font-medium text-green-600">{formatPrice(data.indicators.levels.support)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Data Points:</span>
              <div className="font-medium">{data.metadata.dataPoints}</div>
            </div>
            <div>
              <span className="text-gray-600">Time Range:</span>
              <div className="font-medium">{data.metadata.timeRange}</div>
            </div>
            <div>
              <span className="text-gray-600">Method:</span>
              <div className="font-medium">History Table</div>
            </div>
            <div>
              <span className="text-gray-600">Last Updated:</span>
              <div className="font-medium">
                {new Date(data.metadata.lastUpdated).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoryBasedIndicators;