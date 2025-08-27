import { test, expect } from '@playwright/test';

test.describe('API Endpoint Tests', () => {
  test('should fetch agents from API', async ({ request }) => {
    const response = await request.get('/api/agents');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('agents');
    expect(Array.isArray(data.agents)).toBeTruthy();
  });

  test('should fetch agents with details from API', async ({ request }) => {
    const response = await request.get('/api/agents?includeDetails=true');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('agents');
    
    if (data.agents.length > 0) {
      const agent = data.agents[0];
      expect(agent).toHaveProperty('id');
      expect(agent).toHaveProperty('name');
      expect(agent).toHaveProperty('personality');
      expect(agent).toHaveProperty('description');
      expect(agent).toHaveProperty('patterns');
      expect(agent).toHaveProperty('watchlistItems');
    }
  });

  test('should fetch specific agent by ID', async ({ request }) => {
    // First get list of agents
    const listResponse = await request.get('/api/agents');
    const listData = await listResponse.json();
    
    if (listData.agents && listData.agents.length > 0) {
      const agentId = listData.agents[0].id;
      
      // Fetch specific agent
      const response = await request.get(`/api/agents/${agentId}`);
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('id', agentId);
      expect(data.data).toHaveProperty('patterns');
      expect(data.data).toHaveProperty('watchlistItems');
    }
  });

  test('should create a new agent', async ({ request }) => {
    const newAgent = {
      name: 'API Test Agent',
      type: 'test-agent-' + Date.now(),
      personality: 'balanced',
      strategy: ['가치 투자', '장기 보유'],
      description: 'Agent created by API test'
    };
    
    const response = await request.post('/api/agents', {
      data: newAgent
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('agent');
    expect(data.agent).toHaveProperty('name', 'API Test Agent');
    expect(data.agent).toHaveProperty('personality', 'balanced');
    
    // Clean up - delete the created agent
    if (data.agent && data.agent.id) {
      await request.delete(`/api/agents/${data.agent.id}`);
    }
  });

  test('should update an agent', async ({ request }) => {
    // First create an agent
    const createResponse = await request.post('/api/agents', {
      data: {
        name: 'Update Test Agent',
        type: 'update-test-' + Date.now(),
        personality: 'conservative',
        strategy: ['기술적 분석'],
        description: 'Agent for update test'
      }
    });
    
    const createData = await createResponse.json();
    const agentId = createData.agent.id;
    
    // Update the agent
    const updateResponse = await request.put(`/api/agents/${agentId}`, {
      data: {
        name: 'Updated Agent Name',
        personality: 'aggressive',
        strategy: ['모멘텀 트레이딩', '단기 매매'],
        description: 'Updated description'
      }
    });
    
    expect(updateResponse.ok()).toBeTruthy();
    
    const updateData = await updateResponse.json();
    expect(updateData).toHaveProperty('success', true);
    expect(updateData.data).toHaveProperty('name', 'Updated Agent Name');
    expect(updateData.data).toHaveProperty('personality', 'aggressive');
    
    // Clean up
    await request.delete(`/api/agents/${agentId}`);
  });

  test('should toggle agent active status', async ({ request }) => {
    // First get an agent
    const listResponse = await request.get('/api/agents');
    const listData = await listResponse.json();
    
    if (listData.agents && listData.agents.length > 0) {
      const agent = listData.agents[0];
      const originalStatus = agent.isActive;
      
      // Toggle status
      const response = await request.patch(`/api/agents/${agent.id}`, {
        data: { isActive: !originalStatus }
      });
      
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('isActive', !originalStatus);
      
      // Toggle back to original status
      await request.patch(`/api/agents/${agent.id}`, {
        data: { isActive: originalStatus }
      });
    }
  });

  test('should handle non-existent agent gracefully', async ({ request }) => {
    const response = await request.get('/api/agents/non-existent-id');
    expect(response.status()).toBe(404);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('message');
  });

  test('should fetch reports from API', async ({ request }) => {
    const response = await request.get('/api/reports');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('reports');
    expect(Array.isArray(data.reports)).toBeTruthy();
  });

  test('should fetch reports for specific agent', async ({ request }) => {
    const response = await request.get('/api/reports?agent=conservative-agent-001');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('reports');
    
    // All reports should be from the specified agent
    if (data.reports.length > 0) {
      data.reports.forEach((report: any) => {
        expect(report.agentType).toBe('conservative-agent-001');
      });
    }
  });
});