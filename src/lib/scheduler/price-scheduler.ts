// Server-side Bitcoin price scheduler
// Runs every 15 minutes to update Bitcoin price from CoinGecko API

import cron from 'node-cron';
import { bitcoinPriceService } from '../services/bitcoin-price-service';
import { technicalIndicatorsService } from '../services/technical-indicators-service';

class PriceScheduler {
  private isRunning = false;
  private job: cron.ScheduledTask | null = null;

  /**
   * Start the price update scheduler
   * Runs every 15 minutes using cron pattern
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ Price scheduler is already running');
      return;
    }

    console.log('🚀 Starting Bitcoin price scheduler (every 10 minutes) - DISABLED: Using real WebSocket data instead...');

    // Schedule task every 10 minutes
    this.job = cron.schedule('0 */10 * * * *', async () => {
      await this.updatePrice();
    }, {
      scheduled: true,
      timezone: 'America/New_York' // Or use your preferred timezone
    });

    this.isRunning = true;
    console.log('✅ Price scheduler started successfully');

    // Run immediately on startup
    setTimeout(() => {
      this.updatePrice();
    }, 5000); // Wait 5 seconds after server start
  }

  /**
   * Stop the price update scheduler
   */
  stop(): void {
    if (this.job) {
      this.job.stop();
      this.job = null;
    }
    this.isRunning = false;
    console.log('⏹️ Price scheduler stopped');
  }

  /**
   * Update Bitcoin price and portfolio values
   */
  private async updatePrice(): Promise<void> {
    try {
      console.log('📈 Running scheduled portfolio update with real WebSocket data...');
      const startTime = Date.now();

      // Get latest real Bitcoin price from WebSocket data
      const priceData = await bitcoinPriceService.updateCurrentPrice();
      
      // Update portfolio value based on new price
      await bitcoinPriceService.updatePortfolioValue();
      
      // Initialize demo portfolio if needed
      await bitcoinPriceService.initializeDemoPortfolio();
      
      // Update technical indicators and generate analysis
      await technicalIndicatorsService.updateTechnicalIndicators('1d');
      await technicalIndicatorsService.generateAnalysisReport('1d');
      
      // Clean up old data (keep last 7 days)
      await bitcoinPriceService.cleanupOldPrices();
      await technicalIndicatorsService.cleanupOldData();

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ Portfolio update completed in ${duration}ms`);
      console.log(`💰 Bitcoin Price: $${priceData.price.toLocaleString()} (${priceData.source})`);
      console.log(`📊 24h Change: ${priceData.changePercentage24h?.toFixed(2)}%`);
      console.log(`📈 Volume: ${priceData.volume?.toLocaleString()}`);
      console.log(`⏰ Next update in 10 minutes`);
      
    } catch (error) {
      console.error('❌ Failed to update Bitcoin price:', error);
      console.log('🔄 Will retry update in 10 minutes');
      
      // In real mode, log errors but continue
      if (error instanceof Error) {
        console.warn(`Error details: ${error.message}`);
      }
    }
  }

  /**
   * Manually trigger a price update (for testing)
   */
  async triggerUpdate(): Promise<void> {
    console.log('🔄 Manually triggering portfolio update...');
    await this.updatePrice();
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; nextRun: string | null } {
    return {
      isRunning: this.isRunning,
      nextRun: this.job ? 'Every 10 minutes' : null
    };
  }
}

// Export singleton instance
export const priceScheduler = new PriceScheduler();

// DISABLED: Auto-start in server environment
// Mock price generation is disabled - now using real WebSocket data
// if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
//   // Start scheduler after a short delay to ensure database is ready
//   setTimeout(() => {
//     priceScheduler.start();
//   }, 2000);
// }

export default priceScheduler;