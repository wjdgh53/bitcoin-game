// ChromaDB setup for Trading Notes

import { getChromaClient } from './chroma-client';
import { TradingNoteOutput } from '@/types/trading-notes';

const COLLECTION_NAME = 'trading_notes';

export async function setupTradingNotesCollection() {
  const chroma = await getChromaClient();

  try {
    return await chroma.getCollection({ name: COLLECTION_NAME });
  } catch {
    return await chroma.createCollection({
      name: COLLECTION_NAME,
      metadata: {
        description: 'User trading notes and observations',
        category: 'user_content',
        version: '1.0',
        searchable_fields: ['title', 'content', 'tags', 'sentiment']
      }
    });
  }
}

export function tradingNoteToDocument(note: TradingNoteOutput) {
  // Parse tags from JSON string
  let tags: string[] = [];
  try {
    if (note.tags && typeof note.tags === 'string') {
      tags = JSON.parse(note.tags);
    } else if (Array.isArray(note.tags)) {
      tags = note.tags;
    }
  } catch {
    tags = [];
  }

  return {
    id: note.id,
    document: `${note.title}\n\n${note.content}\n\nTags: ${tags.join(', ')}\nSentiment: ${note.sentiment || 'neutral'}`,
    metadata: {
      user_id: note.userId,
      title: note.title,
      sentiment: note.sentiment || 'neutral',
      tags: tags.join(','),
      bitcoin_price: note.bitcoinPrice || 0,
      price_change_24h: note.priceChange24h || 0,
      is_public: note.isPublic,
      created_at: note.createdAt.toISOString(),
      updated_at: note.updatedAt.toISOString()
    }
  };
}