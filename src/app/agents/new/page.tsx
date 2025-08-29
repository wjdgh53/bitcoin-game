'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Brain, 
  Sparkles,
  Shield,
  Zap,
  Activity,
  BarChart,
  Shuffle
} from 'lucide-react';

const PERSONALITY_OPTIONS = [
  { 
    value: 'conservative', 
    label: '보수적', 
    description: '안전과 안정성을 중시하는 신중한 투자자',
    icon: Shield,
    color: 'from-blue-500 to-blue-600'
  },
  { 
    value: 'aggressive', 
    label: '공격적', 
    description: '높은 수익을 추구하는 대담한 트레이더',
    icon: Zap,
    color: 'from-red-500 to-red-600'
  },
  { 
    value: 'balanced', 
    label: '균형적', 
    description: '리스크와 수익의 완벽한 균형 추구',
    icon: Activity,
    color: 'from-green-500 to-green-600'
  },
  { 
    value: 'quantitative', 
    label: '정량적', 
    description: '데이터와 수학적 분석 중심의 체계적 접근',
    icon: BarChart,
    color: 'from-purple-500 to-purple-600'
  },
  { 
    value: 'contrarian', 
    label: '역발상', 
    description: '시장과 반대로 행동하는 독창적 사고',
    icon: Shuffle,
    color: 'from-orange-500 to-orange-600'
  }
];

const STRATEGY_OPTIONS = [
  { category: '투자 철학', strategies: ['가치 투자', '성장주 투자', '배당주 투자', '모멘텀 투자'] },
  { category: '분석 방법', strategies: ['기술적 분석', '펀더멘털 분석', '센티먼트 분석', '정량적 분석'] },
  { category: '트레이딩 스타일', strategies: ['스캘핑', '데이 트레이딩', '스윙 트레이딩', '포지션 트레이딩'] },
  { category: '리스크 관리', strategies: ['분산 투자', 'DCA (분할매수)', '손절매 전략', '헤지 전략'] },
  { category: '시장 접근', strategies: ['추세 추종', '역추세 매매', '차익거래', '페어 트레이딩'] }
];

export default function NewAgentPage() {
  const router = useRouter();
  const [selectedPersonality, setSelectedPersonality] = useState('balanced');
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const handleStrategyToggle = (strategy: string) => {
    setSelectedStrategies(prev =>
      prev.includes(strategy)
        ? prev.filter(s => s !== strategy)
        : [...prev, strategy]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || selectedStrategies.length === 0) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          type: `${selectedPersonality}-agent-${Date.now()}`,
          personality: selectedPersonality,
          strategy: selectedStrategies,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/agents/${data.agent.id}`);
      } else {
        const error = await response.json();
        alert(error.message || '에이전트 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to create agent:', error);
      alert('에이전트 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPersonalityOption = PERSONALITY_OPTIONS.find(opt => opt.value === selectedPersonality);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/agents" 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-800" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">새 AI 에이전트 만들기</h1>
                <p className="text-sm text-gray-800">당신만의 투자 파트너를 디자인하세요</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-gray-800">AI 에이전트 생성</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Name Input */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <label className="block text-lg font-bold text-gray-900 mb-4">
                에이전트 이름
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-lg"
                placeholder="예: Warren Bot, 현명한 투자자"
                required
              />
            </div>

            {/* Personality Selection */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">투자 성향 선택</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {PERSONALITY_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedPersonality(option.value)}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        selectedPersonality === option.value
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${option.color} flex items-center justify-center mb-3`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1">{option.label}</h3>
                      <p className="text-xs text-gray-800">{option.description}</p>
                      {selectedPersonality === option.value && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Strategy Selection */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                투자 전략 선택
                <span className="ml-2 text-sm font-normal text-gray-800">
                  ({selectedStrategies.length}개 선택됨)
                </span>
              </h2>
              <div className="space-y-4">
                {STRATEGY_OPTIONS.map((category) => (
                  <div key={category.category}>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">{category.category}</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      {category.strategies.map((strategy) => (
                        <button
                          key={strategy}
                          type="button"
                          onClick={() => handleStrategyToggle(strategy)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedStrategies.includes(strategy)
                              ? 'bg-blue-500 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {strategy}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <label className="block text-lg font-bold text-gray-900 mb-4">
                에이전트 설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                rows={4}
                placeholder="이 에이전트의 특징과 투자 철학을 설명해주세요..."
                required
              />
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">미리보기</h3>
                
                {/* Preview Card */}
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${
                      selectedPersonalityOption?.color || 'from-gray-400 to-gray-500'
                    } flex items-center justify-center shadow-lg`}>
                      <Brain className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">
                        {formData.name || '에이전트 이름'}
                      </h4>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        selectedPersonalityOption
                          ? `bg-gradient-to-r ${selectedPersonalityOption.color} text-white`
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        {selectedPersonalityOption?.label || '성향 선택'}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-800 mb-4">
                    {formData.description || '에이전트 설명이 여기에 표시됩니다...'}
                  </p>

                  {selectedStrategies.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2">주요 전략</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedStrategies.slice(0, 5).map(strategy => (
                          <span key={strategy} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {strategy}
                          </span>
                        ))}
                        {selectedStrategies.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            +{selectedStrategies.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 space-y-3">
                  <button
                    type="submit"
                    disabled={loading || !formData.name || !formData.description || selectedStrategies.length === 0}
                    className={`w-full py-3 px-6 rounded-xl font-bold transition-all ${
                      loading || !formData.name || !formData.description || selectedStrategies.length === 0
                        ? 'bg-gray-200 text-gray-700 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {loading ? '생성 중...' : '에이전트 생성'}
                  </button>
                  
                  <Link 
                    href="/agents"
                    className="block w-full py-3 px-6 border-2 border-gray-200 rounded-xl text-center font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}