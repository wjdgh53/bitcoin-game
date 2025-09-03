import { NextRequest } from 'next/server';
import { binanceWebSocketService } from '@/lib/services/binance-websocket-service';
import { webSocketServiceManager } from '@/lib/services/websocket-service-manager';

// Server-Sent Events endpoint for real-time Binance data streaming
export async function GET(request: NextRequest) {
  // Create readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Track if controller is still open
      let isControllerOpen = true;
      
      // Helper function to safely enqueue messages
      const safeEnqueue = (message: string) => {
        if (isControllerOpen) {
          try {
            controller.enqueue(new TextEncoder().encode(message));
          } catch (error) {
            console.log('Controller closed, stopping message sending');
            isControllerOpen = false;
            cleanup();
          }
        }
      };

      // Send initial connection message
      const initialMessage = `data: ${JSON.stringify({
        type: 'connected',
        message: 'Connected to Binance US WebSocket stream',
        timestamp: Date.now()
      })}\n\n`;
      safeEnqueue(initialMessage);

      // Set up event listeners for the WebSocket service
      const handleTicker = (ticker: any) => {
        const message = `data: ${JSON.stringify({
          type: 'ticker',
          data: ticker,
          timestamp: Date.now()
        })}\n\n`;
        safeEnqueue(message);
      };

      const handleKline = (kline: any) => {
        const message = `data: ${JSON.stringify({
          type: 'kline',
          data: kline,
          timestamp: Date.now()
        })}\n\n`;
        safeEnqueue(message);
      };

      const handleCombinedData = (data: any) => {
        const message = `data: ${JSON.stringify({
          type: 'data',
          data: data,
          timestamp: Date.now()
        })}\n\n`;
        safeEnqueue(message);
      };

      const handleError = (error: any) => {
        const message = `data: ${JSON.stringify({
          type: 'error',
          error: error.message || 'Unknown error',
          timestamp: Date.now()
        })}\n\n`;
        safeEnqueue(message);
      };

      const handleConnected = () => {
        const message = `data: ${JSON.stringify({
          type: 'service_connected',
          message: 'WebSocket service connected',
          timestamp: Date.now()
        })}\n\n`;
        safeEnqueue(message);
      };

      const handleDisconnected = () => {
        const message = `data: ${JSON.stringify({
          type: 'service_disconnected',
          message: 'WebSocket service disconnected',
          timestamp: Date.now()
        })}\n\n`;
        safeEnqueue(message);
      };

      const handleHealthCheckFailed = (status: any) => {
        const message = `data: ${JSON.stringify({
          type: 'health_check_failed',
          status: status,
          timestamp: Date.now()
        })}\n\n`;
        safeEnqueue(message);
      };

      // Register event listeners
      binanceWebSocketService.on('ticker', handleTicker);
      binanceWebSocketService.on('kline', handleKline);
      binanceWebSocketService.on('data', handleCombinedData);
      binanceWebSocketService.on('error', handleError);
      binanceWebSocketService.on('connected', handleConnected);
      binanceWebSocketService.on('disconnected', handleDisconnected);
      binanceWebSocketService.on('health_check_failed', handleHealthCheckFailed);

      // Start the service manager (includes both WebSocket and database persistence)
      if (!webSocketServiceManager.isServiceRunning()) {
        webSocketServiceManager.start({
          enableBatching: true,
          batchSize: 5,
          batchTimeout: 3000, // 3 seconds
          skipDuplicates: true,
          maxRetries: 3
        }).catch((error) => {
          console.error('Failed to start WebSocket service manager:', error);
          handleError(error);
        });
      }

      // Send periodic status updates
      const statusInterval = setInterval(() => {
        if (!isControllerOpen) return;
        const status = binanceWebSocketService.getStatus();
        const message = `data: ${JSON.stringify({
          type: 'status',
          data: status,
          timestamp: Date.now()
        })}\n\n`;
        safeEnqueue(message);
      }, 10000); // Every 10 seconds

      // Send keep-alive messages
      const keepAliveInterval = setInterval(() => {
        if (!isControllerOpen) return;
        const message = `data: ${JSON.stringify({
          type: 'heartbeat',
          timestamp: Date.now()
        })}\n\n`;
        safeEnqueue(message);
      }, 30000); // Every 30 seconds

      // Handle cleanup when stream is closed
      const cleanup = () => {
        isControllerOpen = false;
        binanceWebSocketService.off('ticker', handleTicker);
        binanceWebSocketService.off('kline', handleKline);
        binanceWebSocketService.off('data', handleCombinedData);
        binanceWebSocketService.off('error', handleError);
        binanceWebSocketService.off('connected', handleConnected);
        binanceWebSocketService.off('disconnected', handleDisconnected);
        binanceWebSocketService.off('health_check_failed', handleHealthCheckFailed);
        clearInterval(statusInterval);
        clearInterval(keepAliveInterval);
      };

      // Store cleanup function for later use
      (controller as any).cleanup = cleanup;
    },

    cancel() {
      // Clean up when client disconnects
      console.log('SSE client disconnected, cleaning up...');
      if ((this as any).cleanup) {
        (this as any).cleanup();
      }
    }
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}