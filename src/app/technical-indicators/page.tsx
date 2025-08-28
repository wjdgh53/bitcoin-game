'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Target, Shield, AlertTriangle, Brain, RefreshCw, Activity } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface TechnicalIndicator {
  id: string;
  timestamp: string;
  symbol: string;
  timeframe: string;
  price: number;
  high: number;
  low: number;
  volume?: number;
  sma5?: number;
  sma10?: number;
  sma20?: number;
  sma50?: number;
  ema12?: number;
  ema26?: number;
  rsi?: number;
  stochK?: number;
  stochD?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
  bbWidth?: number;
  support?: number;
  resistance?: number;
}

interface TechnicalReport {
  id: string;
  timestamp: string;
  symbol: string;
  timeframe: string;
  overallTrend: 'bullish' | 'bearish' | 'neutral' | 'sideways';
  trendStrength: number;
  confidence: number;
  buySignals: number;
  sellSignals: number;
  neutralSignals: number;
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  keySupport?: number;
  keyResistance?: number;
  nextTarget?: number;
  stopLoss?: number;
  summary: string;
  aiInsights: string;
  riskAssessment: string;
  signalStrength: number;
  volatilityLevel: 'low' | 'medium' | 'high' | 'extreme';
}

export default function TechnicalIndicatorsPage() {
  const [indicators, setIndicators] = useState<TechnicalIndicator | null>(null);
  const [report, setReport] = useState<TechnicalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>('1d');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      
      // Fetch latest indicators and report
      const [indicatorsResponse, reportResponse] = await Promise.all([
        fetch(`/api/technical-indicators?latest=true&timeframe=${timeframe}`),
        fetch(`/api/technical-indicators/reports?latest=true&timeframe=${timeframe}`)
      ]);

      const indicatorsResult = await indicatorsResponse.json();
      const reportResult = await reportResponse.json();

      if (indicatorsResult.success && indicatorsResult.data.length > 0) {
        setIndicators(indicatorsResult.data[0]);
      }

      if (reportResult.success && reportResult.data.length > 0) {
        setReport(reportResult.data[0]);
      }

      // If no data available, generate mock data
      if (!indicatorsResult.success || indicatorsResult.data.length === 0) {
        console.log('No technical indicators available, generating mock data...');
        const mockResponse = await fetch('/api/technical-indicators/mock', {
          method: 'POST',
        });
        
        const mockResult = await mockResponse.json();
        if (mockResult.success) {
          setIndicators(mockResult.data.indicators);
          setReport(mockResult.data.report);
        }
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching technical data:', err);
      setError('기술지표 데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeframe]);

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish': return 'text-green-600 bg-green-100';
      case 'bearish': return 'text-red-600 bg-red-100';
      case 'sideways': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_buy': return 'text-green-700 bg-green-200 border-green-300';
      case 'buy': return 'text-green-600 bg-green-100 border-green-200';
      case 'hold': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'sell': return 'text-red-600 bg-red-100 border-red-200';
      case 'strong_sell': return 'text-red-700 bg-red-200 border-red-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_buy': return '적극 매수';
      case 'buy': return '매수';
      case 'hold': return '보유';
      case 'sell': return '매도';
      case 'strong_sell': return '적극 매도';
      default: return '중립';
    }
  };

  const getRSIStatus = (rsi?: number) => {
    if (!rsi) return { text: 'N/A', color: 'text-gray-500' };
    if (rsi >= 70) return { text: '과매수', color: 'text-red-600' };
    if (rsi <= 30) return { text: '과매도', color: 'text-green-600' };
    return { text: '중립', color: 'text-blue-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-white animate-pulse" />
              </div>
              <p className="text-gray-600">기술지표 데이터 로딩 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={handleRefresh}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!indicators || !report) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">기술지표 데이터가 없습니다</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const rsiStatus = getRSIStatus(indicators.rsi);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">기술지표 분석</h1>
              <p className="text-gray-600">AI 기반 비트코인 기술적 분석</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Timeframe Selector */}
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="1h">1시간</option>
              <option value="4h">4시간</option>
              <option value="1d">1일</option>
              <option value="1w">1주</option>
            </select>
            
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              title="새로고침"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Overall Analysis */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Brain className="h-5 w-5 text-purple-600 mr-2" />
              AI 종합 분석
            </h2>
            <div className="text-sm text-gray-500">
              {lastUpdate && `마지막 업데이트: ${lastUpdate.toLocaleTimeString()}`}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trend Analysis */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">전체 추세</span>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getTrendColor(report.overallTrend)}`}>
                  {report.overallTrend === 'bullish' && '상승'}
                  {report.overallTrend === 'bearish' && '하락'}
                  {report.overallTrend === 'sideways' && '횡보'}
                  {report.overallTrend === 'neutral' && '중립'}
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">추세 강도</span>
                <span className="text-sm font-semibold">{report.trendStrength.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${report.trendStrength}%` }}
                ></div>
              </div>
            </div>

            {/* Recommendation */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">권고사항</span>
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getRecommendationColor(report.recommendation)}`}>
                  {getRecommendationText(report.recommendation)}
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">신뢰도</span>
                <span className="text-sm font-semibold">{report.confidence.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${report.confidence}%` }}
                ></div>
              </div>
            </div>

            {/* Signal Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <span className="text-sm font-medium text-gray-700 mb-3 block">신호 현황</span>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    매수
                  </span>
                  <span className="text-sm font-semibold text-green-600">{report.buySignals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-red-600 flex items-center">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    매도
                  </span>
                  <span className="text-sm font-semibold text-red-600">{report.sellSignals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 flex items-center">
                    <Activity className="h-3 w-3 mr-1" />
                    중립
                  </span>
                  <span className="text-sm font-semibold text-gray-600">{report.neutralSignals}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Summary */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">AI 분석 요약</h3>
            <p className="text-sm text-blue-800">{report.summary}</p>
          </div>
        </div>

        {/* Technical Indicators Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Price & Moving Averages */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">가격 & 이동평균선</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium">현재가</span>
                <span className="text-lg font-bold text-orange-600">${indicators.price.toLocaleString()}</span>
              </div>
              
              {indicators.sma5 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">SMA 5일</span>
                  <span className={`font-semibold ${indicators.price > indicators.sma5 ? 'text-green-600' : 'text-red-600'}`}>
                    ${indicators.sma5.toLocaleString()}
                  </span>
                </div>
              )}
              
              {indicators.sma20 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">SMA 20일</span>
                  <span className={`font-semibold ${indicators.price > indicators.sma20 ? 'text-green-600' : 'text-red-600'}`}>
                    ${indicators.sma20.toLocaleString()}
                  </span>
                </div>
              )}
              
              {indicators.sma50 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">SMA 50일</span>
                  <span className={`font-semibold ${indicators.price > indicators.sma50 ? 'text-green-600' : 'text-red-600'}`}>
                    ${indicators.sma50.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Oscillators */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">오실레이터</h3>
            <div className="space-y-4">
              {indicators.rsi && (
                <div className="p-3 bg-gray-50 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">RSI (14)</span>
                    <span className={`text-sm font-semibold ${rsiStatus.color}`}>
                      {indicators.rsi.toFixed(1)} ({rsiStatus.text})
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        indicators.rsi >= 70 ? 'bg-red-500' : 
                        indicators.rsi <= 30 ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${indicators.rsi}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {indicators.stochK && indicators.stochD && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Stochastic %K</span>
                    <span className="font-semibold">{indicators.stochK.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Stochastic %D</span>
                    <span className="font-semibold">{indicators.stochD.toFixed(1)}</span>
                  </div>
                </div>
              )}
              
              {indicators.macd && indicators.macdSignal && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">MACD</span>
                    <span className={`font-semibold ${indicators.macd > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {indicators.macd.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">MACD Signal</span>
                    <span className="font-semibold">{indicators.macdSignal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Key Levels & Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Key Levels */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Target className="h-5 w-5 text-blue-500 mr-2" />
              주요 레벨
            </h3>
            <div className="space-y-4">
              {report.keyResistance && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                  <span className="text-sm font-medium text-red-700">저항선</span>
                  <span className="font-bold text-red-600">${report.keyResistance.toLocaleString()}</span>
                </div>
              )}
              
              {report.keySupport && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                  <span className="text-sm font-medium text-green-700">지지선</span>
                  <span className="font-bold text-green-600">${report.keySupport.toLocaleString()}</span>
                </div>
              )}
              
              {report.nextTarget && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">목표가</span>
                  <span className="font-semibold text-blue-600">${report.nextTarget.toLocaleString()}</span>
                </div>
              )}
              
              {report.stopLoss && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">손절가</span>
                  <span className="font-semibold text-orange-600">${report.stopLoss.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Shield className="h-5 w-5 text-yellow-500 mr-2" />
              리스크 평가
            </h3>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">변동성 수준</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  report.volatilityLevel === 'extreme' ? 'bg-red-100 text-red-700' :
                  report.volatilityLevel === 'high' ? 'bg-orange-100 text-orange-700' :
                  report.volatilityLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {report.volatilityLevel === 'extreme' && '극도'}
                  {report.volatilityLevel === 'high' && '높음'}
                  {report.volatilityLevel === 'medium' && '보통'}
                  {report.volatilityLevel === 'low' && '낮음'}
                </span>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">신호 강도</span>
                <span className="font-semibold">{report.signalStrength}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${report.signalStrength}%` }}
                ></div>
              </div>
            </div>
            
            <div className="p-3 bg-yellow-50 rounded">
              <p className="text-sm text-yellow-800">{report.riskAssessment}</p>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Brain className="h-5 w-5 text-purple-500 mr-2" />
            AI 상세 분석
          </h3>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-800 leading-relaxed">{report.aiInsights}</p>
          </div>
        </div>
      </div>
    </div>
  );
}