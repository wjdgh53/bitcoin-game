'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Bitcoin, DollarSign, BarChart3, Trophy, Brain } from 'lucide-react';
import Navbar from '@/components/Navbar';
import BitcoinChart from '@/components/charts/BitcoinChart';
import PortfolioTable from '@/components/portfolio/PortfolioTable';

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
  const [fetching, setFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<string | null>(null);

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

  // Manual fetch function for CoinGecko data
  const manualFetch = async (type: 'current' | 'historical' | 'portfolio') => {
    setFetching(true);
    setFetchStatus(`Fetching ${type} data from CoinGecko...`);
    
    try {
      const response = await fetch('/api/bitcoin/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, days: 7 }),
      });

      const result = await response.json();
      
      if (result.success) {
        setFetchStatus(`✅ Successfully fetched ${type} data!`);
        // Refresh the dashboard data
        await fetchData(true);
      } else {
        setFetchStatus(`❌ Failed to fetch ${type} data: ${result.error}`);
      }
    } catch (error) {
      console.error('Manual fetch error:', error);
      setFetchStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setFetching(false);
      // Clear status after 5 seconds
      setTimeout(() => setFetchStatus(null), 5000);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bitcoin className="h-8 w-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-800">Loading Bitcoin data...</p>
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
                  <span className="text-gray-800 ml-2">24h</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-800">마지막 업데이트</div>
              <div className="font-medium">
                {priceData ? new Date(priceData.timestamp).toLocaleTimeString() : 'N/A'}
              </div>
              <div className="text-xs text-gray-700 mt-1">
                Source: {priceData?.source || 'CoinGecko'}
              </div>
            </div>
          </div>
        </div>

        {/* Manual Fetch Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Manual Data Fetching</h3>
            {fetchStatus && (
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
                {fetchStatus}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => manualFetch('current')}
              disabled={fetching}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              <TrendingUp className="h-4 w-4" />
              {fetching ? 'Fetching...' : 'Fetch Current Price'}
            </button>
            
            <button
              onClick={() => manualFetch('historical')}
              disabled={fetching}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              {fetching ? 'Fetching...' : 'Fetch Historical (7 days)'}
            </button>
            
            <button
              onClick={() => manualFetch('portfolio')}
              disabled={fetching}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              <DollarSign className="h-4 w-4" />
              {fetching ? 'Updating...' : 'Update Portfolio'}
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>
              <strong>Manual fetching only:</strong> Click the buttons above to fetch fresh data from CoinGecko API. 
              No automatic updates are running - all data fetching is manual.
            </p>
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
                  <p className="text-sm text-gray-800">포트폴리오 가치</p>
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
                  <p className="text-sm text-gray-800">총 손익</p>
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
                  <p className="text-sm text-gray-800">BTC 보유량</p>
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
                  <p className="text-sm text-gray-800">현금 잔액</p>
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
          {/* Live Bitcoin Chart */}
          <BitcoinChart height={280} timeRange={24} />

          {/* AI Analysis */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-600" />
              AI 분석 에이전트
            </h3>
            
            <p className="text-gray-800 mb-6">
              3명의 AI 전문가가 각자의 관점과 전략으로 시장을 분석하고 상세한 리포트를 작성합니다.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🛡️</span>
                      <div>
                        <h4 className="font-bold text-blue-900">워렌 김</h4>
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
                        <h4 className="font-bold text-purple-900">제시카 박</h4>
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
                        <h4 className="font-bold text-green-900">알렉스 최</h4>
                        <p className="text-sm text-green-700">데이터 기반 퀀트 분석가</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Link 
                  href="/reports"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
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
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <Trophy className="h-5 w-5 text-gray-800 mr-2" />
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
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-800">
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
                        <span className="font-bold text-gray-800">
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
                                <div className="font-bold text-gray-800">-</div>
                                <div className="text-xs text-gray-700">(완료)</div>
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
          {/* Manual Fetch Info */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="text-orange-600 mr-3">🔧</div>
              <div>
                <h4 className="text-orange-900 font-medium">Manual Data Fetching</h4>
                <p className="text-orange-800 text-sm mt-1">
                  All data is fetched <strong>manually</strong> from the CoinGecko API when you click the fetch buttons above.
                  <br />
                  No automatic updates - full control over when to refresh data.
                </p>
                {priceData && (
                  <p className="text-xs text-orange-700 mt-2">
                    마지막 업데이트: {new Date(priceData.timestamp).toLocaleString('ko-KR')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* CoinGecko API Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="text-blue-600 mr-3">🌐</div>
              <div>
                <h4 className="text-blue-900 font-medium">Real CoinGecko API</h4>
                <p className="text-blue-800 text-sm mt-1">
                  This system uses the real CoinGecko API to fetch live Bitcoin prices and historical data.
                  Trading is simulated with virtual funds for learning purposes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}