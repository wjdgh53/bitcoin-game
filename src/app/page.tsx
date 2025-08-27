'use client';

import Link from 'next/link';
import { TrendingUp, Trophy, BookOpen, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold">₿</span>
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            Bitcoin Trading Game
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            ChromaDB로 구동되는 실전 비트코인 트레이딩 시뮬레이터. 
            실시간 데이터와 AI 분석으로 트레이딩 스킬을 마스터하세요!
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link 
              href="/dashboard"
              className="px-8 py-4 bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold text-lg transition-colors flex items-center gap-2"
            >
              <Zap className="h-5 w-5" />
              게임 시작하기
            </Link>
            <Link 
              href="/reports"
              className="px-8 py-4 border-2 border-orange-500 hover:bg-orange-500/10 rounded-lg font-semibold text-lg transition-colors flex items-center gap-2"
            >
              <BookOpen className="h-5 w-5" />
              AI 리포트 보기
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">실시간 트레이딩</h3>
            <p className="text-gray-300">
              실제 비트코인 가격 데이터로 실시간 매매를 체험하고 포트폴리오를 관리하세요
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">성취 시스템</h3>
            <p className="text-gray-300">
              트레이딩 목표를 달성하고 레벨을 올리며 다양한 뱃지를 수집하세요
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3">AI 교육 콘텐츠</h3>
            <p className="text-gray-300">
              ChromaDB 시맨틱 검색으로 개인화된 트레이딩 교육 자료를 제공받으세요
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold mb-8">게임 통계</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-3xl font-bold text-orange-400 mb-2">실시간</div>
              <div className="text-gray-300">비트코인 가격 데이터</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400 mb-2">5개</div>
              <div className="text-gray-300">ChromaDB 컬렉션</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-400 mb-2">무제한</div>
              <div className="text-gray-300">트레이딩 기회</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-2">AI 기반</div>
              <div className="text-gray-300">시맨틱 검색</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold mb-4">지금 바로 시작하세요!</h2>
          <p className="text-gray-300 mb-8">
            가상 자금 $10,000으로 시작해서 비트코인 트레이딩 전문가가 되어보세요
          </p>
          <Link 
            href="/dashboard"
            className="inline-block px-12 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 rounded-lg font-bold text-xl transition-all transform hover:scale-105"
          >
            무료로 플레이하기
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}
