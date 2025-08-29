'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useWatchlist } from '@/lib/hooks/use-watchlist';
import { WatchlistItemInput, WatchlistItemUpdateInput, WatchlistItemOutput } from '@/types/watchlist';
import Navbar from '@/components/Navbar';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Bell, 
  BellOff, 
  Bitcoin, 
  DollarSign, 
  BarChart3,
  AlertTriangle,
  Star,
  Filter,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  Tag,
  Calendar,
  Activity
} from 'lucide-react';

interface FormData extends WatchlistItemInput {
  id?: string;
}

const POPULAR_CRYPTOCURRENCIES = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { symbol: 'ADA', name: 'Cardano', icon: '₳' },
  { symbol: 'SOL', name: 'Solana', icon: '◎' },
  { symbol: 'DOT', name: 'Polkadot', icon: '●' }
];

const ALERT_TYPES = [
  { value: 'above', label: '가격 이상', desc: '목표가 이상일 때 알림' },
  { value: 'below', label: '가격 이하', desc: '목표가 이하일 때 알림' },
  { value: 'both', label: '양방향', desc: '목표가 도달 시 알림' }
];

const COMMON_TAGS = [
  'DeFi', '메타버스', 'NFT', 'AI', '레이어2', '스테이킹', 
  '게임파이', '스토리지', 'DEX', '오라클', '브리지', 'DAO'
];

