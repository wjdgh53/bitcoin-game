# Technical Indicators Analysis Feature Specification

## Overview
단일 기술분석 전용 AI 에이전트가 암호화폐 기술지표를 수집하고 분석하여 정리된 리포트를 제공하는 시스템입니다. 개별 투자 에이전트들은 이 분석 결과를 프롬프트 컨텍스트로 활용합니다.

## Core Features

### 1. 단일 기술분석 에이전트
- **자동 기술지표 수집**: 실시간 가격 데이터 기반 기술지표 계산 (RSI, MACD, 볼린저 밴드 등)
- **AI 종합 분석**: 모든 기술지표를 종합하여 트렌드와 매수/매도 신호 분석
- **시그널 리포트 생성**: 일일 기술적 분석 리포트 자동 생성
- **트렌드 분류**: 강세/약세/횡보 트렌드 자동 분류 및 신호 강도 평가

### 2. 독립된 기술지표 페이지
- **메인 기술지표 페이지**: 홈과 별도의 독립된 기술분석 전용 페이지
- **지표 대시보드**: 주요 기술지표와 AI 분석 결과 표시
- **종합 분석 차트**: 가격 차트 위 기술지표 오버레이 및 트렌드 시각화
- **시간대별 필터링**: 1시간, 4시간, 1일, 1주 차트별 분석 결과

### 3. 투자 에이전트 연동
- **프롬프트 컨텍스트**: 기술분석 결과가 모든 에이전트 프롬프트에 자동 포함
- **백그라운드 정보**: 개별 에이전트는 기술지표를 직접 계산하지 않고 컨텍스트로만 활용

## Data Models

### TechnicalIndicator
```typescript
interface TechnicalIndicator {
  id: string;
  timestamp: Date;
  symbol: string; // 'BTC'
  timeframe: string; // '1h', '4h', '1d', '1w'
  
  // 가격 데이터
  price: number;
  high: number;
  low: number;
  volume: number;
  
  // 이동평균선
  sma5: number;
  sma10: number;
  sma20: number;
  sma50: number;
  ema12: number;
  ema26: number;
  
  // 오실레이터
  rsi: number; // 0-100
  stochK: number; // 0-100
  stochD: number; // 0-100
  
  // MACD
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  
  // 볼린저 밴드
  bbUpper: number;
  bbMiddle: number;
  bbLower: number;
  bbWidth: number;
  
  // 지지/저항
  support: number;
  resistance: number;
  
  createdAt: Date;
}
```

### TechnicalReport (일일 기술분석 리포트)
```typescript
interface TechnicalReport {
  id: string;
  date: Date;
  symbol: string;
  timeframe: string;
  
  // 전체 분석
  overallTrend: 'bullish' | 'bearish' | 'neutral' | 'sideways';
  trendStrength: number; // 0-100
  confidence: number; // 0-100
  
  // 신호 분석
  buySignals: number;
  sellSignals: number;
  neutralSignals: number;
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  
  // 핵심 레벨
  keySupport: number;
  keyResistance: number;
  nextTarget: number;
  stopLoss: number;
  
  // AI 분석
  summary: string;
  aiInsights: string;
  riskAssessment: string;
  
  createdAt: Date;
}
```

## Technical Implementation

### Backend Components
1. **단일 기술분석 AI 에이전트**: 모든 기술지표 분석을 담당하는 전용 에이전트
2. **Technical Indicators Calculator**: 실시간 가격 데이터 기반 기술지표 계산 엔진
3. **AI Analysis Engine**: OpenAI를 활용한 기술적 분석 및 신호 해석
4. **Report Generator**: 일일 기술분석 리포트 자동 생성
5. **Context Injection Service**: 에이전트 프롬프트에 기술분석 컨텍스트 자동 삽입

### Frontend Components
1. **TechnicalIndicatorsPage**: 독립된 기술지표 메인 페이지 (`/technical-indicators`)
2. **IndicatorsDashboard**: 주요 기술지표 현황 대시보드
3. **TechnicalChart**: 가격 차트 + 기술지표 오버레이
4. **SignalPanel**: 매수/매도 신호 요약 패널
5. **TrendAnalysis**: 트렌드 분석 및 예측 차트
6. **ReportView**: 일일 기술분석 리포트 표시

## API Endpoints
- `GET /api/technical-indicators` - 기술지표 데이터 조회
- `GET /api/technical-indicators/reports` - 일일 분석 리포트 조회
- `GET /api/technical-indicators/signals` - 현재 매수/매도 신호
- `POST /api/technical-indicators/calculate` - 기술지표 계산 트리거 (자동)
- `GET /api/technical-indicators/context` - 에이전트 프롬프트용 기술분석 컨텍스트
- `POST /api/technical-indicators/mock` - 목 데이터 생성 (개발용)

## Mock Data Strategy
- **실제 계산 알고리즘**: RSI, MACD, 볼린저 밴드 등 표준 공식 사용
- **현실적 데이터**: 기존 비트코인 가격 시뮬레이션 데이터 기반 계산
- **다양한 시나리오**: 강세/약세/횡보 구간별 다른 신호 패턴
- **OpenBB/Yahoo Finance 스타일**: 실제 금융 플랫폼과 유사한 데이터 구조

## UI/UX Considerations
- 네비게이션 바에 "기술지표" 메뉴 추가
- 기존 디자인과 일관된 스타일 (차트 색상: 오렌지 계열)
- 기술지표를 직관적으로 시각화 (색상 코딩, 신호 아이콘)
- RSI 오버바잇/오버솔드 구간 색상 구분
- 모바일 반응형 디자인

## Integration Points
- Navbar에 기술지표 페이지 링크 추가
- 모든 에이전트 프롬프트에 기술분석 컨텍스트 자동 주입
- 기존 Agent 시스템과 독립적 운영
- 비트코인 가격 업데이트 시 기술지표도 자동 업데이트

## Success Metrics
- 기술지표 계산 정확도 (표준 공식 대비)
- 기술지표 페이지 방문율 및 체류시간
- AI 신호 정확도 (예측 vs 실제 가격 움직임)
- 에이전트 분석 품질 향상도 (기술분석 컨텍스트 활용 효과)