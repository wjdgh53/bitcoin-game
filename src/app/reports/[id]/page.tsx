'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, BarChart3, Calendar, User, Target, ArrowLeft, FileText } from 'lucide-react';
import { useParams } from 'next/navigation';

interface DetailedReport {
  id: string;
  agentName: string;
  agentType: string;
  timestamp: string;
  recommendation: string;
  confidence: number;
  title: string;
  executiveSummary: string;
  marketAnalysis: string;
  technicalAnalysis: string;
  riskAssessment: string;
  strategyRationale: string;
  nextSteps: string;
  currentPrice: number;
  priceChange24h: number;
  trend: string;
  momentum: number;
  support: number;
  resistance: number;
}

const agentInfo = {
  conservative: {
    name: "워렌 김",
    icon: "🛡️",
    color: "blue",
    description: "보수적 가치투자자",
    bg: "bg-blue-50 border-blue-200"
  },
  momentum: {
    name: "제시카 박", 
    icon: "⚡",
    color: "purple", 
    description: "모멘텀 트레이더",
    bg: "bg-purple-50 border-purple-200"
  },
  quantitative: {
    name: "알렉스 최",
    icon: "📊", 
    color: "green",
    description: "퀀트 분석가", 
    bg: "bg-green-50 border-green-200"
  }
};

export default function ReportDetailPage() {
  const params = useParams();
  const [report, setReport] = useState<DetailedReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/reports/${params.id}`);
        const result = await response.json();
        
        if (result.success) {
          setReport(result.data);
        }
      } catch (error) {
        console.error('Error fetching report:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-purple-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-800">리포트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">리포트를 찾을 수 없습니다</h2>
          <Link href="/reports" className="text-purple-600 hover:text-purple-700">
            리포트 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const agent = agentInfo[report.agentType as keyof typeof agentInfo];

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'buy': return 'text-green-600 bg-green-100 border-green-200';
      case 'sell': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-800 bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/reports" className="flex items-center text-gray-800 hover:text-gray-700 mr-4">
              <ArrowLeft className="h-5 w-5 mr-1" />
              리포트 목록
            </Link>
            <div className="flex items-center">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{report.title}</h1>
                <p className="text-sm text-gray-800">{report.agentName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Report Header Card */}
        <div className="bg-gray-50 border rounded-lg p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-800 mr-2" />
              <span className="font-bold text-lg">{report.agentName}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-bold ${getRecommendationColor(report.recommendation)}`}>
                {report.recommendation === 'buy' ? <TrendingUp className="h-5 w-5" /> : 
                 report.recommendation === 'sell' ? <TrendingDown className="h-5 w-5" /> : 
                 <BarChart3 className="h-5 w-5" />}
                {report.recommendation === 'buy' ? '매수 추천' : 
                 report.recommendation === 'sell' ? '매도 추천' : '홀드 추천'}
              </div>
              <div className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-gray-800" />
                <span className="font-bold">{report.confidence}%</span>
                <span className="text-sm text-gray-800">신뢰도</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="text-center">
              <p className="text-sm text-gray-800">분석 시점</p>
              <p className="font-bold">{new Date(report.timestamp).toLocaleString('ko-KR')}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-800">BTC 가격</p>
              <p className="font-bold">${report.currentPrice.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-800">24h 변동률</p>
              <p className={`font-bold ${report.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {report.priceChange24h >= 0 ? '+' : ''}{report.priceChange24h.toFixed(2)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-800">지지선</p>
              <p className="font-bold">${report.support.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-800">저항선</p>
              <p className="font-bold">${report.resistance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="space-y-8">
          {/* Executive Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-600" />
              핵심 요약
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed">{report.executiveSummary}</p>
          </div>

          {/* Market Analysis */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              시장 분석
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{report.marketAnalysis}</p>
            </div>
          </div>

          {/* Technical Analysis */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              기술적 분석
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{report.technicalAnalysis}</p>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2 text-red-600" />
              위험 평가
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{report.riskAssessment}</p>
            </div>
          </div>

          {/* Strategy Rationale */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-600" />
              전략적 근거
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{report.strategyRationale}</p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
              향후 계획
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{report.nextSteps}</p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link 
            href="/reports"
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            리포트 목록으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}