#!/usr/bin/env tsx
// Test script for Binance WebSocket Service

import { binanceWebSocketService } from '../src/lib/services/binance-websocket-service';

async function testBinanceWebSocket() {
  console.log('🧪 Testing Binance WebSocket Service...\n');

  // Set up event listeners
  binanceWebSocketService.on('connected', () => {
    console.log('✅ Service connected successfully');
  });

  binanceWebSocketService.on('disconnected', () => {
    console.log('🔌 Service disconnected');
  });

  binanceWebSocketService.on('error', (error) => {
    console.error('❌ Service error:', error.message);
  });

  binanceWebSocketService.on('ticker', (ticker) => {
    console.log(`📈 Ticker Update: ${ticker.symbol} - $${ticker.price.toFixed(2)} (${ticker.priceChangePercent.toFixed(2)}%)`);
    console.log(`   24h Range: $${ticker.low24h.toFixed(2)} - $${ticker.high24h.toFixed(2)}`);
    console.log(`   Volume: ${(ticker.volume / 1000).toFixed(1)}K BTC\n`);
  });

  binanceWebSocketService.on('kline', (kline) => {
    console.log(`🕯️ New 1m Candle: O:${kline.open.toFixed(2)} H:${kline.high.toFixed(2)} L:${kline.low.toFixed(2)} C:${kline.close.toFixed(2)} V:${(kline.volume / 1000).toFixed(1)}K`);
  });

  binanceWebSocketService.on('data', (data) => {
    console.log(`\n📊 Real-time Analysis:`);
    console.log(`   Price: $${data.ticker.price.toFixed(2)} (${data.ticker.priceChangePercent.toFixed(2)}%)`);
    
    if (data.indicators) {
      console.log(`   Indicators:`);
      if (data.indicators.sma20) console.log(`     SMA 20: $${data.indicators.sma20.toFixed(2)}`);
      if (data.indicators.rsi14) console.log(`     RSI 14: ${data.indicators.rsi14.toFixed(1)}`);
      if (data.indicators.macd !== undefined) console.log(`     MACD: ${data.indicators.macd.toFixed(4)}`);
      if (data.indicators.bbUpper && data.indicators.bbLower) {
        console.log(`     Bollinger: $${data.indicators.bbLower.toFixed(2)} - $${data.indicators.bbUpper.toFixed(2)}`);
      }
    }
    
    if (data.signals) {
      console.log(`   Signal: ${data.signals.signal} (${data.signals.strength.toFixed(0)}% strength)`);
      console.log(`   Reasons: ${data.signals.reasons.slice(0, 3).join(', ')}`);
    }
    console.log('---');
  });

  binanceWebSocketService.on('health_check_failed', (status) => {
    console.log(`⚠️ Health check failed:`, status);
  });

  try {
    // Start the service
    await binanceWebSocketService.start();

    // Show status every 10 seconds
    const statusInterval = setInterval(() => {
      const status = binanceWebSocketService.getStatus();
      console.log(`\n📡 Status: Connected=${status.connected}, Ticker=${status.tickerConnected}, Kline=${status.klineConnected}`);
      console.log(`   Kline Buffer: ${status.klineBufferSize} candles, Reconnect attempts: ${status.reconnectAttempts}`);
    }, 10000);

    // Run for 2 minutes then stop
    setTimeout(() => {
      console.log('\n⏰ Test complete, stopping service...');
      clearInterval(statusInterval);
      binanceWebSocketService.stop();
      
      setTimeout(() => {
        console.log('✅ Test finished');
        process.exit(0);
      }, 2000);
    }, 120000); // 2 minutes

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Received SIGINT, stopping service...');
      clearInterval(statusInterval);
      binanceWebSocketService.stop();
      setTimeout(() => process.exit(0), 1000);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testBinanceWebSocket().catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

export { testBinanceWebSocket };