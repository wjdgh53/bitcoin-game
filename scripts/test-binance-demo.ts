#!/usr/bin/env tsx
// Simple demo test for Binance WebSocket Service

import { binanceWebSocketService } from '../src/lib/services/binance-websocket-service';

async function testBinanceDemo() {
  console.log('🎭 Testing Binance WebSocket Service (Demo Mode)...\n');

  let updateCount = 0;
  const maxUpdates = 10;

  // Set up event listeners
  binanceWebSocketService.on('connected', () => {
    console.log('✅ Service connected successfully');
    const status = binanceWebSocketService.getStatus();
    console.log(`📊 Mode: ${status.demoMode ? 'DEMO' : 'LIVE'}`);
    console.log(`🔗 Endpoint: ${status.currentEndpoint}`);
    console.log(`📦 Buffer size: ${status.klineBufferSize} candles\n`);
  });

  binanceWebSocketService.on('data', (data) => {
    updateCount++;
    
    console.log(`📊 Update #${updateCount}:`);
    console.log(`   💰 Price: $${data.ticker.price.toFixed(2)} (${data.ticker.priceChangePercent.toFixed(2)}%)`);
    console.log(`   📈 24h: $${data.ticker.low24h.toFixed(2)} - $${data.ticker.high24h.toFixed(2)}`);
    console.log(`   📊 Volume: ${(data.ticker.volume / 1000).toFixed(1)}K BTC`);
    
    if (data.indicators) {
      console.log(`   🔢 SMA20: $${data.indicators.sma20?.toFixed(2) || 'N/A'}`);
      console.log(`   📐 RSI14: ${data.indicators.rsi14?.toFixed(1) || 'N/A'}`);
      console.log(`   🌊 MACD: ${data.indicators.macd?.toFixed(2) || 'N/A'}`);
    }
    
    if (data.signals) {
      console.log(`   🎯 Signal: ${data.signals.signal} (${data.signals.strength.toFixed(0)}%)`);
      console.log(`   💡 Main reason: ${data.signals.reasons[0] || 'N/A'}`);
    }
    
    console.log('');

    // Stop after max updates
    if (updateCount >= maxUpdates) {
      console.log(`✅ Received ${maxUpdates} updates, stopping service...`);
      binanceWebSocketService.stop();
      setTimeout(() => {
        console.log('🎉 Demo test completed successfully!');
        process.exit(0);
      }, 1000);
    }
  });

  binanceWebSocketService.on('error', (error) => {
    console.error('❌ Service error:', error.message);
  });

  try {
    // Start the service
    await binanceWebSocketService.start();

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testBinanceDemo().catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

export { testBinanceDemo };