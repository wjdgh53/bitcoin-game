import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 기본 에이전트들 생성
  const agents = [
    {
      name: "워렌 김",
      type: "conservative_value",
      personality: "신중하고 보수적인 가치투자자",
      strategy: "장기적 관점에서 펀더멘털 중심의 안전한 투자",
      description: "보수적 가치투자자",
    },
    {
      name: "제시카 박",
      type: "aggressive_momentum",
      personality: "적극적이고 빠른 결정을 내리는 모멘텀 트레이더",
      strategy: "단기 가격 움직임과 모멘텀을 활용한 공격적 매매",
      description: "모멘텀 트레이더",
    },
    {
      name: "알렉스 최",
      type: "quantitative",
      personality: "데이터와 수학적 모델을 기반으로 하는 분석가",
      strategy: "통계적 분석과 정량적 모델을 활용한 체계적 투자",
      description: "퀀트 분석가",
    }
  ];

  for (const agent of agents) {
    const existingAgent = await prisma.agent.findUnique({
      where: { type: agent.type }
    });

    if (!existingAgent) {
      await prisma.agent.create({
        data: agent
      });
      console.log(`✅ Created agent: ${agent.name} (${agent.type})`);
    } else {
      console.log(`⚠️ Agent already exists: ${agent.name} (${agent.type})`);
    }
  }

  // 기본 포트폴리오 생성
  const existingPortfolio = await prisma.portfolio.findUnique({
    where: { userId: 'demo-user' }
  });

  if (!existingPortfolio) {
    await prisma.portfolio.create({
      data: {
        userId: 'demo-user',
        balance: 10000.0,
        bitcoinHoldings: 0.0,
        totalValue: 10000.0,
        profit: 0.0,
        profitPercentage: 0.0,
      }
    });
    console.log('✅ Created demo user portfolio');
  } else {
    console.log('⚠️ Demo user portfolio already exists');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })