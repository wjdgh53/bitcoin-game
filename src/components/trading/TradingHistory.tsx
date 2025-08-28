'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  TradingHistoryItem,
  TradingHistoryFilters,
  TradingHistorySortConfig,
  TradingHistorySortField,
} from '@/types/trading';
import {
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  Search,
  X,
} from 'lucide-react';

interface TradingHistoryProps {
  trades: TradingHistoryItem[];
  onExport?: (format: 'csv' | 'json') => void;
}

export default function TradingHistory({ trades, onExport }: TradingHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [filters, setFilters] = useState<TradingHistoryFilters>({
    action: 'ALL',
    outcome: 'all',
  });
  
  const [sortConfig, setSortConfig] = useState<TradingHistorySortConfig>({
    field: 'timestamp',
    direction: 'desc',
  });

  // Filter trades
  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !trade.symbol.toLowerCase().includes(query) &&
          !trade.strategyUsed.toLowerCase().includes(query) &&
          !trade.reasoning.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Action filter
      if (filters.action !== 'ALL' && trade.action !== filters.action) {
        return false;
      }

      // Outcome filter
      if (filters.outcome !== 'all' && trade.result) {
        const isProfitable = trade.result.profitLoss > 0;
        if (filters.outcome === 'profitable' && !isProfitable) return false;
        if (filters.outcome === 'unprofitable' && isProfitable) return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const tradeDate = new Date(trade.timestamp);
        if (tradeDate < filters.dateRange.start || tradeDate > filters.dateRange.end) {
          return false;
        }
      }

      // Symbol filter
      if (filters.symbol && trade.symbol !== filters.symbol) {
        return false;
      }

      // Amount filters
      if (filters.minAmount && trade.total < filters.minAmount) return false;
      if (filters.maxAmount && trade.total > filters.maxAmount) return false;

      // Strategy filter
      if (filters.strategy && trade.strategyUsed !== filters.strategy) {
        return false;
      }

      return true;
    });
  }, [trades, filters, searchQuery]);

  // Sort trades
  const sortedTrades = useMemo(() => {
    const sorted = [...filteredTrades].sort((a, b) => {
      const field = sortConfig.field;
      let aVal: any = a[field as keyof TradingHistoryItem];
      let bVal: any = b[field as keyof TradingHistoryItem];

      // Special handling for nested fields
      if (field === 'profitLoss' || field === 'percentReturn') {
        aVal = a.result?.[field as keyof typeof a.result] || 0;
        bVal = b.result?.[field as keyof typeof b.result] || 0;
      }

      // Handle dates
      if (aVal instanceof Date) {
        aVal = aVal.getTime();
        bVal = bVal.getTime();
      }

      // Compare values
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredTrades, sortConfig]);

  // Pagination
  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedTrades.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedTrades, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedTrades.length / itemsPerPage);

  const handleSort = useCallback((field: TradingHistorySortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const clearFilters = () => {
    setFilters({
      action: 'ALL',
      outcome: 'all',
    });
    setSearchQuery('');
  };

  // Get unique values for filter dropdowns
  const uniqueSymbols = Array.from(new Set(trades.map(t => t.symbol)));
  const uniqueStrategies = Array.from(new Set(trades.map(t => t.strategyUsed)));

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="검색 (심볼, 전략, 이유)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
              showFilters
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            필터
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onExport?.('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={() => onExport?.('json')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
          >
            <Download className="w-4 h-4" />
            JSON
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">필터 옵션</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              필터 초기화
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                거래 유형
              </label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">전체</option>
                <option value="BUY">매수</option>
                <option value="SELL">매도</option>
              </select>
            </div>

            {/* Outcome Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수익 여부
              </label>
              <select
                value={filters.outcome}
                onChange={(e) => setFilters({ ...filters, outcome: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체</option>
                <option value="profitable">수익</option>
                <option value="unprofitable">손실</option>
              </select>
            </div>

            {/* Symbol Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                심볼
              </label>
              <select
                value={filters.symbol || ''}
                onChange={(e) => setFilters({ ...filters, symbol: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                {uniqueSymbols.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
            </div>

            {/* Strategy Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전략
              </label>
              <select
                value={filters.strategy || ''}
                onChange={(e) => setFilters({ ...filters, strategy: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                {uniqueStrategies.map(strategy => (
                  <option key={strategy} value={strategy}>{strategy}</option>
                ))}
              </select>
            </div>

            {/* Min Amount Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최소 금액
              </label>
              <input
                type="number"
                value={filters.minAmount || ''}
                onChange={(e) => setFilters({ ...filters, minAmount: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Max Amount Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최대 금액
              </label>
              <input
                type="number"
                value={filters.maxAmount || ''}
                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="999999"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th 
                  onClick={() => handleSort('timestamp')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  날짜
                </th>
                <th 
                  onClick={() => handleSort('symbol')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  심볼
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  유형
                </th>
                <th 
                  onClick={() => handleSort('quantity')}
                  className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  수량
                </th>
                <th 
                  onClick={() => handleSort('price')}
                  className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  가격
                </th>
                <th 
                  onClick={() => handleSort('total')}
                  className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  총액
                </th>
                <th 
                  onClick={() => handleSort('profitLoss')}
                  className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  손익
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  전략
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTrades.map((trade) => (
                <tr key={trade.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(trade.timestamp).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {trade.symbol}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                      trade.action === 'BUY' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {trade.action === 'BUY' ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {trade.action === 'BUY' ? '매수' : '매도'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {trade.quantity.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(trade.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                    {formatCurrency(trade.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {trade.result && (
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-semibold ${
                          trade.result.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {trade.result.profitLoss >= 0 ? (
                            <TrendingUp className="inline w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="inline w-3 h-3 mr-1" />
                          )}
                          {formatCurrency(Math.abs(trade.result.profitLoss))}
                        </span>
                        <span className={`text-xs ${
                          trade.result.percentReturn >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatPercent(trade.result.percentReturn)}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {trade.strategyUsed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                총 {sortedTrades.length}개 중 {((currentPage - 1) * itemsPerPage) + 1}-
                {Math.min(currentPage * itemsPerPage, sortedTrades.length)}개 표시
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-lg font-medium text-sm ${
                          currentPage === pageNum
                            ? 'bg-blue-500 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}