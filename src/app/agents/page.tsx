'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Brain, User, Target, BookOpen, Settings, X } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface Agent {
  id: string;
  name: string;
  type: string;
  personality: string;
  strategy: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const PERSONALITY_OPTIONS = [
  { value: 'conservative', label: '보수적', description: '안전과 안정성을 중시' },
  { value: 'aggressive', label: '공격적', description: '높은 수익을 추구' },
  { value: 'balanced', label: '균형적', description: '리스크와 수익의 균형' },
  { value: 'quantitative', label: '정량적', description: '데이터와 수학적 분석 중심' },
  { value: 'contrarian', label: '역발상', description: '시장과 반대로 행동' }
];

const STRATEGY_OPTIONS = [
  '가치 투자',
  '모멘텀 트레이딩',
  '기술적 분석',
  '펀더멘털 분석',
  '스캘핑',
  '스윙 트레이딩',
  '데이 트레이딩',
  '장기 보유',
  '단기 매매',
  '차익거래',
  '리스크 관리',
  '포트폴리오 다변화',
  'DCA (분할매수)',
  '매도 타이밍 중시',
  '매수 타이밍 중시'
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    personality: 'balanced',
    description: ''
  });

  const generateTypeFromName = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      const result = await response.json();
      if (result.success) {
        setAgents(result.data);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedStrategies.length === 0) {
      alert('최소 하나 이상의 전략을 선택해주세요.');
      return;
    }
    
    try {
      const type = editingAgent ? editingAgent.type : generateTypeFromName(formData.name);
      
      const requestData = {
        name: formData.name,
        type: type,
        personality: formData.personality,
        strategy: JSON.stringify(selectedStrategies), // Store as JSON string
        description: formData.description
      };
      
      const url = editingAgent ? `/api/agents/${editingAgent.id}` : '/api/agents';
      const method = editingAgent ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(editingAgent ? '에이전트가 수정되었습니다!' : '에이전트가 생성되었습니다!');
        fetchAgents();
        resetForm();
      } else {
        alert(`오류: ${result.message}`);
      }
    } catch (error) {
      console.error('Error saving agent:', error);
      alert('에이전트 저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 에이전트를 삭제하시겠습니까? (기존 리포트는 유지됩니다)')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/agents/${id}`, { method: 'DELETE' });
      const result = await response.json();
      
      if (result.success) {
        alert('에이전트가 삭제되었습니다!');
        fetchAgents();
      } else {
        alert(`오류: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      alert('에이전트 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      personality: agent.personality,
      description: agent.description
    });
    
    // Parse strategies from JSON string
    try {
      const strategies = JSON.parse(agent.strategy);
      setSelectedStrategies(Array.isArray(strategies) ? strategies : []);
    } catch {
      setSelectedStrategies([]);
    }
    
    setShowAddForm(true);
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingAgent(null);
    setFormData({
      name: '',
      personality: 'balanced',
      description: ''
    });
    setSelectedStrategies([]);
  };

  const toggleStrategy = (strategy: string) => {
    setSelectedStrategies(prev => 
      prev.includes(strategy) 
        ? prev.filter(s => s !== strategy)
        : [...prev, strategy]
    );
  };

  const getPersonalityLabel = (value: string) => {
    const option = PERSONALITY_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const parseStrategies = (strategyJson: string) => {
    try {
      const strategies = JSON.parse(strategyJson);
      return Array.isArray(strategies) ? strategies : [];
    } catch {
      // For backward compatibility with old data
      return strategyJson ? [strategyJson] : [];
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Settings className="h-12 w-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">에이전트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Agent Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            새 에이전트 추가
          </button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingAgent ? '에이전트 수정' : '새 에이전트 추가'}
              </h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  placeholder="예: 마이클 김"
                  required
                />
                {!editingAgent && formData.name && (
                  <p className="text-xs text-gray-500 mt-1">
                    자동 생성 ID: {generateTypeFromName(formData.name)}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">성격</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PERSONALITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, personality: option.value })}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        formData.personality === option.value
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전략 (복수 선택 가능)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {STRATEGY_OPTIONS.map((strategy) => (
                    <button
                      key={strategy}
                      type="button"
                      onClick={() => toggleStrategy(strategy)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedStrategies.includes(strategy)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {strategy}
                    </button>
                  ))}
                </div>
                {selectedStrategies.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    선택된 전략: {selectedStrategies.length}개
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                  placeholder="예: 단기 트레이딩 전문가"
                  required
                />
              </div>
              
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {editingAgent ? '수정' : '생성'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Agents List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => {
            const strategies = parseStrategies(agent.strategy);
            return (
              <div key={agent.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Brain className="h-8 w-8 text-purple-500 mr-3" />
                      <div>
                        <h3 className="font-bold text-gray-900">{agent.name}</h3>
                        <p className="text-sm text-gray-500">{agent.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(agent)}
                        className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">성격</span>
                      </div>
                      <div className="pl-6">
                        <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                          {getPersonalityLabel(agent.personality)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">전략</span>
                      </div>
                      <div className="pl-6 flex flex-wrap gap-1">
                        {strategies.length > 0 ? (
                          strategies.map((strategy: string, idx: number) => (
                            <span 
                              key={idx} 
                              className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {strategy}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">전략 없음</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>생성일: {new Date(agent.createdAt).toLocaleDateString('ko-KR')}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${agent.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {agent.isActive ? '활성' : '비활성'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {agents.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 에이전트가 없습니다</h3>
            <p className="text-gray-500 mb-4">새로운 AI 에이전트를 추가해서 분석을 시작해보세요.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              첫 에이전트 추가하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}