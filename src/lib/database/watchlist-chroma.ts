// ChromaDB setup for watchlist feature

import { getChromaClient } from './chroma-client';
import { WatchlistItemOutput } from '@/types/watchlist';

const COLLECTION_NAME = 'watchlist_items';

export async function setupWatchlistCollection() {
  try {
    const chroma = await getChromaClient();
    
    try {
      return await chroma.getCollection({ name: COLLECTION_NAME });
    } catch {
      return await chroma.createCollection({
        name: COLLECTION_NAME,
        metadata: {
          description: 'User cryptocurrency watchlist items',
          category: 'user_watchlist',
          version: '1.0',
          searchable_fields: ['symbol', 'name', 'notes', 'tags']
        }
      });
    }
  } catch (error) {
    console.warn('ChromaDB not available for watchlist:', error.message);
    throw error;
  }
}

export function watchlistItemToDocument(item: WatchlistItemOutput) {
  return {
    id: item.id,
    document: `${item.symbol} - ${item.name}\n\nNotes: ${item.notes || 'No notes'}\nTags: ${item.tags.join(', ')}\nAlert: ${item.alertPrice ? `$${item.alertPrice} (${item.alertType})` : 'No alert set'}`,
    metadata: {
      user_id: item.userId,
      symbol: item.symbol,
      name: item.name,
      alert_price: item.alertPrice || 0,
      alert_type: item.alertType || 'none',
      tags: item.tags.join(','),
      alert_triggered: item.alertTriggered,
      created_at: item.createdAt.toISOString(),
      updated_at: item.updatedAt.toISOString()
    }
  };
}