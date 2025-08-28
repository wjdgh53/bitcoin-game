'use client';

import { useState, useEffect } from 'react';
import { Newspaper, TrendingUp, TrendingDown, BarChart3, Search, Filter, RefreshCw, Calendar } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { NewsArticle, NewsReport, NewsFilters } from '@/types/news';

interface SentimentData {
  overallSentiment: number;
  marketTrend: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  newsCount: number;
  categoryBreakdown: Record<string, { count: number; avgSentiment: number; }>;
  lastUpdated: string;
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [reports, setReports] = useState<NewsReport[]>([]);
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<NewsFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [filters]);

  const fetchData = async () => {
    try {
      const [articlesRes, reportsRes, sentimentRes] = await Promise.all([
        fetch('/api/news'),
        fetch('/api/news/reports?limit=3'),
        fetch('/api/news/sentiment')
      ]);

      if (articlesRes.ok) {
        const articlesData = await articlesRes.json();
        setArticles(articlesData.data.articles || []);
      }

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData.data || []);
      }

      if (sentimentRes.ok) {
        const sentimentData = await sentimentRes.json();
        setSentiment(sentimentData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.minImportance) params.append('minImportance', filters.minImportance.toString());
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/news?${params}`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data.data.articles || []);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  const generateMockData = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/news/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_mock' }),
      });

      if (response.ok) {
        await fetchData();
        alert('✅ 테스트 뉴스 데이터가 생성되었습니다!');
      } else {
        alert('❌ 데이터 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error generating mock data:', error);
      alert('❌ 데이터 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchQuery }));
    fetchArticles();
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.2) return 'text-green-600 bg-green-100';
    if (score < -0.2) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getSentimentIcon = (trend: string) => {
    switch (trend) {
      case 'bullish': return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'bearish': return <TrendingDown className="h-5 w-5 text-red-500" />;
      default: return <BarChart3 className="h-5 w-5 text-gray-500" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'technical': '기술',
      'regulatory': '규제',
      'market': '시장',
      'corporate': '기업'
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-500 text-lg">뉴스를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">암호화폐 뉴스</h1>
            <p className="text-gray-600 text-lg">AI가 분석한 최신 시장 동향과 뉴스</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => fetchData()}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              새로고침
            </button>
            
            <button
              onClick={generateMockData}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-6 py-2 rounded-xl disabled:opacity-50 transition-all"
            >
              {isGenerating ? '생성 중...' : '테스트 데이터 생성'}
            </button>
          </div>
        </div>

        {/* Market Sentiment Overview */}
        {sentiment && (
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              {getSentimentIcon(sentiment.marketTrend)}
              <h2 className="text-2xl font-bold text-gray-900">시장 감정 지수</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 px-4 py-2 rounded-xl ${getSentimentColor(sentiment.overallSentiment)}`}>
                  {(sentiment.overallSentiment * 100).toFixed(0)}
                </div>
                <div className="text-gray-600 text-sm">전체 감정 점수</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500 mb-2">{sentiment.marketTrend}</div>
                <div className="text-gray-600 text-sm">시장 트렌드</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500 mb-2">{sentiment.confidence}%</div>
                <div className="text-gray-600 text-sm">신뢰도</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500 mb-2">{sentiment.newsCount}</div>
                <div className="text-gray-600 text-sm">뉴스 개수 (24h)</div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="뉴스 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={handleSearch}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl transition-all"
              >
                검색
              </button>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl transition-all"
            >
              <Filter className="h-5 w-5" />
              필터
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as any || undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">전체</option>
                    <option value="technical">기술</option>
                    <option value="regulatory">규제</option>
                    <option value="market">시장</option>
                    <option value="corporate">기업</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">최소 중요도</label>
                  <select
                    value={filters.minImportance || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, minImportance: e.target.value ? parseInt(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">전체</option>
                    <option value="5">보통 (5+)</option>
                    <option value="7">높음 (7+)</option>
                    <option value="8">매우 높음 (8+)</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setFilters({});
                      setSearchQuery('');
                      fetchArticles();
                    }}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all"
                  >
                    필터 초기화
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Latest Reports */}
        {reports.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">AI 분석 리포트</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reports.map(report => (
                <div key={report.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium">
                        {report.type === 'daily' ? '일일 리포트' : '주간 리포트'}
                      </span>
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    
                    <h3 className="font-bold text-lg mb-2">
                      {new Date(report.date).toLocaleDateString('ko-KR')}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {report.summary}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getSentimentColor(report.overallSentiment)}`}>
                        {report.marketTrend}
                      </div>
                      <span className="text-xs text-gray-500">
                        주요 이슈 {report.keyEvents.length}개
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* News Articles */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">최신 뉴스</h2>
            <span className="text-gray-500">총 {articles.length}개</span>
          </div>
          
          {articles.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">뉴스가 없습니다</h3>
              <p className="text-gray-500 mb-6">
                아직 분석된 뉴스가 없습니다. 테스트 데이터를 생성해보세요.
              </p>
              <button
                onClick={generateMockData}
                disabled={isGenerating}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl disabled:opacity-50"
              >
                {isGenerating ? '생성 중...' : '테스트 데이터 생성'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {articles.map(article => (
                <div key={article.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">
                          {getCategoryLabel(article.category)}
                        </span>
                        <span className="text-gray-500 text-sm">{article.source}</span>
                        <span className="text-gray-400 text-xs">
                          {new Date(article.publishedAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {article.title}
                      </h3>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getSentimentColor(article.sentimentScore)}`}>
                        {article.sentimentScore > 0 ? '+' : ''}{(article.sentimentScore * 100).toFixed(0)}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-orange-500 text-sm font-medium">★</span>
                        <span className="text-sm text-gray-600">{article.importanceScore}/10</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4">
                    {article.summary || article.content.substring(0, 200)}...
                  </p>
                  
                  {article.aiAnalysis && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">AI 분석</h4>
                      <p className="text-gray-600 text-sm">{article.aiAnalysis}</p>
                    </div>
                  )}
                  
                  {article.relatedSymbols.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {article.relatedSymbols.map(symbol => (
                        <span key={symbol} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {symbol}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}