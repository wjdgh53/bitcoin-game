# Binance WebSocket Service Documentation

## Overview

바이낸스 실시간 데이터 수집을 위한 웹소켓 서비스입니다. BTC/USDT 실시간 가격 데이터를 수집하고 5개 핵심 기술지표를 계산하여 매매 신호를 생성합니다.

## Features

### ✅ 구현 완료
- **실시간 데이터 수집**: 바이낸스 웹소켓을 통한 BTC/USDT 실시간 데이터
- **5개 기술지표 계산**:
  - SMA 20일 (Simple Moving Average)
  - RSI 14일 (Relative Strength Index)
  - MACD (Moving Average Convergence Divergence)
  - Bollinger Bands (Upper/Lower)
  - 24시간 거래량
- **자동 재연결**: 연결 실패 시 자동 재연결 로직
- **데모 모드**: 실제 연결 실패 시 시뮬레이션 데이터 제공
- **매매 신호 생성**: 기술지표 기반 BUY/SELL/NEUTRAL 신호
- **에러 처리**: 포괄적인 에러 처리 및 로깅

## Architecture

```
📁 src/lib/
├── services/
│   ├── binance-websocket-service.ts      # 핵심 웹소켓 서비스
│   └── binance-websocket-usage-example.ts # 사용법 예제
└── utils/
    └── binance-indicators.ts             # 바이낸스 특화 지표 계산
```

## Quick Start

### 1. 기본 사용법

```typescript
import { binanceWebSocketService } from '@/lib/services/binance-websocket-service';

// 서비스 시작
await binanceWebSocketService.start();

// 실시간 데이터 수신
binanceWebSocketService.on('data', (data) => {
  console.log(`Price: $${data.ticker.price}`);
  console.log(`Signal: ${data.signals?.signal}`);
});

// 서비스 중지
binanceWebSocketService.stop();
```

### 2. 고급 사용법

```typescript
import { BinanceDataManager } from '@/lib/services/binance-websocket-usage-example';

class MyTradingApp extends BinanceDataManager {
  protected onDataUpdate(data) {
    // 실시간 데이터 처리 로직
    if (data.signals?.signal === 'BUY' && data.signals.strength > 80) {
      this.executeBuyOrder(data.ticker.price);
    }
  }
}

const app = new MyTradingApp();
await app.initialize();
```

## API Reference

### BinanceWebSocketService

#### Methods
- `start()`: 웹소켓 연결 시작
- `stop()`: 웹소켓 연결 중지
- `getStatus()`: 현재 연결 상태 조회
- `getLatestIndicators()`: 최신 기술지표 조회
- `getLatestSignals()`: 최신 매매 신호 조회
- `reconnect()`: 강제 재연결
- `isDemoMode()`: 데모 모드 여부 확인

#### Events
- `'connected'`: 연결 성공
- `'disconnected'`: 연결 해제
- `'error'`: 에러 발생
- `'data'`: 실시간 데이터 (ticker + indicators + signals)
- `'ticker'`: 티커 데이터만
- `'kline'`: 캔들 데이터만

### Data Types

```typescript
interface BinanceRealtimeData {
  ticker: BinanceTickerData;           // 가격 정보
  indicators: BinanceTechnicalIndicators | null; // 기술지표
  signals: {                           // 매매 신호
    signal: 'BUY' | 'SELL' | 'NEUTRAL';
    strength: number; // 0-100
    reasons: string[];
  } | null;
  timestamp: number;
}

interface BinanceTickerData {
  symbol: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  high24h: number;
  low24h: number;
  volume: number;
  timestamp: number;
}

interface BinanceTechnicalIndicators {
  price: number;
  high24h: number;
  low24h: number;
  volume: number;
  sma20?: number;        // 20일 단순이동평균
  rsi14?: number;        // 14일 RSI
  macd?: number;         // MACD 라인
  macdSignal?: number;   // MACD 신호선
  macdHistogram?: number; // MACD 히스토그램
  bbUpper?: number;      // 볼린저 밴드 상단
  bbMiddle?: number;     // 볼린저 밴드 중단
  bbLower?: number;      // 볼린저 밴드 하단
  priceChange?: number;
  priceChangePercent?: number;
  timestamp: number;
}
```

## Testing

### 테스트 명령어

```bash
# 전체 기능 테스트 (2분 실행)
npm run test-binance

# 간단한 데모 테스트 (10회 업데이트 후 종료)
npm run test-binance-demo
```

