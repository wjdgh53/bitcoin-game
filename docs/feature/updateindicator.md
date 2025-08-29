🎯 프로젝트 개요
바이낸스 웹소켓으로 비트코인(BTC/USDT)만 추적하는 심플한 실시간 기술지표 대시보드

📊 수집할 데이터

바이낸스 Ticker Stream: btcusdt@ticker
바이낸스 Kline Stream: btcusdt@kline_1m (1분봉)


🔢 저장할 기술지표 (5개)

SMA 20일 - 단순이동평균선
RSI 14일 - 상대강도지수
MACD - 이동평균수렴확산
Bollinger Bands Upper/Lower - 볼린저 밴드 상/하단
24h Volume - 24시간 거래량


🗄️ 데이터베이스 (단일 테이블)
btc_data 테이블
sqlCREATE TABLE btc_data (
  id SERIAL PRIMARY KEY,
  ticker VARCHAR(10) DEFAULT 'BTC',
  timestamp TIMESTAMPTZ NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  sma_20 DECIMAL(12,2),
  rsi_14 DECIMAL(5,2),
  macd DECIMAL(8,4),
  bb_upper DECIMAL(12,2),
  bb_lower DECIMAL(12,2),
  volume_24h DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

🏗️ 기술 스택
프론트엔드

Next.js 14
TypeScript
Tailwind CSS
TradingView Lightweight Charts
WebSocket 연결

백엔드

Node.js + Express
WebSocket (ws 라이브러리)
기술지표 계산 함수들



📱 페이지 구성
메인 대시보드 내용

현재 비트코인 가격 (큰 숫자로)
24시간 변화율 (% 및 달러)
5개 기술지표 현재값
간단한 매수/매도/중립 신호
실시간 가격 차트

히스토리 페이지 내용

과거 데이터 테이블 (페이지네이션)
날짜별 기술지표 값들
간단한 필터링 (최근 24시간, 7일, 30일)


🔄 데이터 처리 플로우

바이낸스 웹소켓 → 실시간 BTC 데이터 수신
기술지표 계산 → 5개 지표 실시간 계산
데이터베이스 저장 → 1분마다 단일 테이블에 저장
프론트엔드 전송 → WebSocket으로 실시간 업데이트
히스토리 조회 → 과거 데이터 REST API로 조회


📈 개발 단계
1단계 (2주)

바이낸스 웹소켓 연결
기본 데이터 수집 및 DB 저장
5개 기술지표 계산 함수

2단계 (2주)

간단한 대시보드 UI
실시간 데이터 표시
기본 차트 연동

3단계 (1주)

히스토리 페이지
간단한 필터링
기본 테스팅


💰 예상 비용

무료 티어만 사용: $0/월
확장시: ~$5-10/월


🎯 핵심 목표

비트코인 기술지표를 실시간으로 확인
히스토리 데이터 축적 및 조회
심플한 UI로 초보자도 쉽게 이해
무료로 테스트 및 학습용도