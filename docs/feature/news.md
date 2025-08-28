# News Analysis Feature Specification

## Overview
단일 뉴스 전용 AI 에이전트가 암호화폐 관련 뉴스를 수집하고 분석하여 정리된 리포트를 제공하는 시스템입니다. 개별 투자 에이전트들은 이 분석 결과를 프롬프트 컨텍스트로 활용합니다.

## Core Features

### 1. 단일 뉴스 분석 에이전트
- **자동 뉴스 수집**: 주요 암호화폐 뉴스 소스에서 실시간 뉴스 수집
- **AI 종합 분석**: 모든 뉴스를 분석하여 시장 영향도와 감정 점수 산출
- **요약 리포트 생성**: 일일/주간 뉴스 요약 리포트 자동 생성
- **카테고리 분류**: 뉴스를 기술적, 규제, 시장, 기업 뉴스로 자동 분류

### 2. 독립된 뉴스 페이지
- **메인 뉴스 페이지**: 홈과 별도의 독립된 뉴스 전용 페이지
- **뉴스 리스트**: 최신 뉴스와 AI 분석 결과 표시
- **종합 분석 대시보드**: 시장 전체 감정 지수와 트렌드 차트
- **검색 및 필터링**: 날짜, 카테고리, 중요도별 뉴스 필터링

### 3. 투자 에이전트 연동
- **프롬프트 컨텍스트**: 뉴스 분석 결과가 모든 에이전트 프롬프트에 자동 포함
- **백그라운드 정보**: 개별 에이전트는 뉴스를 직접 분석하지 않고 컨텍스트로만 활용

## Data Models

### NewsArticle
```typescript
interface NewsArticle {
  id: string;
  title: string;
  content: string;
  source: string;
  publishedAt: Date;
  sentimentScore: number; // -1 to 1
  importanceScore: number; // 1 to 10
  category: 'technical' | 'regulatory' | 'market' | 'corporate';
  relatedSymbols: string[];
  summary: string;
  aiAnalysis: string;
}
```

### NewsReport (일일/주간 요약 리포트)
```typescript
interface NewsReport {
  id: string;
  type: 'daily' | 'weekly';
  date: Date;
  overallSentiment: number; // -1 to 1
  marketTrend: 'bullish' | 'bearish' | 'neutral';
  keyEvents: string[];
  summary: string;
  topStories: NewsArticle[];
  createdAt: Date;
}
```

## Technical Implementation

### Backend Components
1. **단일 뉴스 AI 에이전트**: 모든 뉴스 분석을 담당하는 전용 에이전트
2. **News Crawler Service**: 외부 뉴스 API 연동 (RSS, 뉴스 API)
3. **AI Analysis Engine**: OpenAI를 활용한 감정/중요도 분석
4. **Report Generator**: 일일/주간 종합 리포트 자동 생성
5. **Context Injection Service**: 에이전트 프롬프트에 뉴스 컨텍스트 자동 삽입

### Frontend Components
1. **NewsPage**: 독립된 뉴스 메인 페이지 (`/news`)
2. **NewsListView**: 뉴스 목록과 필터링 UI
3. **MarketSentimentChart**: 시장 감정 지수 시각화
4. **NewsDetailModal**: 뉴스 상세 보기 및 AI 분석
5. **NewsReportView**: 일일/주간 요약 리포트 표시

## API Endpoints
- `GET /api/news` - 뉴스 목록 조회
- `GET /api/news/reports` - 일일/주간 리포트 조회
- `GET /api/news/sentiment` - 현재 시장 감정 지수
- `POST /api/news/analyze` - 뉴스 분석 트리거 (관리자용)
- `GET /api/news/context` - 에이전트 프롬프트용 뉴스 컨텍스트

## UI/UX Considerations
- 네비게이션 바에 "뉴스" 메뉴 추가
- 기존 디자인과 일관된 스타일
- 뉴스 카드 형태의 직관적인 레이아웃
- 감정 지수를 색상으로 시각화
- 모바일 반응형 디자인

## Integration Points
- Navbar에 뉴스 페이지 링크 추가
- 모든 에이전트 프롬프트에 뉴스 컨텍스트 자동 주입
- 기존 Agent 시스템과 독립적 운영

## Success Metrics
- 뉴스 분석 정확도 (감정 점수 vs 실제 시장 반응)
- 뉴스 페이지 방문율 및 체류시간
- 에이전트 분석 품질 향상도 (뉴스 컨텍스트 활용 효과)