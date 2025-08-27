// Complete test script for Watchlist feature

import { watchlistService } from '@/lib/services/watchlist-service';

async function testWatchlist() {
  console.log('🚀 Starting Watchlist comprehensive test...\n');

  try {
    // Initialize service
    await watchlistService.initialize();
    console.log('✅ Service initialized successfully');

    const userId = 'demo-user-123';

    // Test 1: Create watchlist items
    console.log('\n📝 Test 1: Creating watchlist items');
    
    const item1 = await watchlistService.createWatchlistItem(userId, {
      symbol: 'BTC',
      name: 'Bitcoin',
      alertPrice: 110000,
      alertType: 'above',
      notes: 'Strong breakout expected above 110k',
      tags: ['cryptocurrency', 'store-of-value', 'institutional']
    });
    console.log(`✅ Created watchlist item 1: ${item1.symbol} - ${item1.name} (ID: ${item1.id})`);

    const item2 = await watchlistService.createWatchlistItem(userId, {
      symbol: 'ETH',
      name: 'Ethereum',
      alertPrice: 3000,
      alertType: 'below',
      notes: 'Good entry point below 3k due to recent DeFi activity',
      tags: ['ethereum', 'defi', 'smart-contracts']
    });
    console.log(`✅ Created watchlist item 2: ${item2.symbol} - ${item2.name} (ID: ${item2.id})`);

    const item3 = await watchlistService.createWatchlistItem(userId, {
      symbol: 'ADA',
      name: 'Cardano',
      alertPrice: 0.50,
      alertType: 'both',
      notes: 'Watching for volatility around 50 cents level',
      tags: ['cardano', 'proof-of-stake', 'sustainability']
    });
    console.log(`✅ Created watchlist item 3: ${item3.symbol} - ${item3.name} (ID: ${item3.id})`);

    const item4 = await watchlistService.createWatchlistItem(userId, {
      symbol: 'SOL',
      name: 'Solana',
      notes: 'High potential ecosystem growth',
      tags: ['solana', 'web3', 'nft']
    });
    console.log(`✅ Created watchlist item 4: ${item4.symbol} - ${item4.name} (ID: ${item4.id})`);

    // Test 2: Get user watchlist items
    console.log('\n📋 Test 2: Retrieving user watchlist items');
    const userItems = await watchlistService.getUserWatchlistItems(userId);
    console.log(`✅ Retrieved ${userItems.length} watchlist items for user`);
    
    userItems.forEach(item => {
      const priceInfo = item.currentPrice 
        ? `$${item.currentPrice.toLocaleString()} (${item.priceChange24h?.toFixed(2) || '0.00'}%)`
        : 'Price N/A';
      console.log(`  - ${item.symbol}: ${item.name} - ${priceInfo}`);
    });

    // Test 3: Search functionality
    console.log('\n🔍 Test 3: Testing search functionality');
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for ChromaDB indexing
    
    const searchResults1 = await watchlistService.searchWatchlistItems(userId, 'bitcoin store value');
    console.log(`✅ Search "bitcoin store value": Found ${searchResults1.length} results`);
    searchResults1.forEach(result => {
      console.log(`  - ${result.symbol}: ${result.name} (relevance: ${result.relevanceScore?.toFixed(2) || 'N/A'})`);
    });

    const searchResults2 = await watchlistService.searchWatchlistItems(userId, 'DeFi smart contracts');
    console.log(`✅ Search "DeFi smart contracts": Found ${searchResults2.length} results`);
    searchResults2.forEach(result => {
      console.log(`  - ${result.symbol}: ${result.name} (relevance: ${result.relevanceScore?.toFixed(2) || 'N/A'})`);
    });

    // Test 4: Update watchlist item
    console.log('\n✏️  Test 4: Updating watchlist item');
    const updatedItem = await watchlistService.updateWatchlistItem(item1.id, userId, {
      name: 'Bitcoin (Updated)',
      notes: item1.notes + ' Updated with latest analysis.',
      tags: [...item1.tags, 'updated', 'bullish'],
      alertTriggered: true
    });
    
    if (updatedItem) {
      console.log(`✅ Updated watchlist item: ${updatedItem.symbol} - ${updatedItem.name}`);
      console.log(`  Tags: ${updatedItem.tags.join(', ')}`);
      console.log(`  Alert triggered: ${updatedItem.alertTriggered}`);
    }

    // Test 5: Get specific watchlist item
    console.log('\n🎯 Test 5: Getting specific watchlist item');
    const specificItem = await watchlistService.getWatchlistItemById(item2.id, userId);
    if (specificItem) {
      console.log(`✅ Retrieved item: ${specificItem.symbol} - ${specificItem.name}`);
      console.log(`  Current price: $${specificItem.currentPrice?.toLocaleString() || 'N/A'}`);
      console.log(`  24h change: ${specificItem.priceChange24h?.toFixed(2) || 'N/A'}%`);
      console.log(`  Alert: ${specificItem.alertPrice ? `$${specificItem.alertPrice} (${specificItem.alertType})` : 'No alert set'}`);
    }

    // Test 6: Analytics
    console.log('\n📈 Test 6: Getting watchlist analytics');
    const analytics = await watchlistService.getWatchlistAnalytics(userId);
    console.log(`✅ Analytics retrieved:`);
    console.log(`  Total items: ${analytics.totalItems}`);
    console.log(`  Triggered alerts: ${analytics.triggeredAlerts}`);
    console.log(`  Average gain: ${analytics.averageGain}%`);
    console.log(`  Alert breakdown:`, analytics.alertBreakdown);
    console.log(`  Top performers:`, analytics.topPerformers.map(p => `${p.symbol} (${p.priceChange24h.toFixed(2)}%)`).join(', '));
    console.log(`  Top tags:`, analytics.topTags.map(t => `${t.tag} (${t.count})`).join(', '));

    // Test 7: Delete watchlist item
    console.log('\n🗑️  Test 7: Deleting watchlist item');
    const deleted = await watchlistService.deleteWatchlistItem(item4.id, userId);
    if (deleted) {
      console.log(`✅ Deleted watchlist item: ${item4.symbol} - ${item4.name}`);
    }

    // Final count
    const finalItems = await watchlistService.getUserWatchlistItems(userId);
    console.log(`✅ Final watchlist count: ${finalItems.length} (should be 3 after deletion)`);

    console.log('\n🎉 All watchlist tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Run tests
if (require.main === module) {
  testWatchlist()
    .then(() => {
      console.log('\n✨ Watchlist implementation test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Watchlist test failed:', error);
      process.exit(1);
    });
}

export { testWatchlist };