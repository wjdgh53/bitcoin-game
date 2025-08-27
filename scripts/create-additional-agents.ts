import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const agentsToCreate = [
  {
    name: "Conservative Charlie",
    type: "conservative-agent-001",
    personality: "conservative",
    strategy: JSON.stringify([
      "Value Investing",
      "Long-term Buy and Hold",
      "Risk Management",
      "Dollar Cost Averaging"
    ]),
    description: "안전을 최우선으로 하는 보수적 투자자. 장기적 가치 투자와 위험 관리에 중점을 둡니다."
  },
  {
    name: "Aggressive Alex",
    type: "aggressive-agent-001", 
    personality: "aggressive",
    strategy: JSON.stringify([
      "Momentum Trading",
      "High Frequency Trading",
      "Leverage Utilization",
      "Technical Breakouts"
    ]),
    description: "빠른 수익을 추구하는 공격적 트레이더. 높은 위험을 감수하며 모멘텀을 활용합니다."
  },
  {
    name: "Quant Quinn",
    type: "quantitative-agent-001",
    personality: "quantitative", 
    strategy: JSON.stringify([
      "Statistical Arbitrage",
      "Technical Analysis",
      "Algorithmic Trading",
      "Data-driven Decisions"
    ]),
    description: "데이터와 수학적 모델을 기반으로 하는 정량적 분석가. 통계와 알고리즘을 활용합니다."
  },
  {
    name: "Contrarian Chris",
    type: "contrarian-agent-001",
    personality: "contrarian",
    strategy: JSON.stringify([
      "Counter-trend Trading",
      "Value Investing",
      "Sentiment Analysis", 
      "Market Psychology"
    ]),
    description: "시장의 흐름과 반대로 행동하는 역발상 투자자. 대중 심리의 반대편에 서서 기회를 찾습니다."
  }
];

async function createAdditionalAgents() {
  console.log('🤖 Creating additional agents with diverse personalities...');

  try {
    for (const agentData of agentsToCreate) {
      // Check if agent already exists
      const existingAgent = await prisma.agent.findUnique({
        where: { type: agentData.type }
      });

      if (!existingAgent) {
        const agent = await prisma.agent.create({
          data: agentData
        });
        console.log(`✅ Created agent: ${agent.name} (${agent.personality})`);
      } else {
        console.log(`⚠️  Agent already exists: ${agentData.name}`);
      }
    }

    console.log('\n🎉 Additional agents created successfully!');

  } catch (error) {
    console.error('❌ Failed to create additional agents:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdditionalAgents();