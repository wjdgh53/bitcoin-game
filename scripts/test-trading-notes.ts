// Complete test script for Trading Notes feature

import { tradingNotesService } from '@/lib/services/trading-notes-service';

async function testTradingNotes() {
  console.log('🚀 Starting Trading Notes comprehensive test...\n');

  try {
    // Initialize service
    await tradingNotesService.initialize();
    console.log('✅ Service initialized successfully');

    const userId = 'demo-user-123';

    // Test 1: Create trading notes
    console.log('\n📝 Test 1: Creating trading notes');
    
    const note1 = await tradingNotesService.createNote(userId, {
      title: 'Bitcoin Bull Run Analysis',
      content: 'Bitcoin is showing strong upward momentum with increasing institutional adoption. Price has broken through key resistance levels.',
      tags: ['bitcoin', 'bullish', 'analysis'],
      sentiment: 'bullish',
      isPublic: false
    });
    console.log(`✅ Created note 1: ${note1.title} (ID: ${note1.id})`);

    const note2 = await tradingNotesService.createNote(userId, {
      title: 'Market Correction Concerns',
      content: 'Seeing some signs of potential market correction. High RSI levels and reduced volume suggest caution.',
      tags: ['market', 'correction', 'technical-analysis'],
      sentiment: 'bearish',
      isPublic: true
    });
    console.log(`✅ Created note 2: ${note2.title} (ID: ${note2.id})`);

    const note3 = await tradingNotesService.createNote(userId, {
      title: 'Neutral Market Outlook',
      content: 'Market is consolidating in a narrow range. Waiting for clear direction before making major moves.',
      tags: ['neutral', 'consolidation', 'waiting'],
      sentiment: 'neutral',
      isPublic: false
    });
    console.log(`✅ Created note 3: ${note3.title} (ID: ${note3.id})`);

    // Test 2: Get user notes
    console.log('\n📋 Test 2: Retrieving user notes');
    const userNotes = await tradingNotesService.getUserNotes(userId);
    console.log(`✅ Retrieved ${userNotes.length} notes for user`);
    
    userNotes.forEach(note => {
      console.log(`  - ${note.title} (${note.sentiment || 'no sentiment'})`);
    });

    // Test 3: Search functionality
    console.log('\n🔍 Test 3: Testing search functionality');
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for ChromaDB indexing
    
    const searchResults1 = await tradingNotesService.searchNotes(userId, 'bitcoin bull market');
    console.log(`✅ Search "bitcoin bull market": Found ${searchResults1.length} results`);
    searchResults1.forEach(result => {
      console.log(`  - ${result.title} (relevance: ${result.relevanceScore?.toFixed(2) || 'N/A'})`);
    });

    const searchResults2 = await tradingNotesService.searchNotes(userId, 'technical analysis RSI');
    console.log(`✅ Search "technical analysis RSI": Found ${searchResults2.length} results`);
    searchResults2.forEach(result => {
      console.log(`  - ${result.title} (relevance: ${result.relevanceScore?.toFixed(2) || 'N/A'})`);
    });

    // Test 4: Update note
    console.log('\n✏️  Test 4: Updating note');
    const updatedNote = await tradingNotesService.updateNote(note1.id, userId, {
      title: 'Updated Bitcoin Bull Run Analysis',
      content: note1.content + ' Updated with additional market insights.',
      tags: [...note1.tags, 'updated']
    });
    
    if (updatedNote) {
      console.log(`✅ Updated note: ${updatedNote.title}`);
      console.log(`  Tags: ${updatedNote.tags.join(', ')}`);
    }

    // Test 5: Get notes by sentiment
    console.log('\n📊 Test 5: Getting notes by sentiment');
    
    const bullishNotes = await tradingNotesService.getNotesBySentiment(userId, 'bullish');
    console.log(`✅ Bullish notes: ${bullishNotes.length}`);
    
    const bearishNotes = await tradingNotesService.getNotesBySentiment(userId, 'bearish');
    console.log(`✅ Bearish notes: ${bearishNotes.length}`);

    const neutralNotes = await tradingNotesService.getNotesBySentiment(userId, 'neutral');
    console.log(`✅ Neutral notes: ${neutralNotes.length}`);

    // Test 6: Analytics
    console.log('\n📈 Test 6: Getting analytics');
    const analytics = await tradingNotesService.getNotesAnalytics(userId);
    console.log(`✅ Analytics retrieved:`);
    console.log(`  Total notes: ${analytics.totalNotes}`);
    console.log(`  Sentiment breakdown:`, analytics.sentimentBreakdown);
    console.log(`  Top tags:`, analytics.topTags.map(t => `${t.tag} (${t.count})`).join(', '));
    console.log(`  Average notes per day: ${analytics.averageNotesPerDay}`);

    // Test 7: Public notes
    console.log('\n🌐 Test 7: Getting public notes');
    const publicNotes = await tradingNotesService.getPublicNotes();
    console.log(`✅ Public notes: ${publicNotes.length}`);
    publicNotes.forEach(note => {
      console.log(`  - ${note.title} by ${note.userEmail}`);
    });

    // Test 8: Get specific note
    console.log('\n🎯 Test 8: Getting specific note');
    const specificNote = await tradingNotesService.getNoteById(note2.id, userId);
    if (specificNote) {
      console.log(`✅ Retrieved note: ${specificNote.title}`);
      console.log(`  Bitcoin price at creation: $${specificNote.bitcoinPrice?.toLocaleString() || 'N/A'}`);
      console.log(`  24h price change: ${specificNote.priceChange24h?.toFixed(2) || 'N/A'}%`);
    }

    // Test 9: Delete note
    console.log('\n🗑️  Test 9: Deleting note');
    const deleted = await tradingNotesService.deleteNote(note3.id, userId);
    if (deleted) {
      console.log(`✅ Deleted note: ${note3.title}`);
    }

    // Final count
    const finalNotes = await tradingNotesService.getUserNotes(userId);
    console.log(`✅ Final note count: ${finalNotes.length} (should be 2 after deletion)`);

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Run tests
if (require.main === module) {
  testTradingNotes()
    .then(() => {
      console.log('\n✨ Trading Notes implementation test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Trading Notes test failed:', error);
      process.exit(1);
    });
}

export { testTradingNotes };