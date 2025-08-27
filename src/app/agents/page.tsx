'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Brain, Activity, MessageCircle, TrendingUp } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface Agent {
  id: string;
  name: string;
  type: string;
  personality: string;
  strategy: string[];
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  patterns?: Array<{
    id: string;
    name: string;
    priority: number;
    confidenceRate: number;
  }>;
  watchlistItems?: Array<{
    id: string;
    symbol: string;
    name: string;
    category: string;
  }>;
}

const getPersonalityColor = (personality: string) => {
  switch (personality) {
    case 'conservative': return 'from-blue-500 to-blue-600';
    case 'aggressive': return 'from-red-500 to-red-600';
    case 'balanced': return 'from-green-500 to-green-600';
    case 'quantitative': return 'from-purple-500 to-purple-600';
    case 'contrarian': return 'from-orange-500 to-orange-600';
    default: return 'from-gray-500 to-gray-600';
  }
};

const getPersonalityLabel = (personality: string) => {
  switch (personality) {
    case 'conservative': return '보수적';
    case 'aggressive': return '공격적';
    case 'balanced': return '균형적';
    case 'quantitative': return '정량적';
    case 'contrarian': return '역발상';
    default: return personality;
  }
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents?includeDetails=true');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched agents:', data); // 디버깅용
        setAgents(data.agents || []);
      } else {
        console.error('Failed to fetch agents - status:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-500 text-lg">AI 에이전트를 불러오는 중...</p>
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
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">AI 투자 에이전트</h1>
            <p className="text-gray-600 text-lg">다양한 성향의 AI 에이전트들이 투자 분석을 도와드립니다</p>
          </div>
          
          <Link
            href="/agents/new"
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="h-6 w-6" />
            <span className="font-semibold">새 에이전트 만들기</span>
          </Link>
        </div>

        {/* Agents Grid */}
        {agents.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md mx-auto">
              <Brain className="h-20 w-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">첫 번째 에이전트를 만들어보세요!</h3>
              <p className="text-gray-500 mb-8">AI 투자 파트너가 시장 분석과 투자 결정을 도와드립니다.</p>
              <Link
                href="/agents/new"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="h-5 w-5" />
                에이전트 만들기
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {agents.map((agent) => (
              <Link 
                key={agent.id} 
                href={`/agents/${agent.id}`}
                className="group block"
              >
                <div className="bg-white rounded-3xl shadow-lg overflow-hidden transition-all duration-300 group-hover:shadow-2xl group-hover:scale-105">
                  {/* Header with gradient */}
                  <div className={`bg-gradient-to-r ${getPersonalityColor(agent.personality)} p-6 text-white`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <Brain className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{agent.name}</h3>
                          <span className="text-white/80 text-sm">{getPersonalityLabel(agent.personality)}</span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        agent.isActive 
                          ? 'bg-green-400 text-green-900' 
                          : 'bg-white/20 text-white/80'
                      }`}>
                        {agent.isActive ? '활성' : '비활성'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <p className="text-gray-600 text-sm mb-6 line-clamp-3">{agent.description}</p>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <TrendingUp className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                        <div className="text-lg font-bold text-gray-900">{agent.patterns?.length || 0}</div>
                        <div className="text-xs text-gray-500">패턴</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <Activity className="h-5 w-5 text-green-500 mx-auto mb-1" />
                        <div className="text-lg font-bold text-gray-900">{agent.watchlistItems?.length || 0}</div>
                        <div className="text-xs text-gray-500">관심종목</div>
                      </div>
                    </div>
                    
                    {/* Strategies */}
                    {Array.isArray(agent.strategy) && agent.strategy.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-700 mb-2">주요 전략</p>
                        <div className="flex flex-wrap gap-1">
                          {agent.strategy.slice(0, 3).map((strategy, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs">
                              {strategy}
                            </span>
                          ))}
                          {agent.strategy.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs">
                              +{agent.strategy.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        생성일: {new Date(agent.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-blue-500 font-medium">대화하기</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {/* Statistics Summary */}
        {agents.length > 0 && (
          <div className="mt-16 bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">에이전트 현황</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500 mb-2">{agents.length}</div>
                <div className="text-gray-600">총 에이전트</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">
                  {agents.filter(a => a.isActive).length}
                </div>
                <div className="text-gray-600">활성 에이전트</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500 mb-2">
                  {agents.reduce((sum, a) => sum + (a.patterns?.length || 0), 0)}
                </div>
                <div className="text-gray-600">총 패턴</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500 mb-2">
                  {agents.reduce((sum, a) => sum + (a.watchlistItems?.length || 0), 0)}
                </div>
                <div className="text-gray-600">관심종목</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}