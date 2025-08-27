'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Bitcoin, DollarSign, BarChart3, Trophy, Brain } from 'lucide-react';
import Navbar from '@/components/Navbar';

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

interface Portfolio {
  id: number;
  userId: string;
  balance: number;
  bitcoinHoldings: number;
  totalValue: number;
  profit: number;
  profitPercentage: number;
  lastUpdated: string;
}

interface Trade {
  id: number;
  userId: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
  timestamp: string;
}

export default function DashboardPage() {
  const [priceData, setPriceData] = useState<BitcoinPrice | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API
  const fetchData = async (forceRefresh = false) => {
    try {
      setError(null);
      
      // Check cache first (only for price data)
      if (!forceRefresh) {
        const cachedPrice = localStorage.getItem('bitcoinPrice');
        const cacheTime = localStorage.getItem('bitcoinPriceTime');
        
        if (cachedPrice && cacheTime) {
          const cacheAge = Date.now() - parseInt(cacheTime);
          // Use cache if less than 15 minutes old
          if (cacheAge < 15 * 60 * 1000) {
            setPriceData(JSON.parse(cachedPrice));
            
            // Still fetch portfolio and trades (they might have changed)
            const portfolioResponse = await fetch('/api/portfolio');
            const portfolioResult = await portfolioResponse.json();
            if (portfolioResult.success) {
              setPortfolio(portfolioResult.data);
            }

            const tradesResponse = await fetch('/api/trades');
            const tradesResult = await tradesResponse.json();
            if (tradesResult.success) {
              setTrades(tradesResult.data);
            }
            
            setLoading(false);
            return;
          }
        }
      }
      
      // Fetch current Bitcoin price
      const priceResponse = await fetch('/api/bitcoin/current');
      const priceResult = await priceResponse.json();
      
      if (priceResult.success) {
        setPriceData(priceResult.data);
        // Cache the price data
        localStorage.setItem('bitcoinPrice', JSON.stringify(priceResult.data));
        localStorage.setItem('bitcoinPriceTime', Date.now().toString());
      }

      // Fetch portfolio
      const portfolioResponse = await fetch('/api/portfolio');
      const portfolioResult = await portfolioResponse.json();
      
      if (portfolioResult.success) {
        setPortfolio(portfolioResult.data);
      }

      // Fetch trades
      const tradesResponse = await fetch('/api/trades');
      const tradesResult = await tradesResponse.json();
      
      if (tradesResult.success) {
        setTrades(tradesResult.data);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Refresh data every 15 minutes (only price data)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true); // Force refresh
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bitcoin className="h-8 w-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Loading Bitcoin data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️ {error}</div>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentPrice = priceData?.price || 0;
  const change24h = priceData?.changePercentage24h || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Price Ticker */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bitcoin className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  ${currentPrice.toLocaleString()}
                </h2>
                <div className={`flex items-center mt-1 ${change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {change24h >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  <span className="font-medium">{Math.abs(change24h).toFixed(2)}%</span>
                  <span className="text-gray-500 ml-2">24h</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">마지막 업데이트</div>
              <div className="font-medium">
                {priceData ? new Date(priceData.timestamp).toLocaleTimeString() : 'N/A'}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Source: {priceData?.source || 'CoinGecko'}
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Stats */}
        {portfolio && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">포트폴리오 가치</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${portfolio.totalValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${portfolio.profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {portfolio.profit >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">총 손익</p>
                  <p className={`text-2xl font-bold ${portfolio.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {portfolio.profit >= 0 ? '+' : ''}${portfolio.profit.toFixed(2)}
                  </p>
                  <p className={`text-sm ${portfolio.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ({portfolio.profitPercentage >= 0 ? '+' : ''}{portfolio.profitPercentage.toFixed(2)}%)
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100">
                  <Bitcoin className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">BTC 보유량</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {portfolio.bitcoinHoldings.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">현금 잔액</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${portfolio.balance.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trading Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Chart Placeholder */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <BarChart3 className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-semibold">BTC/USD 차트</h3>
            </div>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>차트 데이터 로딩 중...</p>
                <p className="text-sm mt-1">실시간 비트코인 가격: ${currentPrice.toLocaleString()}</p>
                {priceData && (
                  <div className="text-xs mt-2">
                    <p><span className="font-bold">거래량:</span> ${priceData.volume?.toLocaleString()}</p>
                    <p><span className="font-bold">시가총액:</span> ${priceData.marketCap?.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-600" />
              AI 분석 에이전트
            </h3>
            
            <p className="text-gray-600 mb-6">
              3명의 AI 전문가가 각자의 관점과 전략으로 시장을 분석하고 상세한 리포트를 작성합니다.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🛡️</span>
                      <div>
                        <h4 className="font-semibold text-blue-900">워렌 김</h4>
                        <p className="text-sm text-blue-700">보수적 가치투자자</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">⚡</span>
                      <div>
                        <h4 className="font-semibold text-purple-900">제시카 박</h4>
                        <p className="text-sm text-purple-700">공격적 모멘텀 트레이더</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📊</span>
                      <div>
                        <h4 className="font-semibold text-green-900">알렉스 최</h4>
                        <p className="text-sm text-green-700">데이터 기반 퀀트 분석가</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Link 
                  href="/reports"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                >
                  <Brain className="h-5 w-5" />
                  AI 분석 리포트 보기
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Trade History */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Trophy className="h-5 w-5 text-gray-500 mr-2" />
            거래 기록
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">시간</th>
                  <th className="px-4 py-3">유형</th>
                  <th className="px-4 py-3">수량 (BTC)</th>
                  <th className="px-4 py-3">거래가격</th>
                  <th className="px-4 py-3">총액</th>
                  <th className="px-4 py-3">손익</th>
                </tr>
              </thead>
              <tbody>
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      거래 기록이 없습니다
                    </td>
                  </tr>
                ) : (
                  trades.map((trade) => (
                    <tr key={trade.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-gray-900">
                        {new Date(trade.timestamp).toLocaleString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          trade.type === 'buy' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {trade.type === 'buy' ? '매수' : '매도'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold">
                        {trade.amount.toFixed(6)} BTC
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-800">
                          ${trade.price.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold">
                          ${trade.total.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          if (trade.type === 'buy') {
                            // 매수: 현재가 기준으로 미실현 손익
                            const currentValue = trade.amount * currentPrice;
                            const profit = currentValue - trade.total;
                            const profitPercent = ((currentPrice - trade.price) / trade.price) * 100;
                            
                            return (
                              <div className="text-right">
                                <div className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                                </div>
                                <div className={`text-xs ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  ({profit >= 0 ? '+' : ''}{profitPercent.toFixed(1)}%)
                                </div>
                              </div>
                            );
                          } else {
                            // 매도: 이미 실현된 손익 (거래 완료)
                            return (
                              <div className="text-right">
                                <div className="font-bold text-gray-500">-</div>
                                <div className="text-xs text-gray-400">(완료)</div>
                              </div>
                            );
                          }
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Price Update Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="text-green-600 mr-3">⏰</div>
              <div>
                <h4 className="text-green-900 font-medium">실시간 가격 업데이트</h4>
                <p className="text-green-800 text-sm mt-1">
                  CoinGecko API에서 <strong>15분마다</strong> 실제 비트코인 가격을 자동 업데이트합니다.
                  <br />
                  업데이트 시간: 정시, 15분, 30분, 45분
                </p>
                {priceData && (
                  <p className="text-xs text-green-700 mt-2">
                    마지막 업데이트: {new Date(priceData.timestamp).toLocaleString('ko-KR')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Demo Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="text-blue-600 mr-3">ℹ️</div>
              <div>
                <h4 className="text-blue-900 font-medium">데모 모드</h4>
                <p className="text-blue-800 text-sm mt-1">
                  이것은 학습용 데모입니다. 실제 비트코인 거래는 이루어지지 않으며, 
                  모든 데이터는 실제 시장 데이터를 기반으로 한 시뮬레이션입니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}