### 테스트 출력 예시

```
📊 Update #1:
   💰 Price: $75354.02 (-2.62%)
   📈 24h: $73767.04 - $76037.28
   📊 Volume: 32.5K BTC
   🔢 SMA20: $77013.02
   📐 RSI14: 40.5
   🌊 MACD: -2119.36
   🎯 Signal: SELL (100%)
   💡 Main reason: Price below SMA20 (77013.02)
```

## Technical Details

### Connection Strategy
1. **Multi-endpoint Fallback**: 3개의 바이낸스 엔드포인트 시도
2. **Auto-reconnect**: 연결 실패 시 지수 백오프로 재연결
3. **Health Check**: 30초마다 연결 상태 확인
4. **Demo Mode**: 모든 엔드포인트 실패 시 시뮬레이션 모드

### Technical Indicators
- **SMA 20**: 20일 단순이동평균
- **RSI 14**: 14일 상대강도지수 (30 이하 과매도, 70 이상 과매수)
- **MACD**: 12일/26일 EMA 기반, 9일 신호선
- **Bollinger Bands**: 20일 SMA ± 2 표준편차
- **Volume**: 24시간 거래량

### Signal Generation
매매 신호는 다음 규칙으로 생성됩니다:

```typescript
// BUY 신호 조건 (60% 이상 신호 일치 시)
- Price > SMA20
- RSI < 30 (과매도) 또는 RSI > 50
- MACD > Signal Line
- Price < Bollinger Lower Band (과매도)
- Positive momentum

// SELL 신호 조건 (60% 이상 신호 일치 시)
- Price < SMA20
- RSI > 70 (과매수) 또는 RSI < 50
- MACD < Signal Line  
- Price > Bollinger Upper Band (과매수)
- Negative momentum
```

## Troubleshooting

### 일반적인 문제

1. **연결 실패 (HTTP 451)**
   - 지역 제한으로 인한 문제
   - 자동으로 데모 모드로 전환됨
   - 실제 환경에서는 VPN 또는 프록시 사용 고려

2. **데이터 지연**
   - 네트워크 상태 확인
   - `getStatus()`로 연결 상태 확인

3. **메모리 사용량**
   - 기본 200개 캔들 버퍼 유지
   - 장시간 실행 시 주기적 재시작 권장

### 로그 레벨

```typescript
// 로그 출력 조절
console.log('📊 BTC/USDT: ...'); // 일반 정보
console.error('❌ Error: ...'); // 에러
console.log('🎭 Demo mode: ...'); // 데모 모드
console.log('🔄 Reconnecting: ...'); // 재연결
```

## Performance

### 리소스 사용량
- **메모리**: ~5-10MB (200개 캔들 버퍼)
- **CPU**: 최소 (이벤트 기반 처리)
- **네트워크**: ~1KB/초 (실시간 데이터)

### 최적화 팁
1. 필요한 이벤트만 구독
2. 긴 작업은 별도 Worker 스레드 사용
3. 주기적인 메모리 정리
4. 연결 상태 모니터링

## Examples

### 1. 간단한 가격 모니터링

```typescript
import { binanceWebSocketService } from '@/lib/services/binance-websocket-service';

await binanceWebSocketService.start();

binanceWebSocketService.on('ticker', (ticker) => {
  console.log(`BTC/USDT: $${ticker.price} (${ticker.priceChangePercent.toFixed(2)}%)`);
});
```

### 2. 기술지표 기반 알림

```typescript
binanceWebSocketService.on('data', (data) => {
  if (data.indicators?.rsi14) {
    if (data.indicators.rsi14 < 30) {
      console.log('🔥 RSI Oversold - Potential BUY opportunity!');
    } else if (data.indicators.rsi14 > 70) {
      console.log('⚠️ RSI Overbought - Potential SELL opportunity!');
    }
  }
});
```

### 3. 자동 매매 봇

```typescript
import { SimpleTradingStrategy } from '@/lib/services/binance-websocket-usage-example';

const strategy = new SimpleTradingStrategy();
await strategy.initialize();

// 2시간 후 결과 확인
setTimeout(() => {
  const summary = strategy.getPortfolioSummary();
  console.log('Trading Results:', summary);
}, 7200000);
```

## License

이 서비스는 프로젝트의 라이센스를 따릅니다.

## Support

문의사항이나 버그 리포트는 프로젝트 이슈 트래커를 이용해 주세요.