import { test, expect } from '@playwright/test';
import { mockAgents } from '../utils/mock-data';

test.describe('Agents API Tests', () => {
  
  test('GET /api/agents should return agents list', async ({ request }) => {
    const response = await request.get('/api/agents');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('agents');
    expect(Array.isArray(data.agents)).toBe(true);
    
    // Check agent structure if agents exist
    if (data.agents.length > 0) {
      const agent = data.agents[0];
      expect(agent).toHaveProperty('id');
      expect(agent).toHaveProperty('name');
      expect(agent).toHaveProperty('personality');
      expect(agent).toHaveProperty('strategy');
      expect(agent).toHaveProperty('description');
      expect(agent).toHaveProperty('isActive');
      expect(agent).toHaveProperty('createdAt');
      expect(agent).toHaveProperty('updatedAt');
    }
  });

  test('GET /api/agents?includeDetails=true should include patterns and watchlist', async ({ request }) => {
    const response = await request.get('/api/agents?includeDetails=true');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('agents');
    
    if (data.agents.length > 0) {
      const agent = data.agents[0];
      expect(agent).toHaveProperty('patterns');
      expect(agent).toHaveProperty('watchlistItems');
      expect(Array.isArray(agent.patterns)).toBe(true);
      expect(Array.isArray(agent.watchlistItems)).toBe(true);
    }
  });

  test('GET /api/agents/[id] should return specific agent', async ({ request }) => {
    // First get all agents to find a valid ID
    const agentsResponse = await request.get('/api/agents');
    const agentsData = await agentsResponse.json();
    
    if (agentsData.agents && agentsData.agents.length > 0) {
      const agentId = agentsData.agents[0].id;
      
      const response = await request.get(`/api/agents/${agentId}`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data.id).toBe(agentId);
      expect(data.data).toHaveProperty('patterns');
      expect(data.data).toHaveProperty('watchlistItems');
    } else {
      // Skip test if no agents exist
      test.skip();
    }
  });

  test('GET /api/agents/non-existent-id should return 404', async ({ request }) => {
    const response = await request.get('/api/agents/non-existent-id');
    
    expect(response.status()).toBe(404);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('message');
  });

  test('POST /api/agents should create new agent', async ({ request }) => {
    const newAgent = {
      name: 'Test Agent API',
      personality: 'balanced',
      description: 'API test agent description',
      strategy: ['가치 투자', '장기 보유']
    };

    const response = await request.post('/api/agents', {
      data: newAgent
    });
    
    expect(response.status()).toBe(201);
    
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data.name).toBe(newAgent.name);
    expect(data.personality).toBe(newAgent.personality);
    expect(data.description).toBe(newAgent.description);
    expect(data.strategy).toEqual(newAgent.strategy);
    expect(data).toHaveProperty('type');
    expect(data).toHaveProperty('isActive', true);
    expect(data).toHaveProperty('createdAt');
    expect(data).toHaveProperty('updatedAt');
  });

  test('POST /api/agents should validate required fields', async ({ request }) => {
    // Test missing name
    const invalidAgent1 = {
      personality: 'balanced',
      description: 'Test description'
    };

    let response = await request.post('/api/agents', {
      data: invalidAgent1
    });
    expect(response.status()).toBe(400);

    // Test missing personality
    const invalidAgent2 = {
      name: 'Test Agent',
      description: 'Test description'
    };

    response = await request.post('/api/agents', {
      data: invalidAgent2
    });
    expect(response.status()).toBe(400);

    // Test missing description
    const invalidAgent3 = {
      name: 'Test Agent',
      personality: 'balanced'
    };

    response = await request.post('/api/agents', {
      data: invalidAgent3
    });
    expect(response.status()).toBe(400);
  });

  test('POST /api/agents should validate personality values', async ({ request }) => {
    const invalidAgent = {
      name: 'Test Agent',
      personality: 'invalid-personality',
      description: 'Test description'
    };

    const response = await request.post('/api/agents', {
      data: invalidAgent
    });
    
    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('personality');
  });

  test('PUT /api/agents/[id] should update agent', async ({ request }) => {
    // First create an agent
    const newAgent = {
      name: 'Test Agent for Update',
      personality: 'balanced',
      description: 'Original description',
      strategy: ['가치 투자']
    };

    const createResponse = await request.post('/api/agents', {
      data: newAgent
    });
    expect(createResponse.status()).toBe(201);
    const createdAgent = await createResponse.json();

    // Now update it
    const updateData = {
      name: 'Updated Test Agent',
      description: 'Updated description',
      strategy: ['가치 투자', '장기 보유']
    };

    const updateResponse = await request.put(`/api/agents/${createdAgent.id}`, {
      data: updateData
    });

    expect(updateResponse.status()).toBe(200);
    
    const updatedAgent = await updateResponse.json();
    expect(updatedAgent.name).toBe(updateData.name);
    expect(updatedAgent.description).toBe(updateData.description);
    expect(updatedAgent.strategy).toEqual(updateData.strategy);
    expect(updatedAgent.personality).toBe(newAgent.personality); // Should remain unchanged
  });

  test('DELETE /api/agents/[id] should delete agent', async ({ request }) => {
    // First create an agent
    const newAgent = {
      name: 'Test Agent for Deletion',
      personality: 'balanced',
      description: 'Will be deleted',
      strategy: ['가치 투자']
    };

    const createResponse = await request.post('/api/agents', {
      data: newAgent
    });
    expect(createResponse.status()).toBe(201);
    const createdAgent = await createResponse.json();

    // Delete it
    const deleteResponse = await request.delete(`/api/agents/${createdAgent.id}`);
    expect(deleteResponse.status()).toBe(200);

    // Verify it's deleted
    const getResponse = await request.get(`/api/agents/${createdAgent.id}`);
    expect(getResponse.status()).toBe(404);
  });

  test('Agent patterns API endpoints should work', async ({ request }) => {
    // Get an agent first
    const agentsResponse = await request.get('/api/agents');
    const agentsData = await agentsResponse.json();
    
    if (agentsData.agents && agentsData.agents.length > 0) {
      const agentId = agentsData.agents[0].id;
      
      // Test GET patterns
      const patternsResponse = await request.get(`/api/agents/${agentId}/patterns`);
      expect(patternsResponse.status()).toBe(200);
      
      const patternsData = await patternsResponse.json();
      expect(patternsData).toHaveProperty('patterns');
      expect(Array.isArray(patternsData.patterns)).toBe(true);

      // Test POST new pattern
      const newPattern = {
        name: 'Test Pattern',
        description: 'Test pattern description',
        priority: 3,
        confidenceRate: 75,
        examples: ['Example 1', 'Example 2']
      };

      const createPatternResponse = await request.post(`/api/agents/${agentId}/patterns`, {
        data: newPattern
      });
      
      if (createPatternResponse.status() === 201) {
        const createdPattern = await createPatternResponse.json();
        expect(createdPattern.name).toBe(newPattern.name);
        expect(createdPattern.description).toBe(newPattern.description);
        expect(createdPattern.priority).toBe(newPattern.priority);
        expect(createdPattern.confidenceRate).toBe(newPattern.confidenceRate);
      }
    } else {
      test.skip();
    }
  });

  test('Agent watchlist API endpoints should work', async ({ request }) => {
    // Get an agent first
    const agentsResponse = await request.get('/api/agents');
    const agentsData = await agentsResponse.json();
    
    if (agentsData.agents && agentsData.agents.length > 0) {
      const agentId = agentsData.agents[0].id;
      
      // Test GET watchlist
      const watchlistResponse = await request.get(`/api/agents/${agentId}/watchlist`);
      expect(watchlistResponse.status()).toBe(200);
      
      const watchlistData = await watchlistResponse.json();
      expect(watchlistData).toHaveProperty('watchlist');
      expect(Array.isArray(watchlistData.watchlist)).toBe(true);

      // Test POST new watchlist item
      const newWatchlistItem = {
        symbol: 'TEST',
        name: 'Test Stock',
        category: '테스트',
        reason: 'Test reason',
        agentView: 'Test agent view',
        alertPrice: 100.0,
        alertType: 'above'
      };

      const createWatchlistResponse = await request.post(`/api/agents/${agentId}/watchlist`, {
        data: newWatchlistItem
      });
      
      if (createWatchlistResponse.status() === 201) {
        const createdItem = await createWatchlistResponse.json();
        expect(createdItem.symbol).toBe(newWatchlistItem.symbol);
        expect(createdItem.name).toBe(newWatchlistItem.name);
        expect(createdItem.category).toBe(newWatchlistItem.category);
        expect(createdItem.reason).toBe(newWatchlistItem.reason);
        expect(createdItem.agentView).toBe(newWatchlistItem.agentView);
        expect(createdItem.alertPrice).toBe(newWatchlistItem.alertPrice);
      }
    } else {
      test.skip();
    }
  });

  test('API should handle concurrent requests', async ({ request }) => {
    // Make multiple concurrent requests
    const promises = [
      request.get('/api/agents'),
      request.get('/api/agents'),
      request.get('/api/agents')
    ];

    const responses = await Promise.all(promises);
    
    // All should succeed
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });

    // All should return the same data
    const dataPromises = responses.map(response => response.json());
    const dataResults = await Promise.all(dataPromises);
    
    expect(dataResults[0]).toEqual(dataResults[1]);
    expect(dataResults[1]).toEqual(dataResults[2]);
  });

  test('API should return proper error formats', async ({ request }) => {
    // Test 404 error format
    const response404 = await request.get('/api/agents/non-existent-id');
    expect(response404.status()).toBe(404);
    
    const data404 = await response404.json();
    expect(data404).toHaveProperty('success', false);
    expect(data404).toHaveProperty('message');

    // Test 400 error format
    const response400 = await request.post('/api/agents', {
      data: { invalid: 'data' }
    });
    expect(response400.status()).toBe(400);
    
    const data400 = await response400.json();
    expect(data400).toHaveProperty('error');
  });

  test('API should handle malformed JSON', async ({ request }) => {
    const response = await request.post('/api/agents', {
      data: 'invalid json string',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(400);
  });
});