import { test, expect } from '@playwright/test';

test.describe('Chat API Tests', () => {
  
  test('GET /api/chat/[agentId] should return chat messages', async ({ request }) => {
    // First get available agents
    const agentsResponse = await request.get('/api/agents');
    const agentsData = await agentsResponse.json();
    
    if (agentsData.agents && agentsData.agents.length > 0) {
      const agentId = agentsData.agents[0].id;
      
      const response = await request.get(`/api/chat/${agentId}`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('messages');
      expect(Array.isArray(data.messages)).toBe(true);
      
      // Check message structure if messages exist
      if (data.messages.length > 0) {
        const message = data.messages[0];
        expect(message).toHaveProperty('id');
        expect(message).toHaveProperty('agentId');
        expect(message).toHaveProperty('content');
        expect(message).toHaveProperty('type');
        expect(['user', 'agent', 'system']).toContain(message.type);
        expect(message).toHaveProperty('createdAt');
      }
    } else {
      test.skip();
    }
  });

  test('GET /api/chat/non-existent-agent should return 404', async ({ request }) => {
    const response = await request.get('/api/chat/non-existent-agent-id');
    expect(response.status()).toBe(404);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('POST /api/chat/[agentId] should send message and get response', async ({ request }) => {
    // Get an available agent
    const agentsResponse = await request.get('/api/agents');
    const agentsData = await agentsResponse.json();
    
    if (agentsData.agents && agentsData.agents.length > 0) {
      const agentId = agentsData.agents[0].id;
      
      const message = {
        content: 'Hello, how is the market today?',
        type: 'user'
      };

      const response = await request.post(`/api/chat/${agentId}`, {
        data: message
      });
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('userMessage');
      expect(data).toHaveProperty('agentResponse');
      
      // Check user message
      expect(data.userMessage.content).toBe(message.content);
      expect(data.userMessage.type).toBe('user');
      expect(data.userMessage.agentId).toBe(agentId);
      
      // Check agent response
      expect(data.agentResponse.type).toBe('agent');
      expect(data.agentResponse.agentId).toBe(agentId);
      expect(data.agentResponse.content).toBeDefined();
      expect(typeof data.agentResponse.content).toBe('string');
      expect(data.agentResponse.content.length).toBeGreaterThan(0);
    } else {
      test.skip();
    }
  });

  test('POST /api/chat/[agentId] should validate message content', async ({ request }) => {
    const agentsResponse = await request.get('/api/agents');
    const agentsData = await agentsResponse.json();
    
    if (agentsData.agents && agentsData.agents.length > 0) {
      const agentId = agentsData.agents[0].id;
      
      // Test empty content
      let response = await request.post(`/api/chat/${agentId}`, {
        data: {
          content: '',
          type: 'user'
        }
      });
      expect(response.status()).toBe(400);
      
      // Test missing content
      response = await request.post(`/api/chat/${agentId}`, {
        data: {
          type: 'user'
        }
      });
      expect(response.status()).toBe(400);
      
      // Test invalid type
      response = await request.post(`/api/chat/${agentId}`, {
        data: {
          content: 'Valid content',
          type: 'invalid'
        }
      });
      expect(response.status()).toBe(400);
    } else {
      test.skip();
    }
  });

  test('POST /api/chat/[agentId] should handle long messages', async ({ request }) => {
    const agentsResponse = await request.get('/api/agents');
    const agentsData = await agentsResponse.json();
    
    if (agentsData.agents && agentsData.agents.length > 0) {
      const agentId = agentsData.agents[0].id;
      
      // Test long message (2000 characters)
      const longMessage = 'A'.repeat(2000);
      
      const response = await request.post(`/api/chat/${agentId}`, {
        data: {
          content: longMessage,
          type: 'user'
        }
      });
      
      // Should handle long messages gracefully
      // Might accept it (200) or reject it (400), depends on implementation
      expect([200, 400]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.userMessage.content).toBe(longMessage);
      }
    } else {
      test.skip();
    }
  });

  test('POST /api/chat/[agentId] should handle special characters', async ({ request }) => {
    const agentsResponse = await request.get('/api/agents');
    const agentsData = await agentsResponse.json();
    
    if (agentsData.agents && agentsData.agents.length > 0) {
      const agentId = agentsData.agents[0].id;
      
      const specialMessage = {
        content: 'Hello! 안녕하세요? 🚀 💎 ₿ $BTC @mention #hashtag',
        type: 'user'
      };

      const response = await request.post(`/api/chat/${agentId}`, {
        data: specialMessage
      });
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.userMessage.content).toBe(specialMessage.content);
      expect(data.agentResponse.content).toBeDefined();
    } else {
      test.skip();
    }
  });

  test('Chat API should maintain conversation context', async ({ request }) => {
    const agentsResponse = await request.get('/api/agents');
    const agentsData = await agentsResponse.json();
    
    if (agentsData.agents && agentsData.agents.length > 0) {
      const agentId = agentsData.agents[0].id;
      
      // Send first message
      const firstMessage = {
        content: 'What is your investment philosophy?',
        type: 'user'
      };

      const firstResponse = await request.post(`/api/chat/${agentId}`, {
        data: firstMessage
      });
      expect(firstResponse.status()).toBe(200);
      
      // Send follow-up message
      const followUpMessage = {
        content: 'Can you give me specific examples?',
        type: 'user'
      };

      const followUpResponse = await request.post(`/api/chat/${agentId}`, {
        data: followUpMessage
      });
      expect(followUpResponse.status()).toBe(200);
      
      // Both responses should be contextually relevant
      const firstData = await firstResponse.json();
      const followUpData = await followUpResponse.json();
      
      expect(firstData.agentResponse.content).toBeDefined();
      expect(followUpData.agentResponse.content).toBeDefined();
      
      // Follow-up response should reference context (this is implementation-specific)
      // The agent should understand "specific examples" refers to the previous topic
    } else {
      test.skip();
    }
  });

  test('Chat API should handle concurrent messages', async ({ request }) => {
    const agentsResponse = await request.get('/api/agents');
    const agentsData = await agentsResponse.json();
    
    if (agentsData.agents && agentsData.agents.length > 0) {
      const agentId = agentsData.agents[0].id;
      
      // Send multiple messages concurrently
      const messages = [
        { content: 'Message 1', type: 'user' },
        { content: 'Message 2', type: 'user' },
        { content: 'Message 3', type: 'user' }
      ];

      const promises = messages.map(message => 
        request.post(`/api/chat/${agentId}`, { data: message })
      );

      const responses = await Promise.all(promises);
      
      // All requests should eventually complete
      responses.forEach((response, index) => {
        expect(response.status()).toBe(200);
      });
      
      // Each should have proper responses
      const dataPromises = responses.map(response => response.json());
      const dataResults = await Promise.all(dataPromises);
      
      dataResults.forEach((data, index) => {
        expect(data.userMessage.content).toBe(messages[index].content);
        expect(data.agentResponse.content).toBeDefined();
      });
    } else {
      test.skip();
    }
  });

  test('Chat API should include metadata in responses', async ({ request }) => {
    const agentsResponse = await request.get('/api/agents');
    const agentsData = await agentsResponse.json();
    
    if (agentsData.agents && agentsData.agents.length > 0) {
      const agentId = agentsData.agents[0].id;
      
      const message = {
        content: 'What do you think about Bitcoin?',
        type: 'user'
      };

      const response = await request.post(`/api/chat/${agentId}`, {
        data: message
      });
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      
      // Check for metadata
      expect(data.userMessage).toHaveProperty('metadata');
      expect(data.agentResponse).toHaveProperty('metadata');
      
      // Agent response metadata should include confidence or other metrics
      const agentMetadata = JSON.parse(data.agentResponse.metadata || '{}');
      // Could include confidence, processing time, etc.
      if (Object.keys(agentMetadata).length > 0) {
        // Validate metadata structure if present
        if ('confidence' in agentMetadata) {
          expect(typeof agentMetadata.confidence).toBe('number');
          expect(agentMetadata.confidence).toBeGreaterThanOrEqual(0);
          expect(agentMetadata.confidence).toBeLessThanOrEqual(1);
        }
      }
    } else {
      test.skip();
    }
  });

  test('Chat API should handle rate limiting gracefully', async ({ request }) => {
    const agentsResponse = await request.get('/api/agents');
    const agentsData = await agentsResponse.json();
    
    if (agentsData.agents && agentsData.agents.length > 0) {
      const agentId = agentsData.agents[0].id;
      
      // Send many requests quickly to test rate limiting
      const rapidMessages = Array(10).fill(null).map((_, i) => ({
        content: `Rapid message ${i}`,
        type: 'user'
      }));

      const promises = rapidMessages.map(message => 
        request.post(`/api/chat/${agentId}`, { data: message })
      );

      const responses = await Promise.all(promises);
      
      // Should either all succeed or some return 429 (Too Many Requests)
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status());
      });
      
      // At least some should succeed
      const successCount = responses.filter(r => r.status() === 200).length;
      expect(successCount).toBeGreaterThan(0);
    } else {
      test.skip();
    }
  });

  test('Chat API should return proper timestamps', async ({ request }) => {
    const agentsResponse = await request.get('/api/agents');
    const agentsData = await agentsResponse.json();
    
    if (agentsData.agents && agentsData.agents.length > 0) {
      const agentId = agentsData.agents[0].id;
      
      const beforeTime = new Date().toISOString();
      
      const response = await request.post(`/api/chat/${agentId}`, {
        data: {
          content: 'Test timestamp message',
          type: 'user'
        }
      });
      
      const afterTime = new Date().toISOString();
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      
      // Check timestamps are valid ISO strings
      expect(data.userMessage.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
      expect(data.agentResponse.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
      
      // Check timestamps are reasonable (between before and after)
      expect(data.userMessage.createdAt).toBeGreaterThanOrEqual(beforeTime);
      expect(data.userMessage.createdAt).toBeLessThanOrEqual(afterTime);
      expect(data.agentResponse.createdAt).toBeGreaterThanOrEqual(data.userMessage.createdAt);
    } else {
      test.skip();
    }
  });
});