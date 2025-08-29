'use client';

import React, { useState } from 'react';
import { AgentPrompt, PromptCategory } from '@/types/trading';
import {
  Code,
  FileText,
  History,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Edit3,
  Save,
  X,
  Sparkles,
  Brain,
  Shield,
  TrendingUp,
  AlertTriangle,
  Settings,
  Clock,
  User,
} from 'lucide-react';

interface EnhancedPromptsViewerProps {
  prompts: AgentPrompt[];
  onSuggestImprovement?: (promptId: string, suggestion: string) => void;
  canEdit?: boolean;
}

const categoryIcons: Record<PromptCategory, React.ElementType> = {
  personality: Brain,
  strategy: TrendingUp,
  analysis: FileText,
  risk_management: Shield,
  market_interpretation: Settings,
  decision_making: AlertTriangle,
};

const categoryLabels: Record<PromptCategory, string> = {
  personality: '성격 정의',
  strategy: '투자 전략',
  analysis: '분석 방법',
  risk_management: '리스크 관리',
  market_interpretation: '시장 해석',
  decision_making: '의사 결정',
};

const categoryColors: Record<PromptCategory, { bg: string; text: string; border: string }> = {
  personality: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  strategy: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  analysis: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  risk_management: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  market_interpretation: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  decision_making: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
};

export default function EnhancedPromptsViewer({
  prompts,
  onSuggestImprovement,
  canEdit = false,
}: EnhancedPromptsViewerProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<PromptCategory>>(
    new Set(['personality', 'strategy'])
  );
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [suggestionText, setSuggestionText] = useState('');
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);

  // Group prompts by category
  const promptsByCategory = prompts.reduce((acc, prompt) => {
    if (!acc[prompt.category]) {
      acc[prompt.category] = [];
    }
    acc[prompt.category].push(prompt);
    return acc;
  }, {} as Record<PromptCategory, AgentPrompt[]>);

  const toggleCategory = (category: PromptCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const copyPrompt = (promptId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedPrompt(promptId);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  const handleSuggestImprovement = () => {
    if (selectedPrompt && suggestionText.trim()) {
      onSuggestImprovement?.(selectedPrompt, suggestionText);
      setShowSuggestionModal(false);
      setSuggestionText('');
      setSelectedPrompt(null);
    }
  };

  const formatPromptContent = (content: string) => {
    // Add syntax highlighting for variables
    return content
      .replace(/{{(\w+)}}/g, '<span class="text-blue-600 font-bold">{{$1}}</span>')
      .replace(/\[([^\]]+)\]/g, '<span class="text-green-600">[</span><span class="text-green-700">$1</span><span class="text-green-600">]</span>')
      .replace(/\*([^*]+)\*/g, '<span class="font-bold">$1</span>');
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(promptsByCategory).map(([category, categoryPrompts]) => {
          const Icon = categoryIcons[category as PromptCategory];
          const colors = categoryColors[category as PromptCategory];
          
          return (
            <div
              key={category}
              className={`${colors.bg} ${colors.border} border rounded-xl p-4 text-center hover:shadow-md transition-shadow cursor-pointer`}
              onClick={() => toggleCategory(category as PromptCategory)}
            >
              <Icon className={`w-8 h-8 ${colors.text} mx-auto mb-2`} />
              <div className={`text-sm font-bold ${colors.text}`}>
                {categoryLabels[category as PromptCategory]}
              </div>
              <div className="text-xs text-gray-800 mt-1">
                {categoryPrompts.length}개 프롬프트
              </div>
            </div>
          );
        })}
      </div>

      {/* Prompts by Category */}
      <div className="space-y-4">
        {Object.entries(promptsByCategory).map(([category, categoryPrompts]) => {
          const Icon = categoryIcons[category as PromptCategory];
          const colors = categoryColors[category as PromptCategory];
          const isExpanded = expandedCategories.has(category as PromptCategory);
          
          return (
            <div key={category} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category as PromptCategory)}
                className={`w-full px-6 py-4 ${colors.bg} ${colors.border} border-b flex items-center justify-between hover:bg-opacity-80 transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                  <h3 className={`text-lg font-bold ${colors.text}`}>
                    {categoryLabels[category as PromptCategory]}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                    {categoryPrompts.filter(p => p.isActive).length} / {categoryPrompts.length}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-800" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-800" />
                )}
              </button>

              {/* Category Prompts */}
              {isExpanded && (
                <div className="p-6 space-y-4">
                  {categoryPrompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      className={`border rounded-xl p-5 ${
                        prompt.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      {/* Prompt Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                              prompt.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {prompt.isActive ? '활성' : '비활성'}
                            </span>
                            <span className="text-sm text-gray-800">
                              버전 {prompt.version}
                            </span>
                            {prompt.previousVersions.length > 0 && (
                              <button
                                onClick={() => setShowHistory(showHistory === prompt.id ? null : prompt.id)}
                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                              >
                                <History className="w-3 h-3" />
                                이전 버전 ({prompt.previousVersions.length})
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-800">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              생성: {new Date(prompt.createdAt).toLocaleDateString('ko-KR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Edit3 className="w-3 h-3" />
                              수정: {new Date(prompt.updatedAt).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyPrompt(prompt.id, prompt.content)}
                            className={`p-2 rounded-lg transition-colors ${
                              copiedPrompt === prompt.id
                                ? 'bg-green-100 text-green-600'
                                : 'hover:bg-gray-100 text-gray-800'
                            }`}
                            title="프롬프트 복사"
                          >
                            {copiedPrompt === prompt.id ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          
                          {canEdit && onSuggestImprovement && (
                            <button
                              onClick={() => {
                                setSelectedPrompt(prompt.id);
                                setShowSuggestionModal(true);
                              }}
                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-800 transition-colors"
                              title="개선 제안"
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Prompt Content */}
                      <div className="bg-gray-900 rounded-xl p-4 overflow-auto max-h-64">
                        <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                          <code dangerouslySetInnerHTML={{ __html: formatPromptContent(prompt.content) }} />
                        </pre>
                      </div>

                      {/* Version History */}
                      {showHistory === prompt.id && prompt.previousVersions.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h4 className="text-sm font-bold text-gray-700 mb-2">버전 히스토리</h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {prompt.previousVersions.map((version, index) => (
                              <div
                                key={index}
                                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-bold text-gray-800">
                                    버전 {version.version}
                                  </span>
                                  <span className="text-xs text-gray-800">
                                    {new Date(version.timestamp).toLocaleDateString('ko-KR')}
                                  </span>
                                </div>
                                {version.changeReason && (
                                  <p className="text-xs text-gray-800 mb-2">
                                    변경 사유: {version.changeReason}
                                  </p>
                                )}
                                <div className="bg-gray-800 rounded p-2 overflow-auto max-h-32">
                                  <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">
                                    {version.content}
                                  </pre>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Suggestion Modal */}
      {showSuggestionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">프롬프트 개선 제안</h3>
              <button
                onClick={() => {
                  setShowSuggestionModal(false);
                  setSuggestionText('');
                  setSelectedPrompt(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-800" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                개선 제안 내용
              </label>
              <textarea
                value={suggestionText}
                onChange={(e) => setSuggestionText(e.target.value)}
                placeholder="프롬프트를 어떻게 개선하면 좋을지 설명해주세요..."
                className="w-full h-32 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSuggestionModal(false);
                  setSuggestionText('');
                  setSelectedPrompt(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSuggestImprovement}
                disabled={!suggestionText.trim()}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                제안 제출
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}