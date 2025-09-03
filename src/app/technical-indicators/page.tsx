'use client';

import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Target, RefreshCw, Activity, Zap, Clock, DollarSign, Wifi, WifiOff, ArrowUp, ArrowDown, Minus, Volume2, Database } from 'lucide-react';
import Navbar from '@/components/Navbar';
import HistoryBasedIndicators from '@/components/indicators/HistoryBasedIndicators';

interface TechnicalIndicator {
  name: string;
  value: number | string;
  change?: number;
  status?: 'bullish' | 'bearish' | 'neutral';
  description?: string;
}

interface BinanceData {
  symbol: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  technicalIndicators: {
    sma20: number | null;
    rsi14: number | null;
    macd: number | null;
    macdSignal: number | null;
    macdHistogram: number | null;
    bollingerUpper: number | null;
    bollingerMiddle: number | null;
    bollingerLower: number | null;
  };
  tradingSignal: 'buy' | 'sell' | 'neutral';
  lastUpdate: string;
}

interface StreamData {
  type: string;
  data?: any;
  error?: string;
  status?: any;
  timestamp: number;
}

interface ChartDataPoint {
  timestamp: string;
  price: number;
  volume?: number;
}

type Timeframe = '1d' | '1w' | '1m';
type TimeframeDisplay = '1D' | '1W' | '1M';

interface ConnectionStatus {
  connected: boolean;
  lastUpdate: number | null;
  source: 'websocket' | 'rest' | 'offline';
  reconnecting: boolean;
}