export default function WatchlistPage() {
  const {
    items,
    searchResults,
    analytics,
    loading,
    searchLoading,
    error,
    createWatchlistItem,
    loadWatchlistItems,
    updateWatchlistItem,
    deleteWatchlistItem,
    searchWatchlistItems,
    clearSearch,
    loadAnalytics
  } = useWatchlist({ autoLoad: true });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingItem, setEditingItem] = useState<WatchlistItemOutput | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'triggered' | 'above' | 'below'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'performance' | 'alphabetical'>('newest');
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    symbol: '',
    name: '',
    alertPrice: undefined,
    alertType: undefined,
    notes: '',
    tags: []
  });

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items;

    // Apply filters
    switch (filterBy) {
      case 'triggered':
        filtered = filtered.filter(item => item.alertTriggered);
        break;
      case 'above':
        filtered = filtered.filter(item => item.alertType === 'above');
        break;
      case 'below':
        filtered = filtered.filter(item => item.alertType === 'below');
        break;
    }

    // Apply search if not using search results
    if (searchQuery && !searchLoading && searchResults.length === 0) {
      filtered = filtered.filter(item => 
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sort items
    switch (sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'performance':
        filtered.sort((a, b) => (b.priceChange24h || 0) - (a.priceChange24h || 0));
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.symbol.localeCompare(b.symbol));
        break;
      default: // newest
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  }, [items, filterBy, sortBy, searchQuery, searchLoading, searchResults]);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        searchWatchlistItems(searchQuery);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      clearSearch();
    }
  }, [searchQuery, searchWatchlistItems, clearSearch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadWatchlistItems();
      await loadAnalytics();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem && showEditForm) {
        const updateData: WatchlistItemUpdateInput = {
          name: formData.name,
          alertPrice: formData.alertPrice,
          alertType: formData.alertType,
          notes: formData.notes,
          tags: formData.tags
        };
        await updateWatchlistItem(editingItem.id, updateData);
        setShowEditForm(false);
        setEditingItem(null);
      } else {
        await createWatchlistItem(formData);
        setShowCreateForm(false);
      }
      
      resetForm();
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      symbol: '',
      name: '',
      alertPrice: undefined,
      alertType: undefined,
      notes: '',
      tags: []
    });
  };

  const handleEdit = (item: WatchlistItemOutput) => {
    setEditingItem(item);
    setFormData({
      id: item.id,
      symbol: item.symbol,
      name: item.name,
      alertPrice: item.alertPrice,
      alertType: item.alertType,
      notes: item.notes || '',
      tags: item.tags || []
    });
    setShowEditForm(true);
    setShowCreateForm(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말로 이 항목을 삭제하시겠습니까?')) {
      await deleteWatchlistItem(id);
    }
  };

  const handlePopularCryptoSelect = (crypto: typeof POPULAR_CRYPTOCURRENCIES[0]) => {
    setFormData(prev => ({
      ...prev,
      symbol: crypto.symbol,
      name: crypto.name
    }));
  };

  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...(prev.tags || []), tag]
    }));
  };

  const closeAllForms = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setEditingItem(null);
    resetForm();
  };

  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bitcoin className="h-8 w-8 text-white animate-pulse" />
              </div>
              <p className="text-gray-800">관심 종목 로딩 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayItems = searchResults.length > 0 ? searchResults.map(result => ({
    ...result,
    userId: 'demo-user-123',
    notes: result.alertType || '',
    tags: [],
    alertTriggered: false,
    updatedAt: result.createdAt,
    lastAlertAt: undefined
  })) : filteredAndSortedItems;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div className="flex items-center mb-4 sm:mb-0">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-3">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">관심 종목</h1>
              <p className="text-gray-800">암호화폐 시장을 추적하고 알림을 설정하세요</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              새로고침
            </button>
            
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
            >
              {showAnalytics ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showAnalytics ? '분석 숨기기' : '분석 보기'}
            </button>
            
            <button
              onClick={() => {
                setShowCreateForm(true);
                setShowEditForm(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              종목 추가
            </button>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {showAnalytics && analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-800">총 관심 종목</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalItems}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100">
                  <Bell className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-800">알림 발생</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.triggeredAlerts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${analytics.averageGain >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {analytics.averageGain >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-800">평균 수익률</p>
                  <p className={`text-2xl font-bold ${analytics.averageGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.averageGain >= 0 ? '+' : ''}{analytics.averageGain.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-800">상위 수익</p>
                  <p className="text-xl font-bold text-gray-900">
                    {analytics.topPerformers[0]?.symbol || 'N/A'}
                  </p>
                  {analytics.topPerformers[0] && (
                    <p className="text-sm text-green-600">
                      +{analytics.topPerformers[0].priceChange24h.toFixed(2)}%
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-700" />
              <input
                type="text"
                placeholder="종목명, 심볼, 태그로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <RefreshCw className="h-4 w-4 text-gray-700 animate-spin" />
                </div>
              )}
            </div>

            {/* Filter */}
            <div className="flex gap-3">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">모든 항목</option>
                <option value="triggered">알림 발생</option>
                <option value="above">상승 알림</option>
                <option value="below">하락 알림</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="newest">최신순</option>
                <option value="oldest">오래된순</option>
                <option value="performance">수익률순</option>
                <option value="alphabetical">가나다순</option>
              </select>
            </div>
          </div>
        </div>

        {/* Watchlist Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {displayItems.length === 0 ? (
            <div className="col-span-full">
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-gray-700" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">관심 종목이 없습니다</h3>
                <p className="text-gray-800 mb-6">
                  {searchQuery ? '검색 결과가 없습니다.' : '첫 번째 관심 종목을 추가해보세요.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    종목 추가하기
                  </button>
                )}
              </div>
            </div>
          ) : (
            displayItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                {/* Card Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                        <span className="font-bold text-orange-600">
                          {POPULAR_CRYPTOCURRENCIES.find(c => c.symbol === item.symbol)?.icon || item.symbol.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{item.symbol}</h3>
                        <p className="text-sm text-gray-800">{item.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {item.alertTriggered && (
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      )}
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Information */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        ${item.currentPrice?.toLocaleString() || 'N/A'}
                      </p>
                      {item.priceChange24h !== undefined && (
                        <div className={`flex items-center mt-1 ${item.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.priceChange24h >= 0 ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 mr-1" />
                          )}
                          <span className="font-medium">
                            {item.priceChange24h >= 0 ? '+' : ''}{item.priceChange24h.toFixed(2)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {item.alertPrice && (
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-800 mb-1">
                          {item.alertType === 'above' ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : item.alertType === 'below' ? (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          )}
                          목표가
                        </div>
                        <p className="font-bold text-gray-900">
                          ${item.alertPrice.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Alert Status */}
                  {item.alertPrice && (
                    <div className="mb-3">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        item.alertTriggered 
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item.alertTriggered ? (
                          <>
                            <Bell className="h-3 w-3" />
                            알림 발생
                          </>
                        ) : (
                          <>
                            <BellOff className="h-3 w-3" />
                            알림 대기
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-md"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <div className="text-sm text-gray-800 mb-3">
                      <p className="line-clamp-2">{item.notes}</p>
                    </div>
                  )}

                  {/* Created Date */}
                  <div className="flex items-center text-xs text-gray-800 pt-3 border-t border-gray-100">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(item.createdAt).toLocaleDateString('ko-KR')} 추가
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center text-red-700">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateForm || showEditForm) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {showEditForm ? '관심 종목 수정' : '관심 종목 추가'}
                </h2>
                <button
                  onClick={closeAllForms}
                  className="p-2 text-gray-700 hover:text-gray-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {!showEditForm && (
                <>
                  {/* Popular Cryptocurrencies */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      인기 암호화폐
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {POPULAR_CRYPTOCURRENCIES.map((crypto) => (
                        <button
                          key={crypto.symbol}
                          type="button"
                          onClick={() => handlePopularCryptoSelect(crypto)}
                          className={`p-3 border rounded-lg text-center transition-colors ${
                            formData.symbol === crypto.symbol
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-lg font-bold mb-1">{crypto.icon}</div>
                          <div className="text-xs font-bold">{crypto.symbol}</div>
                          <div className="text-xs text-gray-800">{crypto.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Symbol Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        심볼 *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.symbol}
                        onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                        placeholder="BTC, ETH..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        이름 *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Bitcoin, Ethereum..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Alert Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    알림 가격
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.alertPrice || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      alertPrice: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    placeholder="예: 50000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    알림 타입
                  </label>
                  <select
                    value={formData.alertType || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      alertType: e.target.value as any || undefined 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">알림 설정 안함</option>
                    {ALERT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {formData.alertType && (
                    <p className="text-xs text-gray-800 mt-1">
                      {ALERT_TYPES.find(t => t.value === formData.alertType)?.desc}
                    </p>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  태그
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {COMMON_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                        formData.tags?.includes(tag)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-md"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleTagToggle(tag)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  메모
                </label>
                <textarea
                  rows={3}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="개인적인 메모나 분석 내용을 입력하세요..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeAllForms}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? '처리 중...' : (showEditForm ? '수정하기' : '추가하기')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}