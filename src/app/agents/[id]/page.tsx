'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { generatePrompt, generatePromptSummary } from '@/lib/prompts/prompt-templates';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Activity, 
  TrendingUp, 
  Eye, 
  Edit3, 
  Plus,
  Star,
  AlertTriangle,
  Target,
  BarChart3,
  Clock,
  Zap,
  MessageCircle,
  Brain,
  Sparkles,
  Shield,
  FileText,
  Copy,
  Code,
  LineChart,
  History
} from 'lucide-react';
import TradingHistory from '@/components/trading/TradingHistory';
import PerformanceMetricsComponent from '@/components/trading/PerformanceMetrics';
import EnhancedPromptsViewer from '@/components/trading/EnhancedPromptsViewer';
import { generateMockTradingHistory, generateMockPerformanceMetrics, generateMockAgentPrompts } from '@/lib/utils/mock-trading-data';
import { TradingHistoryItem, PerformanceMetrics, AgentPrompt } from '@/types/trading';

interface Pattern {
  id: string;
  name: string;
  description: string;
  priority: number;
  confidenceRate: number;
  examples: string[];
  isActive: boolean;
  createdAt: string;
}

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  category: string;
  reason: string;
  agentView: string;
  alertPrice?: number;
  alertType?: string;
  addedAt: string;
  lastReviewedAt: string;
}

interface Agent {
  id: string;
  name: string;
  type: string;
  personality: string;
  strategy: string[];
  description: string;
  isActive: boolean;
  createdAt: string;
  patterns: Pattern[];
  watchlistItems: WatchlistItem[];
}

const PersonalityColors = {
  conservative: { 
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100', 
    border: 'border-blue-200', 
    text: 'text-blue-700', 
    accent: 'bg-gradient-to-r from-blue-500 to-blue-600',
    headerGradient: 'from-blue-500 to-blue-600'
  },
  aggressive: { 
    bg: 'bg-gradient-to-br from-red-50 to-red-100', 
    border: 'border-red-200', 
    text: 'text-red-700', 
    accent: 'bg-gradient-to-r from-red-500 to-red-600',
    headerGradient: 'from-red-500 to-red-600'
  },
  quantitative: { 
    bg: 'bg-gradient-to-br from-purple-50 to-purple-100', 
    border: 'border-purple-200', 
    text: 'text-purple-700', 
    accent: 'bg-gradient-to-r from-purple-500 to-purple-600',
    headerGradient: 'from-purple-500 to-purple-600'
  },
  balanced: { 
    bg: 'bg-gradient-to-br from-green-50 to-green-100', 
    border: 'border-green-200', 
    text: 'text-green-700', 
    accent: 'bg-gradient-to-r from-green-500 to-green-600',
    headerGradient: 'from-green-500 to-green-600'
  },
  contrarian: { 
    bg: 'bg-gradient-to-br from-orange-50 to-orange-100', 
    border: 'border-orange-200', 
    text: 'text-orange-700', 
    accent: 'bg-gradient-to-r from-orange-500 to-orange-600',
    headerGradient: 'from-orange-500 to-orange-600'
  },
};

const CategoryColors = {
  '장기투자': 'bg-blue-100 text-blue-800',
  '단기트레이딩': 'bg-red-100 text-red-800', 
  '모멘텀': 'bg-yellow-100 text-yellow-800',
  '가치투자': 'bg-green-100 text-green-800',
  '성장주': 'bg-purple-100 text-purple-800',
  '배당주': 'bg-indigo-100 text-indigo-800',
  '투기적투자': 'bg-orange-100 text-orange-800',
  '안전자산': 'bg-gray-100 text-gray-800',
  '대체투자': 'bg-pink-100 text-pink-800',
};

const getPriorityColor = (priority: number) => {
  if (priority <= 2) return 'text-red-600 bg-red-50';
  if (priority <= 4) return 'text-yellow-600 bg-yellow-50';
  return 'text-green-600 bg-green-50';
};

const getPriorityLabel = (priority: number) => {
  if (priority <= 2) return '높음';
  if (priority <= 4) return '보통';
  return '낮음';
};

