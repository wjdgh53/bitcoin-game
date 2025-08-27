// Validation schemas for watchlist feature
import { z } from 'zod';

export const WatchlistItemInputSchema = z.object({
  symbol: z.string().min(1).max(10).toUpperCase(),
  name: z.string().min(1).max(100),
  alertPrice: z.number().positive().optional(),
  alertType: z.enum(['above', 'below', 'both']).optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional().default([]),
  userId: z.string().optional()
});

export const WatchlistItemUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  alertPrice: z.number().positive().optional(),
  alertType: z.enum(['above', 'below', 'both']).optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
  alertTriggered: z.boolean().optional()
});

export class ValidationUtils {
  static validateWatchlistItemInput(data: any) {
    return WatchlistItemInputSchema.parse(data);
  }

  static validateWatchlistItemUpdateInput(data: any) {
    return WatchlistItemUpdateSchema.parse(data);
  }
}