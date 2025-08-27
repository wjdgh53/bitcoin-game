// Demo script to populate watchlist with sample data

import { prisma } from '@/lib/database/prisma-client';

const DEMO_USER_ID = 'demo-user-123';

const DEMO_WATCHLIST_ITEMS = [
  {
    userId: DEMO_USER_ID,
    symbol: 'BTC',
    name: 'Bitcoin',
    alertPrice: 120000,
    alertType: 'above' as const,
    notes: 'Long-term hold, expecting breakout above 120k',
    tags: JSON.stringify(['store-of-value', 'hedge', 'long-term'])
  },
  {
    userId: DEMO_USER_ID,
    symbol: 'ETH',
    name: 'Ethereum',
    alertPrice: 3000,
    alertType: 'below' as const,
    notes: 'DCA opportunity if it dips below 3k',
    tags: JSON.stringify(['DeFi', 'smart-contracts', 'DCA'])
  },
  {
    userId: DEMO_USER_ID,
    symbol: 'ADA',
    name: 'Cardano',
    alertPrice: 0.5,
    alertType: 'both' as const,
    notes: 'Watching for breakout or breakdown from current range',
    tags: JSON.stringify(['proof-of-stake', 'academic', 'range-bound'])
  },
  {
    userId: DEMO_USER_ID,
    symbol: 'SOL',
    name: 'Solana',
    alertPrice: 300,
    alertType: 'above' as const,
    notes: 'High beta play on crypto recovery',
    tags: JSON.stringify(['high-performance', 'ecosystem', 'momentum'])
  },
  {
    userId: DEMO_USER_ID,
    symbol: 'DOT',
    name: 'Polkadot',
    alertPrice: 15,
    alertType: 'above' as const,
    notes: 'Interoperability play with strong fundamentals',
    tags: JSON.stringify(['interoperability', 'parachain', 'fundamental'])
  }
];

async function createDemoWatchlist() {
  try {
    console.log('🔄 Creating demo watchlist items...');

    // Clear existing demo watchlist items
    await prisma.watchlistItem.deleteMany({
      where: { userId: DEMO_USER_ID }
    });

    // Create demo items
    for (const item of DEMO_WATCHLIST_ITEMS) {
      await prisma.watchlistItem.create({ data: item });
      console.log(`✅ Created watchlist item: ${item.symbol} - ${item.name}`);
    }

    console.log(`🎉 Created ${DEMO_WATCHLIST_ITEMS.length} demo watchlist items`);

  } catch (error) {
    console.error('❌ Failed to create demo watchlist:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createDemoWatchlist();