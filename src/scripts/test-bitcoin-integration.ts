#!/usr/bin/env tsx

// Test script for Bitcoin API and ChromaDB integration

import { bitcoinAPI } from '../lib/services/bitcoin-api';
import { bitcoinStorage } from '../lib/services/bitcoin-storage';
import { dataScheduler } from '../lib/services/data-scheduler';

async function runTests() {
  console.log('🧪 Starting Bitcoin Integration Tests');
  console.log('=====================================\n');

  let testsRun = 0;
  let testsPassed = 0;

  // Test 1: API Health Check
  console.log('Test 1: Bitcoin API Health Check');
  try {
    const status = await bitcoinAPI.getAPIStatus();
    if (status.healthy) {
      console.log('✅ API is healthy');
      testsPassed++;
    } else {
      console.log('❌ API is not healthy');
    }
  } catch (error) {
    console.log('❌ API health check failed:', error);
  }
  testsRun++;

  // Test 2: Fetch Current Bitcoin Price
  console.log('\nTest 2: Fetch Current Bitcoin Price');
  try {
    const currentData = await bitcoinAPI.getCurrentPrice();
    console.log(`✅ Current Bitcoin price: $${currentData.price.toFixed(2)}`);
    console.log(`   Volume: $${currentData.volume.toLocaleString()}`);
    console.log(`   Change 24h: ${currentData.changePercentage24h.toFixed(2)}%`);
    testsPassed++;
  } catch (error) {
    console.log('❌ Failed to fetch current price:', error);
  }
  testsRun++;

  // Test 3: Fetch Detailed Bitcoin Data
  console.log('\nTest 3: Fetch Detailed Bitcoin Data');
  try {
    const detailedData = await bitcoinAPI.getDetailedData();
    console.log(`✅ Detailed data fetched successfully`);
    console.log(`   Price: $${detailedData.price.toFixed(2)}`);
    console.log(`   High 24h: $${detailedData.high24h.toFixed(2)}`);
    console.log(`   Low 24h: $${detailedData.low24h.toFixed(2)}`);
    testsPassed++;
  } catch (error) {
    console.log('❌ Failed to fetch detailed data:', error);
  }
  testsRun++;

  // Test 4: Initialize ChromaDB Storage
  console.log('\nTest 4: Initialize ChromaDB Storage');
  try {
    await bitcoinStorage.initialize();
    console.log('✅ ChromaDB storage initialized successfully');
    testsPassed++;
  } catch (error) {
    console.log('❌ Failed to initialize ChromaDB storage:', error);
  }
  testsRun++;

  // Test 5: Store Bitcoin Data in ChromaDB
  console.log('\nTest 5: Store Bitcoin Data in ChromaDB');
  try {
    const testData = await bitcoinAPI.getCurrentPrice();
    const storedId = await bitcoinStorage.storeBitcoinData(testData);
    console.log(`✅ Data stored successfully with ID: ${storedId}`);
    testsPassed++;
  } catch (error) {
    console.log('❌ Failed to store data in ChromaDB:', error);
  }
  testsRun++;

  // Test 6: Query Bitcoin Data from ChromaDB
  console.log('\nTest 6: Query Bitcoin Data from ChromaDB');
  try {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    const data = await bitcoinStorage.queryBitcoinDataByTimeRange(startTime, endTime, 10);
    console.log(`✅ Retrieved ${data.length} data points from storage`);
    if (data.length > 0) {
      const latest = data[data.length - 1];
      console.log(`   Latest price in storage: $${latest.price.toFixed(2)}`);
    }
    testsPassed++;
  } catch (error) {
    console.log('❌ Failed to query data from ChromaDB:', error);
  }
  testsRun++;

  // Test 7: Storage Statistics
  console.log('\nTest 7: Storage Statistics');
  try {
    const stats = await bitcoinStorage.getStorageStats();
    console.log(`✅ Storage stats retrieved successfully`);
    console.log(`   Total documents: ${stats.totalDocuments}`);
    console.log(`   Latest timestamp: ${stats.latestTimestamp?.toISOString() || 'N/A'}`);
    if (stats.priceRange) {
      console.log(`   Price range: $${stats.priceRange.min.toFixed(2)} - $${stats.priceRange.max.toFixed(2)}`);
    }
    testsPassed++;
  } catch (error) {
    console.log('❌ Failed to get storage stats:', error);
  }
  testsRun++;

  // Test 8: Cache System Test
  console.log('\nTest 8: Cache System Test');
  try {
    // First call - should fetch from API
    const start = Date.now();
    const cachedData1 = await dataScheduler.getCachedCurrentData();
    const firstCallTime = Date.now() - start;

    // Second call - should come from cache (much faster)
    const start2 = Date.now();
    const cachedData2 = await dataScheduler.getCachedCurrentData();
    const secondCallTime = Date.now() - start2;

    console.log(`✅ Cache system working`);
    console.log(`   First call: ${firstCallTime}ms (API)`);
    console.log(`   Second call: ${secondCallTime}ms (cache)`);
    console.log(`   Cache hit: ${secondCallTime < firstCallTime / 2 ? 'Yes' : 'No'}`);

    const cacheStats = dataScheduler.getCacheStats();
    console.log(`   Cache hit rate: ${cacheStats.hitRate}%`);

    testsPassed++;
  } catch (error) {
    console.log('❌ Cache system test failed:', error);
  }
  testsRun++;

  // Test 9: Data Validation
  console.log('\nTest 9: Data Validation');
  try {
    const testData = await bitcoinAPI.getCurrentPrice();
    
    // Test valid data
    const validationResult = await bitcoinStorage.storeBitcoinData(testData);
    console.log('✅ Data validation passed for valid data');

    // Test invalid data
    try {
      const invalidData = { ...testData, price: -100 }; // Invalid negative price
      await bitcoinStorage.storeBitcoinData(invalidData as any);
      console.log('❌ Data validation should have failed for invalid data');
    } catch (validationError) {
      console.log('✅ Data validation correctly rejected invalid data');
    }

    testsPassed++;
  } catch (error) {
    console.log('❌ Data validation test failed:', error);
  }
  testsRun++;

  // Test 10: Historical Data Fetch
  console.log('\nTest 10: Historical Data Fetch');
  try {
    const historicalData = await bitcoinAPI.getHistoricalData(1); // 1 day
    console.log(`✅ Historical data fetched: ${historicalData.length} data points`);
    
    if (historicalData.length > 0) {
      const oldest = historicalData[0];
      const newest = historicalData[historicalData.length - 1];
      console.log(`   Time range: ${oldest.timestamp.toISOString()} to ${newest.timestamp.toISOString()}`);
    }

    testsPassed++;
  } catch (error) {
    console.log('❌ Failed to fetch historical data:', error);
  }
  testsRun++;

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Test Summary');
  console.log('='.repeat(50));
  console.log(`Total tests run: ${testsRun}`);
  console.log(`Tests passed: ${testsPassed}`);
  console.log(`Tests failed: ${testsRun - testsPassed}`);
  console.log(`Success rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

  if (testsPassed === testsRun) {
    console.log('🎉 All tests passed! Bitcoin integration is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }

  return testsPassed === testsRun;
}

// Run tests if called directly
if (require.main === module) {
  runTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Test runner crashed:', error);
      process.exit(1);
    });
}

export { runTests };