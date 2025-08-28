'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Bitcoin, DollarSign, Wallet, PieChart, RefreshCw, AlertTriangle } from 'lucide-react';

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

interface PortfolioTableProps {
  className?: string;
  refreshInterval?: number; // minutes
}

export default function PortfolioTable({ 
  className = "",
  refreshInterval = 10 
}: PortfolioTableProps) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [currentPrice, setCurrentPrice] = useState<BitcoinPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      
      // Fetch current Bitcoin price
      const priceResponse = await fetch('/api/bitcoin/current');
      const priceResult = await priceResponse.json();
      
      if (priceResult.success) {
        setCurrentPrice(priceResult.data);
      }

      // Fetch portfolio data
      const portfolioResponse = await fetch('/api/portfolio');
      const portfolioResult = await portfolioResponse.json();
      
      if (portfolioResult.success) {
        setPortfolio(portfolioResult.data);
      } else {
        throw new Error(portfolioResult.message || 'Failed to fetch portfolio');
      }

      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching portfolio data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Auto refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  if (loading && !portfolio) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center">
            <Wallet className="h-5 w-5 text-gray-500 mr-2" />
            Portfolio Overview
          </h3>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center">
            <Wallet className="h-5 w-5 text-gray-500 mr-2" />
            Portfolio Overview
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 mb-4">Failed to load portfolio data</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center">
            <Wallet className="h-5 w-5 text-gray-500 mr-2" />
            Portfolio Overview
          </h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          No portfolio data available
        </div>
      </div>
    );
  }

  const currentBTCPrice = currentPrice?.price || 0;
  const bitcoinValue = portfolio.bitcoinHoldings * currentBTCPrice;
  const cashPercentage = portfolio.totalValue > 0 ? (portfolio.balance / portfolio.totalValue) * 100 : 0;
  const bitcoinPercentage = portfolio.totalValue > 0 ? (bitcoinValue / portfolio.totalValue) * 100 : 0;

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center">
          <Wallet className="h-5 w-5 text-gray-500 mr-2" />
          Portfolio Overview
        </h3>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500">
            {lastRefresh && (
              <>Updated: {lastRefresh.toLocaleTimeString()}</>
            )}
          </div>
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Refresh portfolio"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Value */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-200">
              <PieChart className="h-6 w-6 text-blue-700" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-blue-700 font-medium">Total Value</p>
              <p className="text-2xl font-bold text-blue-900">
                ${portfolio.totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Profit/Loss */}
        <div className={`rounded-lg p-4 ${
          portfolio.profit >= 0 
            ? 'bg-gradient-to-r from-green-50 to-green-100' 
            : 'bg-gradient-to-r from-red-50 to-red-100'
        }`}>
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${
              portfolio.profit >= 0 ? 'bg-green-200' : 'bg-red-200'
            }`}>
              {portfolio.profit >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-700" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-700" />
              )}
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${
                portfolio.profit >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                Total P&L
              </p>
              <p className={`text-2xl font-bold ${
                portfolio.profit >= 0 ? 'text-green-900' : 'text-red-900'
              }`}>
                {portfolio.profit >= 0 ? '+' : ''}${portfolio.profit.toFixed(2)}
              </p>
              <p className={`text-sm ${
                portfolio.profit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ({portfolio.profitPercentage >= 0 ? '+' : ''}{portfolio.profitPercentage.toFixed(2)}%)
              </p>
            </div>
          </div>
        </div>

        {/* Bitcoin Holdings */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-200">
              <Bitcoin className="h-6 w-6 text-orange-700" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-orange-700 font-medium">BTC Holdings</p>
              <p className="text-2xl font-bold text-orange-900">
                {portfolio.bitcoinHoldings.toFixed(6)}
              </p>
              <p className="text-sm text-orange-600">
                ≈ ${bitcoinValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Cash Balance */}
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-emerald-200">
              <DollarSign className="h-6 w-6 text-emerald-700" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-emerald-700 font-medium">Cash Balance</p>
              <p className="text-2xl font-bold text-emerald-900">
                ${portfolio.balance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Allocation */}
      <div className="border-t pt-6">
        <h4 className="text-base font-semibold mb-4 text-gray-900">Asset Allocation</h4>
        <div className="space-y-4">
          {/* Cash Allocation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-emerald-500 rounded mr-3"></div>
              <span className="text-sm font-medium text-gray-700">Cash (USD)</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${cashPercentage}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600 min-w-[60px] text-right">
                {cashPercentage.toFixed(1)}%
              </div>
              <div className="text-sm font-semibold text-gray-900 min-w-[80px] text-right">
                ${portfolio.balance.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Bitcoin Allocation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-500 rounded mr-3"></div>
              <span className="text-sm font-medium text-gray-700">Bitcoin (BTC)</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${bitcoinPercentage}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600 min-w-[60px] text-right">
                {bitcoinPercentage.toFixed(1)}%
              </div>
              <div className="text-sm font-semibold text-gray-900 min-w-[80px] text-right">
                ${bitcoinValue.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Performance */}
      <div className="border-t pt-6 mt-6">
        <h4 className="text-base font-semibold mb-4 text-gray-900">Performance Metrics</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Initial Investment</p>
            <p className="text-lg font-bold text-gray-900">$10,000.00</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Current BTC Price</p>
            <p className="text-lg font-bold text-gray-900">${currentBTCPrice.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Last Updated</p>
            <p className="text-lg font-bold text-gray-900">
              {new Date(portfolio.lastUpdated).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t pt-4 mt-6">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Portfolio updates every {refreshInterval} minutes</span>
          <span>Demo trading simulation</span>
        </div>
      </div>
    </div>
  );
}