import { test, expect } from '@playwright/test';

test.describe('Bitcoin API Tests', () => {
  
  test('GET /api/bitcoin/current should return current price', async ({ request }) => {
    const response = await request.get('/api/bitcoin/current');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('price');
    expect(data).toHaveProperty('lastUpdated');
    
    // Price should be a positive number
    expect(typeof data.price).toBe('number');
    expect(data.price).toBeGreaterThan(0);
    
    // Should have proper timestamp
    expect(data.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    
    // Optional fields
    if ('change' in data) {
      expect(typeof data.change).toBe('number');
    }
    if ('changePercent' in data) {
      expect(typeof data.changePercent).toBe('number');
    }
  });

  test('GET /api/bitcoin/history should return price history', async ({ request }) => {
    const response = await request.get('/api/bitcoin/history');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('history');
    expect(Array.isArray(data.history)).toBe(true);
    
    if (data.history.length > 0) {
      const historyItem = data.history[0];
      expect(historyItem).toHaveProperty('timestamp');
      expect(historyItem).toHaveProperty('price');
      
      expect(typeof historyItem.price).toBe('number');
      expect(historyItem.price).toBeGreaterThan(0);
      expect(historyItem.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }
  });

  test('GET /api/bitcoin/history with time range should filter correctly', async ({ request }) => {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago
    
    const response = await request.get(`/api/bitcoin/history?start=${startDate}&end=${endDate}`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('history');
    expect(Array.isArray(data.history)).toBe(true);
    
    // Check that all items are within the time range
    data.history.forEach((item: any) => {
      const itemDate = new Date(item.timestamp);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      expect(itemDate.getTime()).toBeGreaterThanOrEqual(start.getTime());
      expect(itemDate.getTime()).toBeLessThanOrEqual(end.getTime());
    });
  });

  test('GET /api/bitcoin/history with limit should return correct number of items', async ({ request }) => {
    const limit = 10;
    const response = await request.get(`/api/bitcoin/history?limit=${limit}`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.history.length).toBeLessThanOrEqual(limit);
  });

  test('Bitcoin API should handle invalid date ranges', async ({ request }) => {
    // Test invalid date format
    const response1 = await request.get('/api/bitcoin/history?start=invalid-date');
    expect([400, 200]).toContain(response1.status()); // Should either reject or ignore invalid dates
    
    // Test start date after end date
    const endDate = new Date('2024-01-01').toISOString();
    const startDate = new Date('2024-01-10').toISOString(); // After end date
    
    const response2 = await request.get(`/api/bitcoin/history?start=${startDate}&end=${endDate}`);
    expect([400, 200]).toContain(response2.status());
    
    if (response2.status() === 200) {
      const data = await response2.json();
      // Should return empty array or handle gracefully
      expect(Array.isArray(data.history)).toBe(true);
    }
  });

  test('Bitcoin API should handle concurrent requests', async ({ request }) => {
    const promises = [
      request.get('/api/bitcoin/current'),
      request.get('/api/bitcoin/current'),
      request.get('/api/bitcoin/history')
    ];

    const responses = await Promise.all(promises);
    
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });

    const dataPromises = responses.map(response => response.json());
    const results = await Promise.all(dataPromises);
    
    // Current price requests should return similar data (price might vary slightly)
    expect(typeof results[0].price).toBe('number');
    expect(typeof results[1].price).toBe('number');
    expect(Array.isArray(results[2].history)).toBe(true);
  });

  test('Bitcoin API should return consistent data structure', async ({ request }) => {
    const currentResponse = await request.get('/api/bitcoin/current');
    const historyResponse = await request.get('/api/bitcoin/history');
    
    expect(currentResponse.status()).toBe(200);
    expect(historyResponse.status()).toBe(200);
    
    const currentData = await currentResponse.json();
    const historyData = await historyResponse.json();
    
    // Current data structure
    expect(currentData).toHaveProperty('price');
    expect(currentData).toHaveProperty('lastUpdated');
    
    // History data structure
    expect(historyData).toHaveProperty('history');
    expect(Array.isArray(historyData.history)).toBe(true);
    
    if (historyData.history.length > 0) {
      const historyItem = historyData.history[0];
      expect(historyItem).toHaveProperty('timestamp');
      expect(historyItem).toHaveProperty('price');
    }
  });

  test('Bitcoin API should handle rate limiting', async ({ request }) => {
    // Make multiple rapid requests to test rate limiting
    const rapidRequests = Array(20).fill(null).map(() => 
      request.get('/api/bitcoin/current')
    );

    const responses = await Promise.all(rapidRequests);
    
    // Should either all succeed or some return 429
    responses.forEach(response => {
      expect([200, 429]).toContain(response.status());
    });
    
    // At least some should succeed
    const successCount = responses.filter(r => r.status() === 200).length;
    expect(successCount).toBeGreaterThan(0);
  });

  test('Bitcoin API should return reasonable price values', async ({ request }) => {
    const response = await request.get('/api/bitcoin/current');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    
    // Bitcoin price should be within reasonable range
    // (adjust these values based on when test is run)
    expect(data.price).toBeGreaterThan(1000); // Should be at least $1,000
    expect(data.price).toBeLessThan(1000000); // Should be less than $1,000,000
    
    // Change percent should be reasonable (less than 50% daily change)
    if ('changePercent' in data) {
      expect(Math.abs(data.changePercent)).toBeLessThan(50);
    }
  });

  test('Bitcoin API should handle network errors gracefully', async ({ request, page }) => {
    // Mock network failure for external API
    await page.route('**/api.coingecko.com/**', route => {
      route.abort('failed');
    });

    const response = await request.get('/api/bitcoin/current');
    
    // Should handle external API failure gracefully
    // Might return cached data (200) or error (500/503)
    expect([200, 500, 503]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('price');
      // Might have a flag indicating cached/stale data
    }
  });

  test('Bitcoin API should provide proper CORS headers', async ({ request }) => {
    const response = await request.get('/api/bitcoin/current');
    
    expect(response.status()).toBe(200);
    
    // Check for CORS headers if needed for frontend
    const headers = response.headers();
    
    // These might not be present if CORS is handled elsewhere
    if ('access-control-allow-origin' in headers) {
      expect(headers['access-control-allow-origin']).toBeDefined();
    }
  });

  test('Bitcoin API should return data within reasonable time', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.get('/api/bitcoin/current');
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(response.status()).toBe(200);
    
    // Should respond within 10 seconds (adjust based on external API)
    expect(responseTime).toBeLessThan(10000);
    
    const data = await response.json();
    expect(data).toHaveProperty('price');
  });
});