export default function TechnicalIndicatorsPage() {
  const [binanceData, setBinanceData] = useState<BinanceData | null>(null);
  const [binanceLoading, setBinanceLoading] = useState(false);
  const [binanceError, setBinanceError] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1d');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    lastUpdate: null,
    source: 'offline',
    reconnecting: false
  });
  const [streamMessages, setStreamMessages] = useState<StreamData[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chartUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastChartUpdateRef = useRef<number>(0);

  // Fetch chart data from API based on timeframe
  const fetchChartData = async (timeframe: Timeframe) => {
    try {
      const response = await fetch(`/api/bitcoin/history-chart?timeframe=${timeframe}`);
      const result = await response.json();
      
      if (result.success) {
        setChartData(result.data);
        console.log(`✅ Loaded ${result.data.length} chart data points for ${timeframe}`);
      } else {
        console.error('Failed to fetch chart data:', result.message);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  // Refresh chart data from API (called every minute)
  const refreshChartData = () => {
    fetchChartData(selectedTimeframe);
    lastChartUpdateRef.current = Date.now();
  };

  const fetchBinanceData = async () => {
    try {
      setBinanceLoading(true);
      setBinanceError(null);
      
      const response = await fetch('/api/binance/indicators');
      const result = await response.json();
      
      if (result.success) {
        setBinanceData(result.data);
        // Refresh chart data every minute
        const now = Date.now();
        if (now - lastChartUpdateRef.current > 60000) { // 1 minute
          refreshChartData();
        }
      } else {
        setBinanceError(result.error || 'Failed to fetch Binance data');
      }
    } catch (err) {
      console.error('Error fetching Binance data:', err);
      setBinanceError('Failed to connect to Binance');
    } finally {
      setBinanceLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchBinanceData();
  };

  const connectToRealTimeStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus(prev => ({ ...prev, reconnecting: true }));
    
    try {
      const eventSource = new EventSource('/api/binance/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('✅ Connected to real-time stream');
        setConnectionStatus({
          connected: true,
          lastUpdate: Date.now(),
          source: 'websocket',
          reconnecting: false
        });
        setBinanceError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const streamData: StreamData = JSON.parse(event.data);
          setStreamMessages(prev => [...prev.slice(-50), streamData]); // Keep last 50 messages
          
          switch (streamData.type) {
            case 'data':
              if (streamData.data) {
                const { ticker, indicators, signals } = streamData.data;
                if (ticker) {
                  const newPrice = ticker.price;
                  setBinanceData({
                    symbol: 'BTC/USDT',
                    currentPrice: newPrice,
                    priceChange: ticker.priceChange,
                    priceChangePercent: ticker.priceChangePercent,
                    volume24h: ticker.volume,
                    high24h: ticker.high24h,
                    low24h: ticker.low24h,
                    technicalIndicators: {
                      sma20: indicators?.sma20 || null,
                      rsi14: indicators?.rsi14 || null,
                      macd: indicators?.macd || null,
                      macdSignal: indicators?.macdSignal || null,
                      macdHistogram: indicators?.macdHistogram || null,
                      bollingerUpper: indicators?.bbUpper || null,
                      bollingerMiddle: indicators?.bbMiddle || null,
                      bollingerLower: indicators?.bbLower || null
                    },
                    tradingSignal: signals?.signal || 'neutral',
                    lastUpdate: new Date(streamData.timestamp).toISOString()
                  });
                  
                  // Update price history for mini chart (real-time)
                  setPriceHistory(prev => {
                    const newHistory = [...prev, newPrice].slice(-50); // Keep last 50 prices
                    return newHistory;
                  });

                  // Refresh chart data every minute
                  const now = Date.now();
                  if (now - lastChartUpdateRef.current > 60000) { // 1 minute
                    refreshChartData();
                  }
                  
                  setConnectionStatus(prev => ({ ...prev, lastUpdate: streamData.timestamp }));
                }
              }
              break;
              
            case 'ticker':
              if (streamData.data) {
                const ticker = streamData.data;
                const newPrice = ticker.price;
                setBinanceData(prev => prev ? {
                  ...prev,
                  currentPrice: newPrice,
                  priceChange: ticker.priceChange,
                  priceChangePercent: ticker.priceChangePercent,
                  volume24h: ticker.volume,
                  high24h: ticker.high24h,
                  low24h: ticker.low24h,
                  lastUpdate: new Date(streamData.timestamp).toISOString()
                } : null);
                
                // Update price history for mini chart (real-time)
                setPriceHistory(prev => {
                  const newHistory = [...prev, newPrice].slice(-50);
                  return newHistory;
                });

                // Refresh chart data every minute
                const now = Date.now();
                if (now - lastChartUpdateRef.current > 60000) { // 1 minute
                  refreshChartData();
                }
                
                setConnectionStatus(prev => ({ ...prev, lastUpdate: streamData.timestamp }));
              }
              break;
              
            case 'error':
              console.error('Stream error:', streamData.error);
              setBinanceError(streamData.error || 'Real-time data stream error');
              break;
              
            case 'status':
              console.log('Service status:', streamData.status);
              break;
              
            case 'service_disconnected':
              setConnectionStatus(prev => ({ ...prev, connected: false, source: 'offline' }));
              setBinanceError('Real-time service disconnected');
              break;
              
            case 'health_check_failed':
              console.warn('Health check failed:', streamData.status);
              break;
          }
        } catch (err) {
          console.error('Error parsing stream data:', err);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        setConnectionStatus({
          connected: false,
          lastUpdate: Date.now(),
          source: 'offline',
          reconnecting: true
        });
        setBinanceError('Real-time connection failed. Attempting to reconnect...');
        
        // Auto-reconnect after 5 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connectToRealTimeStream();
        }, 5000);
      };
      
    } catch (error) {
      console.error('Failed to connect to stream:', error);
      setConnectionStatus({
        connected: false,
        lastUpdate: null,
        source: 'offline',
        reconnecting: false
      });
      setBinanceError('Failed to connect to real-time stream');
    }
  };

  const disconnectFromStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setConnectionStatus({
      connected: false,
      lastUpdate: null,
      source: 'offline',
      reconnecting: false
    });
  };

  // Get chart data (already filtered by API based on timeframe)
  const getFilteredChartData = () => {
    return chartData;
  };

  // Start chart update timer (every minute)
  const startChartUpdateTimer = () => {
    if (chartUpdateTimerRef.current) {
      clearInterval(chartUpdateTimerRef.current);
    }

    // Update chart data from API every minute
    chartUpdateTimerRef.current = setInterval(() => {
      refreshChartData();
    }, 60000); // 1 minute
  };

  useEffect(() => {
    // Load initial chart data
    fetchChartData(selectedTimeframe);
    // Start real-time connection
    connectToRealTimeStream();
    // Fetch initial data
    fetchBinanceData();
    // Start chart update timer
    startChartUpdateTimer();
    
    // Cleanup on unmount
    return () => {
      disconnectFromStream();
      if (chartUpdateTimerRef.current) {
        clearInterval(chartUpdateTimerRef.current);
      }
    };
  }, []);

  // Fetch new chart data when timeframe changes
  useEffect(() => {
    fetchChartData(selectedTimeframe);
  }, [selectedTimeframe]);

  // Create a simple line chart using SVG (for real-time price history)
  const MiniChart = ({ data, width = 150, height = 40, color = '#f97316' }: { data: number[], width?: number, height?: number, color?: string }) => {
    if (data.length < 2) return <div className="w-full h-10 bg-slate-700/50 rounded animate-pulse"></div>;
    
    // Filter out invalid values
    const validData = data.filter(value => !isNaN(value) && isFinite(value));
    if (validData.length < 2) return <div className="w-full h-10 bg-slate-700/50 rounded"></div>;
    
    const min = Math.min(...validData);
    const max = Math.max(...validData);
    const range = max - min;
    
    // Handle case where all values are the same
    if (range === 0) {
      const y = height / 2;
      const points = validData.map((_, index) => {
        const x = (index / (validData.length - 1)) * width;
        return `${x},${y}`;
      }).join(' ');
      
      return (
        <svg width={width} height={height} className="overflow-visible">
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            className="drop-shadow-sm"
          />
        </svg>
      );
    }
    
    const points = validData.map((value, index) => {
      const x = (index / (validData.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          className="drop-shadow-sm"
        />
      </svg>
    );
  };

  // Create historical chart using stored minute data
  const HistoricalChart = ({ data, width = 400, height = 200, color = '#f97316' }: { data: ChartDataPoint[], width?: number, height?: number, color?: string }) => {
    if (data.length < 2) {
      return (
        <div className="w-full h-full bg-slate-700/50 rounded flex items-center justify-center">
          <p className="text-slate-400">Loading historical data...</p>
        </div>
      );
    }
    
    const prices = data.map(point => point.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min;
    
    // Handle case where all values are the same
    if (range === 0) {
      const y = height / 2;
      const points = data.map((_, index) => {
        const x = (index / (data.length - 1)) * width;
        return `${x},${y}`;
      }).join(' ');
      
      return (
        <svg width={width} height={height} className="overflow-visible">
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            className="drop-shadow-sm"
          />
        </svg>
      );
    }
    
    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((point.price - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor: color, stopOpacity: 0.3}} />
            <stop offset="100%" style={{stopColor: color, stopOpacity: 0}} />
          </linearGradient>
        </defs>
        <polyline
          points={`0,${height} ${points} ${width},${height}`}
          fill="url(#chartGradient)"
          stroke="none"
        />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          className="drop-shadow-sm"
        />
      </svg>
    );
  };

  // Timeframe Selector Component
  const TimeframeSelector = () => {
    const timeframes: { value: Timeframe, display: TimeframeDisplay }[] = [
      { value: '1d', display: '1D' },
      { value: '1w', display: '1W' },
      { value: '1m', display: '1M' }
    ];
    
    return (
      <div className="flex items-center gap-2 p-1 bg-slate-700/50 rounded-lg">
        {timeframes.map(tf => (
          <button
            key={tf.value}
            onClick={() => setSelectedTimeframe(tf.value)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
              selectedTimeframe === tf.value
                ? 'bg-orange-500 text-white shadow-lg'
                : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
            }`}
          >
            {tf.display}
          </button>
        ))}
      </div>
    );
  };

  const getRSIStatus = (rsi?: number) => {
    if (!rsi) return { text: 'N/A', color: 'text-gray-800' };
    if (rsi >= 70) return { text: 'Overbought', color: 'text-red-600' };
    if (rsi <= 30) return { text: 'Oversold', color: 'text-green-600' };
    return { text: 'Neutral', color: 'text-blue-600' };
  };

  const getSignalColor = (signal: 'buy' | 'sell' | 'neutral') => {
    switch (signal) {
      case 'buy': return 'text-green-700 bg-green-100 border-green-300';
      case 'sell': return 'text-red-700 bg-red-100 border-red-300';
      default: return 'text-yellow-700 bg-yellow-100 border-yellow-300';
    }
  };

  const getSignalText = (signal: 'buy' | 'sell' | 'neutral') => {
    switch (signal) {
      case 'buy': return 'BUY';
      case 'sell': return 'SELL';
      default: return 'NEUTRAL';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return (volume / 1000000).toFixed(1) + 'M';
    } else if (volume >= 1000) {
      return (volume / 1000).toFixed(1) + 'K';
    }
    return volume.toString();
  };

  if (!binanceData && !connectionStatus.connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <BarChart3 className="h-10 w-10 text-white" />
              </div>
              <p className="text-white text-lg mb-4">Connecting to Bitcoin data stream...</p>
              <button 
                onClick={connectToRealTimeStream}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Connect Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <BarChart3 className="h-10 w-10 text-orange-500 mr-4" />
            <div>
              <h1 className="text-4xl font-bold text-white">Bitcoin Technical Indicators</h1>
              <p className="text-slate-300">Technical analysis with 1-minute data updates powered by database</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Connection Status Indicator */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm border ${
              connectionStatus.connected 
                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                : connectionStatus.reconnecting
                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                : 'bg-red-500/20 text-red-300 border-red-500/30'
            }`}>
              {connectionStatus.connected ? (
                <Wifi className="h-4 w-4" />
              ) : connectionStatus.reconnecting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}
              {connectionStatus.connected 
                ? 'LIVE' 
                : connectionStatus.reconnecting 
                ? 'RECONNECTING...' 
                : 'OFFLINE'
              }
            </div>
            
            <button 
              onClick={connectionStatus.connected ? disconnectFromStream : connectToRealTimeStream}
              disabled={connectionStatus.reconnecting}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 backdrop-blur-sm ${
                connectionStatus.connected
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                  : 'bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30'
              } disabled:opacity-50`}
            >
              {connectionStatus.reconnecting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : connectionStatus.connected ? (
                <WifiOff className="h-4 w-4" />
              ) : (
                <Wifi className="h-4 w-4" />
              )}
              {connectionStatus.connected ? 'Disconnect' : 'Connect'}
            </button>
            
            <button 
              onClick={fetchBinanceData}
              disabled={binanceLoading}
              className="px-4 py-2 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-lg hover:bg-orange-500/30 disabled:opacity-50 transition-all duration-200 flex items-center gap-2 backdrop-blur-sm"
            >
              {binanceLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              REST API
            </button>
            
            <button 
              onClick={handleRefresh}
              disabled={binanceLoading}
              className="p-2 text-slate-300 hover:text-orange-300 hover:bg-orange-500/20 rounded-lg transition-all duration-200 backdrop-blur-sm border border-slate-600 hover:border-orange-500/30"
              title="Refresh"
            >
              <RefreshCw className={`h-5 w-5 ${binanceLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Connection Status Banner */}
        <div className={`rounded-2xl backdrop-blur-md p-6 mb-8 border shadow-2xl ${
          connectionStatus.connected 
            ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30'
            : connectionStatus.reconnecting
            ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30'
            : 'bg-gradient-to-r from-red-500/10 to-rose-500/10 border-red-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${
                connectionStatus.connected 
                  ? 'bg-green-500/20 border-2 border-green-500'
                  : connectionStatus.reconnecting 
                  ? 'bg-yellow-500/20 border-2 border-yellow-500 animate-pulse'
                  : 'bg-red-500/20 border-2 border-red-500'
              }`}>
                {connectionStatus.connected ? (
                  <Wifi className="h-6 w-6 text-green-400" />
                ) : connectionStatus.reconnecting ? (
                  <RefreshCw className="h-6 w-6 text-yellow-400 animate-spin" />
                ) : (
                  <WifiOff className="h-6 w-6 text-red-400" />
                )}
              </div>
              <div>
                <div className={`font-bold text-xl ${
                  connectionStatus.connected 
                    ? 'text-green-300'
                    : connectionStatus.reconnecting 
                    ? 'text-yellow-300'
                    : 'text-red-300'
                }`}>
                  {connectionStatus.connected 
                    ? '🔴 LIVE - Binance US WebSocket Connected' 
                    : connectionStatus.reconnecting 
                    ? '🟡 Reconnecting to WebSocket...' 
                    : '⚫ Offline - REST API Mode Only'
                  }
                </div>
                <div className={`text-sm ${
                  connectionStatus.connected 
                    ? 'text-green-200'
                    : connectionStatus.reconnecting 
                    ? 'text-yellow-200'
                    : 'text-red-200'
                }`}>
                  {connectionStatus.connected 
                    ? `Last update: ${connectionStatus.lastUpdate ? new Date(connectionStatus.lastUpdate).toLocaleTimeString() : 'N/A'}`
                    : connectionStatus.reconnecting
                    ? 'Attempting to reconnect...'
                    : 'WebSocket disconnected - Using cached data only'
                  }
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xs font-bold px-3 py-2 rounded-full border ${
                connectionStatus.source === 'websocket' 
                  ? 'bg-green-500/20 text-green-300 border-green-500/50'
                  : connectionStatus.source === 'rest'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                  : 'bg-gray-500/20 text-gray-300 border-gray-500/50'
              }`}>
                {connectionStatus.source === 'websocket' ? 'WebSocket' : 
                 connectionStatus.source === 'rest' ? 'REST API' : 'Offline'}
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {binanceError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-8 backdrop-blur-sm">
            <div className="flex items-center">
              <WifiOff className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-300">{binanceError}</span>
            </div>
          </div>
        )}

        {/* Main Dashboard */}
        {binanceData && (
          <>
            {/* Price Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Main Price Display */}
              <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-md rounded-2xl p-8 border border-slate-700/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-full">
                      <DollarSign className="h-6 w-6 text-orange-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{binanceData.symbol}</h2>
                      <p className="text-slate-400">Bitcoin / Tether</p>
                    </div>
                  </div>
                  <div className={`flex items-center text-sm px-3 py-1 rounded-full backdrop-blur-sm ${
                    connectionStatus.connected ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
                  }`}>
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(binanceData.lastUpdate).toLocaleTimeString()}
                  </div>
                </div>
                
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-white mb-4">
                    {formatPrice(binanceData.currentPrice)}
                  </div>
                  <div className={`flex items-center justify-center gap-2 text-lg ${
                    binanceData.priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {binanceData.priceChange >= 0 ? 
                      <ArrowUp className="h-5 w-5" /> : 
                      <ArrowDown className="h-5 w-5" />
                    }
                    <span className="font-semibold">
                      {formatPrice(Math.abs(binanceData.priceChange))}
                    </span>
                    <span>({binanceData.priceChangePercent.toFixed(2)}%)</span>
                  </div>
                </div>

                {/* Real-time Price Ticker */}
                <div className="h-20 flex items-end justify-center mb-4">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-2">Real-time Ticker (1-minute Updates)</p>
                    <MiniChart 
                      data={priceHistory} 
                      width={400} 
                      height={60} 
                      color={binanceData.priceChange >= 0 ? '#22c55e' : '#ef4444'} 
                    />
                  </div>
                </div>

                {/* Historical Chart */}
                <div className="border-t border-slate-700/50 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-orange-400" />
                      <span className="text-sm font-medium text-white">Historical Chart (1-minute Updates)</span>
                    </div>
                    <TimeframeSelector />
                  </div>
                  <div className="h-80 flex items-center justify-center bg-slate-900/30 rounded-lg">
                    <HistoricalChart 
                      data={getFilteredChartData()} 
                      width={600} 
                      height={300} 
                      color={binanceData.priceChange >= 0 ? '#22c55e' : '#ef4444'} 
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>Data points: {getFilteredChartData().length}</span>
                    <span>Timeframe: {selectedTimeframe.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* 24h Stats */}
              <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 text-orange-400 mr-2" />
                  24h Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Volume</span>
                    <div className="text-right">
                      <div className="text-white font-semibold">
                        {formatVolume(binanceData.volume24h)} BTC
                      </div>
                      <div className="text-slate-500 text-xs">
                        {formatPrice(binanceData.volume24h * binanceData.currentPrice)}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">High</span>
                    <span className="text-green-400 font-semibold">
                      {formatPrice(binanceData.high24h)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Low</span>
                    <span className="text-red-400 font-semibold">
                      {formatPrice(binanceData.low24h)}
                    </span>
                  </div>
                  
                  {/* Trading Signal */}
                  <div className="pt-4 border-t border-slate-700/50">
                    <div className="text-slate-400 text-sm mb-2">Signal</div>
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                      binanceData.tradingSignal === 'buy' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                      binanceData.tradingSignal === 'sell' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                      'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    }`}>
                      {binanceData.tradingSignal === 'buy' && <ArrowUp className="h-4 w-4 mr-1" />}
                      {binanceData.tradingSignal === 'sell' && <ArrowDown className="h-4 w-4 mr-1" />}
                      {binanceData.tradingSignal === 'neutral' && <Minus className="h-4 w-4 mr-1" />}
                      {getSignalText(binanceData.tradingSignal)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Indicators Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* SMA 20 */}
              <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500/20 rounded-full">
                      <TrendingUp className="h-4 w-4 text-blue-400" />
                    </div>
                    <h4 className="text-white font-semibold">SMA 20</h4>
                  </div>
                  {binanceData.technicalIndicators.sma20 && (
                    <span className={`font-bold ${
                      binanceData.currentPrice > binanceData.technicalIndicators.sma20 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatPrice(binanceData.technicalIndicators.sma20)}
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm">Simple Moving Average (20 periods)</p>
                {binanceData.technicalIndicators.sma20 && (
                  <div className={`text-xs mt-2 px-2 py-1 rounded-full inline-block ${
                    binanceData.currentPrice > binanceData.technicalIndicators.sma20 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {binanceData.currentPrice > binanceData.technicalIndicators.sma20 ? 'Above SMA' : 'Below SMA'}
                  </div>
                )}
              </div>

              {/* RSI */}
              <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-500/20 rounded-full">
                      <Activity className="h-4 w-4 text-purple-400" />
                    </div>
                    <h4 className="text-white font-semibold">RSI 14</h4>
                  </div>
                  {binanceData.technicalIndicators.rsi14 && (
                    <span className={`font-bold ${
                      binanceData.technicalIndicators.rsi14 >= 70 ? 'text-red-400' :
                      binanceData.technicalIndicators.rsi14 <= 30 ? 'text-green-400' : 'text-blue-400'
                    }`}>
                      {binanceData.technicalIndicators.rsi14.toFixed(1)}
                    </span>
                  )}
                </div>
                {binanceData.technicalIndicators.rsi14 && (
                  <>
                    <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          binanceData.technicalIndicators.rsi14 >= 70 ? 'bg-red-500' :
                          binanceData.technicalIndicators.rsi14 <= 30 ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${binanceData.technicalIndicators.rsi14}%` }}
                      ></div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                      binanceData.technicalIndicators.rsi14 >= 70 ? 'bg-red-500/20 text-red-300' :
                      binanceData.technicalIndicators.rsi14 <= 30 ? 'bg-green-500/20 text-green-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {getRSIStatus(binanceData.technicalIndicators.rsi14).text}
                    </div>
                  </>
                )}
              </div>

              {/* MACD */}
              <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-cyan-500/20 rounded-full">
                      <BarChart3 className="h-4 w-4 text-cyan-400" />
                    </div>
                    <h4 className="text-white font-semibold">MACD</h4>
                  </div>
                  {binanceData.technicalIndicators.macd && (
                    <span className={`font-bold ${
                      binanceData.technicalIndicators.macd > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {binanceData.technicalIndicators.macd.toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm">Moving Average Convergence Divergence</p>
                {binanceData.technicalIndicators.macd && binanceData.technicalIndicators.macdSignal && (
                  <div className="mt-2 space-y-1">
                    <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                      binanceData.technicalIndicators.macd > binanceData.technicalIndicators.macdSignal 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {binanceData.technicalIndicators.macd > binanceData.technicalIndicators.macdSignal ? 'Bullish' : 'Bearish'}
                    </div>
                  </div>
                )}
              </div>

              {/* Bollinger Bands */}
              <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-yellow-500/20 rounded-full">
                    <Target className="h-4 w-4 text-yellow-400" />
                  </div>
                  <h4 className="text-white font-semibold">Bollinger Bands</h4>
                </div>
                <div className="space-y-3">
                  {binanceData.technicalIndicators.bollingerUpper && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Upper</span>
                      <span className="text-red-400 font-semibold">
                        {formatPrice(binanceData.technicalIndicators.bollingerUpper)}
                      </span>
                    </div>
                  )}
                  {binanceData.technicalIndicators.bollingerMiddle && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Middle</span>
                      <span className="text-blue-400 font-semibold">
                        {formatPrice(binanceData.technicalIndicators.bollingerMiddle)}
                      </span>
                    </div>
                  )}
                  {binanceData.technicalIndicators.bollingerLower && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Lower</span>
                      <span className="text-green-400 font-semibold">
                        {formatPrice(binanceData.technicalIndicators.bollingerLower)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Volume Indicator */}
              <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-indigo-500/20 rounded-full">
                    <Volume2 className="h-4 w-4 text-indigo-400" />
                  </div>
                  <h4 className="text-white font-semibold">Volume Analysis</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">24h Volume</span>
                    <span className="text-white font-semibold">
                      {formatVolume(binanceData.volume24h)} BTC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">USD Value</span>
                    <span className="text-indigo-400 font-semibold">
                      {formatPrice(binanceData.volume24h * binanceData.currentPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Action */}
              <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-orange-500/20 rounded-full">
                    <TrendingUp className="h-4 w-4 text-orange-400" />
                  </div>
                  <h4 className="text-white font-semibold">Price Action</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Current</span>
                    <span className="text-white font-semibold">
                      {formatPrice(binanceData.currentPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">24h Range</span>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">
                        {formatPrice(binanceData.low24h)} - {formatPrice(binanceData.high24h)}
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="h-2 bg-gradient-to-r from-red-500 to-green-500 rounded-full"
                      style={{ 
                        width: `${((binanceData.currentPrice - binanceData.low24h) / (binanceData.high24h - binanceData.low24h)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* History-Based Technical Indicators Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-full">
                <Database className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">History-Based Technical Analysis</h2>
                <p className="text-slate-300">Real-time calculations from bitcoin_prices database table</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-md">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-5 w-5 text-purple-400" />
                <span className="text-white font-medium">Direct Database Calculation</span>
              </div>
              <p className="text-slate-300 text-sm">
                This section uses the bitcoin_prices history table directly to calculate technical indicators in real-time.
                Unlike the cached indicators above, these are computed on-demand from raw price data.
              </p>
            </div>
            
            <HistoryBasedIndicators 
              hours={72} 
              refreshInterval={30000}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}