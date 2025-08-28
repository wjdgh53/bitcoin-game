'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, BarChart3, Calendar, User, Target, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface Report {
  id: string;
  agentName: string;
  agentType: string;
  timestamp: string;
  recommendation: string;
  confidence: number;
  title: string;
  currentPrice: number;
  priceChange24h: number;
  trend: string;
}

interface Agent {
  id: string;
  name: string;
  type: string;
  personality: string;
  strategy: string;
  description: string;
  isActive: boolean;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      const result = await response.json();
      
      if (result.success) {
        setAgents(result.data);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const url = selectedAgent === 'all' ? '/api/reports' : `/api/reports?agent=${selectedAgent}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setReports(result.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (agentType: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentType }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ ${result.data.agentName}의 분석 리포트가 생성되었습니다!`);
        fetchReports();
      } else {
        alert(`❌ 리포트 생성 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('리포트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [selectedAgent]);

  const getPersonalityIcon = (personality: string) => {
    switch (personality) {
      case 'conservative':
      case '신중하고 보수적인 가치투자자':
        return "🛡️";
      case 'aggressive':
      case '적극적이고 빠른 결정을 내리는 모멘텀 트레이더':
        return "⚡";
      case 'quantitative':
      case '데이터와 수학적 모델을 기반으로 하는 분석가':
        return "📊";
      case 'balanced':
        return "⚖️";
      case 'contrarian':
        return "🔄";
      default:
        return "🤖";
    }
  };

  const getPersonalityColor = (personality: string) => {
    switch (personality) {
      case 'conservative':
      case '신중하고 보수적인 가치투자자':
        return "blue";
      case 'aggressive':
      case '적극적이고 빠른 결정을 내리는 모멘텀 트레이더':
        return "red";
      case 'quantitative':
      case '데이터와 수학적 모델을 기반으로 하는 분석가':
        return "green";
      case 'balanced':
        return "purple";
      case 'contrarian':
        return "orange";
      default:
        return "gray";
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'buy': return 'text-green-600 bg-green-100';
      case 'sell': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'buy': return <TrendingUp className="h-4 w-4" />;
      case 'sell': return <TrendingDown className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 text-purple-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">AI 분석 리포트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Agents & Generate Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {agents && agents.map((agent) => {
            const color = getPersonalityColor(agent.personality);
            return (
              <div key={agent.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <div className="text-2xl mr-3">
                    {getPersonalityIcon(agent.personality)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{agent.name}</h3>
                    <p className="text-sm text-gray-500">{agent.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => generateReport(agent.type)}
                  disabled={isGenerating}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors ${
                    color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                    color === 'red' ? 'bg-red-600 hover:bg-red-700' :
                    color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                    color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                    color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' :
                    'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  <Brain className="h-4 w-4" />
                  {isGenerating ? '분석중...' : '분석 시작'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Filter Dropdown */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">에이전트 필터:</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
            >
              <option value="all">전체 에이전트</option>
              {agents && agents.map((agent) => (
                <option key={agent.id} value={agent.type}>
                  {getPersonalityIcon(agent.personality)} {agent.name}
                </option>
              ))}
            </select>
            <div className="text-sm text-gray-500">
              {selectedAgent === 'all' 
                ? `전체 ${reports.length}개 리포트` 
                : `${agents.find(a => a.type === selectedAgent)?.name || ''} ${reports.length}개 리포트`
              }
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-6">
          {reports.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">분석 리포트가 없습니다</h3>
              <p className="text-gray-500">위의 AI 에이전트 버튼을 눌러 새로운 분석을 시작하세요.</p>
            </div>
          ) : (
            reports.map((report) => {
              const agent = agents?.find(a => a.type === report.agentType);
              return (
                <div key={report.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        {agent && (
                          <div className="text-2xl mr-3">
                            {getPersonalityIcon(agent.personality)}
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{report.title}</h3>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <User className="h-4 w-4 mr-1" />
                            {report.agentName} {agent && `(${agent.description})`}
                            <Calendar className="h-4 w-4 ml-3 mr-1" />
                            {new Date(report.timestamp).toLocaleString('ko-KR')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getRecommendationColor(report.recommendation)}`}>
                          {getRecommendationIcon(report.recommendation)}
                          {report.recommendation === 'buy' ? '매수' : report.recommendation === 'sell' ? '매도' : '홀드'}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Target className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{report.confidence}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500">분석 시점 가격</p>
                        <p className="font-bold">${report.currentPrice.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">24h 변동률</p>
                        <p className={`font-bold ${report.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {report.priceChange24h >= 0 ? '+' : ''}{report.priceChange24h.toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">트렌드</p>
                        <p className="font-bold capitalize">{report.trend}</p>
                      </div>
                      <div className="flex justify-end">
                        <Link 
                          href={`/reports/${report.id}`}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          상세보기
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}