const getPersonalityLabel = (personality: string) => {
  const labels: Record<string, string> = {
    'conservative': '보수적',
    'aggressive': '공격적',
    'balanced': '균형적',
    'quantitative': '정량적',
    'contrarian': '역발상'
  };
  return labels[personality] || personality;
};

export default function AgentProfilePage() {
  const params = useParams();
  const agentId = params.id as string;
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'trading' | 'performance' | 'patterns' | 'watchlist' | 'prompt' | 'enhanced-prompts'>('overview');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  
  // Generate mock data for new features
  const tradingHistory = useMemo(() => generateMockTradingHistory(100), []);
  const performanceMetrics = useMemo(() => generateMockPerformanceMetrics(tradingHistory), [tradingHistory]);
  const agentPrompts = useMemo(() => generateMockAgentPrompts(agentId), [agentId]);

  const fetchAgent = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/agents/${agentId}`);
      const data = await response.json();

      if (data.success) {
        setAgent(data.data);
      } else {
        setError(data.message || 'Failed to fetch agent');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
      console.error('Fetch agent error:', err);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchAgent();
  }, [agentId, fetchAgent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center bg-white rounded-3xl p-12 shadow-xl">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">에이전트 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center bg-white rounded-3xl p-12 shadow-xl max-w-md">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">에이전트를 찾을 수 없습니다</h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <Link 
              href="/agents" 
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              에이전트 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const colors = PersonalityColors[agent.personality as keyof typeof PersonalityColors];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className={`bg-gradient-to-r ${colors.headerGradient} relative overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)',
            backgroundSize: '30px 30px'
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <Link 
              href="/agents" 
              className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/chat"
                className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-white font-semibold transition-all backdrop-blur-sm flex items-center space-x-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>채팅하기</span>
              </Link>
              <button className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm">
                <Edit3 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
          
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                <Brain className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-4 mb-4">
                <h1 className="text-4xl font-bold text-white">{agent.name}</h1>
                <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  agent.isActive 
                    ? 'bg-green-400 text-green-900 shadow-lg' 
                    : 'bg-white/20 text-white/80'
                }`}>
                  {agent.isActive ? '✨ 활성' : '💤 비활성'}
                </div>
              </div>
              
              <div className="flex items-center space-x-6 mb-6">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-white/80" />
                  <span className="text-white/90 font-medium">
                    {getPersonalityLabel(agent.personality)}
                  </span>
                </div>
                <div className="text-white/70 text-sm">
                  생성일: {new Date(agent.createdAt).toLocaleDateString('ko-KR')}
                </div>
              </div>
              
              <p className="text-white/90 text-lg leading-relaxed">
                {agent.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'overview', name: '개요', icon: Activity },
              { id: 'trading', name: '거래 내역', icon: History },
              { id: 'performance', name: '성과 분석', icon: LineChart },
              { id: 'patterns', name: `패턴 (${agent.patterns.length})`, icon: TrendingUp },
              { id: 'watchlist', name: `관심종목 (${agent.watchlistItems.length})`, icon: Eye },
              { id: 'enhanced-prompts', name: '프롬프트 상세', icon: Code },
              { id: 'prompt', name: '프롬프트 미리보기', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-semibold text-sm flex items-center space-x-2 transition-all ${
                  activeTab === tab.id
                    ? `border-blue-500 text-blue-600`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                  </div>
                  <Sparkles className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {agent.patterns.filter(p => p.isActive).length}
                </div>
                <p className="text-gray-600">활성 패턴</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Eye className="w-8 h-8 text-green-600" />
                  </div>
                  <Sparkles className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {agent.watchlistItems.length}
                </div>
                <p className="text-gray-600">관심종목</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <BarChart3 className="w-8 h-8 text-purple-600" />
                  </div>
                  <Sparkles className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {agent.patterns.length > 0 
                    ? Math.round(agent.patterns.reduce((acc, p) => acc + p.confidenceRate, 0) / agent.patterns.length)
                    : 0
                  }%
                </div>
                <p className="text-gray-600">평균 신뢰도</p>
              </div>
            </div>

            {/* Strategy Overview */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">투자 전략</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {agent.strategy.map((strategy, index) => (
                  <div 
                    key={index}
                    className={`px-4 py-3 rounded-xl ${colors.bg} ${colors.text} font-medium text-center hover:shadow-md transition-shadow`}
                  >
                    {strategy}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Patterns Tab */}
        {activeTab === 'patterns' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">트레이딩 패턴</h2>
              <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl">
                <Plus className="w-5 h-5" />
                <span>새 패턴 추가</span>
              </button>
            </div>
            
            <div className="grid gap-6">
              {agent.patterns.map((pattern) => (
                <div key={pattern.id} className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">{pattern.name}</h3>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(pattern.priority)}`}>
                          {getPriorityLabel(pattern.priority)} 우선순위
                        </span>
                        {!pattern.isActive && (
                          <span className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full">
                            비활성
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-4 leading-relaxed">{pattern.description}</p>
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>신뢰도: {pattern.confidenceRate}%</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-blue-500" />
                          <span>우선순위: {pattern.priority}</span>
                        </div>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <Edit3 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {pattern.examples.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">패턴 예시</h4>
                      <ul className="space-y-2">
                        {pattern.examples.map((example, index) => (
                          <li key={index} className="text-gray-700 flex items-start">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
              
              {agent.patterns.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
                  <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">패턴이 없습니다</h3>
                  <p className="text-gray-600 mb-8">이 에이전트의 첫 번째 트레이딩 패턴을 추가해보세요.</p>
                  <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl">
                    패턴 추가하기
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">관심종목</h2>
              <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl">
                <Plus className="w-5 h-5" />
                <span>종목 추가</span>
              </button>
            </div>
            
            <div className="grid gap-6">
              {agent.watchlistItems.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">
                          {item.symbol} - {item.name}
                        </h3>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                          CategoryColors[item.category as keyof typeof CategoryColors] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.category}
                        </span>
                        {item.alertPrice && (
                          <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full flex items-center space-x-1">
                            <Zap className="w-3 h-3" />
                            <span>${item.alertPrice.toLocaleString()}</span>
                          </span>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div className="bg-blue-50 rounded-xl p-4">
                          <h4 className="font-semibold text-blue-900 mb-2">관심 이유</h4>
                          <p className="text-blue-800">{item.reason}</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4">
                          <h4 className="font-semibold text-green-900 mb-2">에이전트 견해</h4>
                          <p className="text-green-800">{item.agentView}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 mt-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>추가: {new Date(item.addedAt).toLocaleDateString('ko-KR')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Eye className="w-4 h-4" />
                          <span>검토: {new Date(item.lastReviewedAt).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <Edit3 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              
              {agent.watchlistItems.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
                  <Eye className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">관심종목이 없습니다</h3>
                  <p className="text-gray-600 mb-8">이 에이전트가 모니터링할 첫 번째 종목을 추가해보세요.</p>
                  <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl">
                    종목 추가하기
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prompt Tab */}
        {activeTab === 'prompt' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">프롬프트 미리보기</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    const fullPrompt = generatePrompt(agent);
                    navigator.clipboard.writeText(fullPrompt);
                    setCopiedPrompt(true);
                    setTimeout(() => setCopiedPrompt(false), 2000);
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                    copiedPrompt 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedPrompt ? '복사됨!' : '전체 복사'}</span>
                </button>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
              <div className="flex items-start space-x-4 mb-6">
                <div className="p-3 bg-blue-500 rounded-xl">
                  <Code className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">프롬프트 요약</h3>
                  <p className="text-gray-600">이 에이전트가 AI 모델에게 전달되는 핵심 지시사항입니다.</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="whitespace-pre-line text-gray-800 leading-relaxed">
                  {generatePromptSummary(agent)}
                </div>
              </div>
            </div>

            {/* Full Prompt Preview */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">전체 프롬프트 템플릿</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <FileText className="w-4 h-4" />
                    <span>AI 모델에게 전달되는 완전한 지시사항</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="bg-gray-900 rounded-xl p-6 overflow-auto max-h-96">
                  <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                    {generatePrompt(agent)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Template Structure Explanation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 text-yellow-500 mr-2" />
                  동적 변수
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <code className="text-sm font-mono text-blue-600">{'{{agentName}}'}</code>
                    <span className="text-sm text-gray-600">{agent.name}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <code className="text-sm font-mono text-blue-600">{'{{personality}}'}</code>
                    <span className="text-sm text-gray-600">{getPersonalityLabel(agent.personality)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <code className="text-sm font-mono text-blue-600">{'{{strategies}}'}</code>
                    <span className="text-sm text-gray-600">{agent.strategy.length}개 전략</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <code className="text-sm font-mono text-blue-600">{'{{patterns}}'}</code>
                    <span className="text-sm text-gray-600">{agent.patterns.length}개 패턴</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Shield className="w-5 h-5 text-green-500 mr-2" />
                  프롬프트 특징
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="font-semibold text-gray-900">성향 기반 분석</div>
                      <div className="text-sm text-gray-600">에이전트의 투자 성향에 맞는 분석 방식 적용</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="font-semibold text-gray-900">전략 맞춤화</div>
                      <div className="text-sm text-gray-600">선택된 투자 전략을 프롬프트에 자동 반영</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="font-semibold text-gray-900">패턴 활용</div>
                      <div className="text-sm text-gray-600">학습된 분석 패턴을 기반으로 일관성 있는 분석</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="font-semibold text-gray-900">실시간 컨텍스트</div>
                      <div className="text-sm text-gray-600">현재 시장 상황을 반영한 동적 분석</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Examples */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">활용 예시</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="font-semibold text-blue-900 mb-2">채팅에서 활용</div>
                  <div className="text-sm text-blue-800">사용자와의 대화에서 이 프롬프트가 기본 성격으로 작용합니다.</div>
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="font-semibold text-green-900 mb-2">분석 리포트</div>
                  <div className="text-sm text-green-800">시장 분석 리포트 생성 시 이 가이드라인을 따릅니다.</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="font-semibold text-purple-900 mb-2">API 통합</div>
                  <div className="text-sm text-purple-800">외부 AI 서비스 연동 시 이 프롬프트를 사용합니다.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trading History Tab */}
        {activeTab === 'trading' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">거래 내역</h2>
            </div>
            
            <TradingHistory 
              trades={tradingHistory}
              onExport={(format) => {
                // Export functionality
                const dataStr = format === 'json' 
                  ? JSON.stringify(tradingHistory, null, 2)
                  : convertToCSV(tradingHistory);
                const dataUri = `data:application/${format === 'json' ? 'json' : 'csv'};charset=utf-8,${encodeURIComponent(dataStr)}`;
                const exportFileDefaultName = `trading-history-${agentId}.${format}`;
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
              }}
            />
          </div>
        )}

        {/* Performance Metrics Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">성과 분석</h2>
            </div>
            
            <PerformanceMetricsComponent 
              metrics={performanceMetrics}
              onBenchmarkCompare={() => {
                // Benchmark comparison functionality
                console.log('Benchmark comparison requested');
              }}
            />
          </div>
        )}

        {/* Enhanced Prompts Tab */}
        {activeTab === 'enhanced-prompts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">프롬프트 상세 관리</h2>
            </div>
            
            <EnhancedPromptsViewer 
              prompts={agentPrompts}
              canEdit={true}
              onSuggestImprovement={(promptId, suggestion) => {
                console.log(`Improvement suggestion for ${promptId}: ${suggestion}`);
                // Handle improvement suggestion
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to convert JSON to CSV
function convertToCSV(data: TradingHistoryItem[]): string {
  if (data.length === 0) return '';
  
  const headers = ['Date', 'Symbol', 'Action', 'Quantity', 'Price', 'Total', 'P&L', 'Return %', 'Strategy'];
  const rows = data.map(trade => [
    new Date(trade.timestamp).toISOString(),
    trade.symbol,
    trade.action,
    trade.quantity,
    trade.price,
    trade.total,
    trade.result?.profitLoss || '',
    trade.result?.percentReturn || '',
    trade.strategyUsed
  ]);
  
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}