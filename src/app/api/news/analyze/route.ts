import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock news data for development
const MOCK_NEWS_DATA = [
  {
    title: "비트코인, 새로운 사상 최고가 경신 전망",
    content: "비트코인이 최근 기관 투자자들의 관심 증가와 함께 상승세를 지속하고 있어 새로운 사상 최고가 경신이 기대된다는 분석이 나왔다.",
    source: "CryptoNews",
    url: "https://example.com/bitcoin-ath-forecast",
    category: "market",
    sentimentScore: 0.7,
    importanceScore: 9,
    relatedSymbols: ["BTC", "ETH"],
    summary: "기관 투자자 유입으로 비트코인 새 고점 전망",
    aiAnalysis: "긍정적인 기관 투자 심리와 시장 모멘텀이 지속되고 있어 단기적으로 상승 여력이 있는 것으로 판단됩니다."
  },
  {
    title: "SEC, 암호화폐 규제 프레임워크 발표 예정",
    content: "미국 증권거래위원회(SEC)가 암호화폐 시장의 명확한 규제 가이드라인을 곧 발표할 예정이라고 관계자가 밝혔다.",
    source: "RegulatoryUpdate",
    url: "https://example.com/sec-crypto-framework",
    category: "regulatory",
    sentimentScore: -0.2,
    importanceScore: 8,
    relatedSymbols: ["BTC", "ETH", "ADA"],
    summary: "SEC 암호화폐 규제 가이드라인 발표 임박",
    aiAnalysis: "규제 불확실성 해소 가능성과 동시에 단기적인 변동성 증가가 예상됩니다."
  },
  {
    title: "이더리움 2.0 업그레이드 완료율 95% 달성",
    content: "이더리움 네트워크의 대규모 업그레이드가 95% 완료되어 최종 단계에 접어들었다고 개발팀이 발표했다.",
    source: "EthereumFoundation",
    url: "https://example.com/eth2-upgrade-95",
    category: "technical",
    sentimentScore: 0.8,
    importanceScore: 7,
    relatedSymbols: ["ETH"],
    summary: "이더리움 2.0 업그레이드 95% 완료",
    aiAnalysis: "네트워크 성능 향상과 에너지 효율성 개선으로 장기적 가치 상승 요인으로 작용할 것으로 예상됩니다."
  },
  {
    title: "JP모건, 암호화폐 거래 서비스 확대 발표",
    content: "글로벌 투자은행 JP모건이 기관 고객 대상 암호화폐 거래 서비스를 대폭 확대한다고 발표했다.",
    source: "FinancialTimes",
    url: "https://example.com/jpmorgan-crypto-expansion",
    category: "corporate",
    sentimentScore: 0.6,
    importanceScore: 8,
    relatedSymbols: ["BTC", "ETH"],
    summary: "JP모건, 암호화폐 거래 서비스 확대",
    aiAnalysis: "전통 금융기관의 암호화폐 진입 가속화로 시장 신뢰도와 유동성 증가가 기대됩니다."
  },
  {
    title: "중앙은행 디지털화폐(CBDC) 시범 운영 확대",
    content: "여러 국가의 중앙은행들이 디지털화폐 시범 운영을 확대하며 디지털 금융 혁신을 가속화하고 있다.",
    source: "CentralBankDigest",
    url: "https://example.com/cbdc-pilot-expansion",
    category: "regulatory",
    sentimentScore: 0.1,
    importanceScore: 6,
    relatedSymbols: ["BTC", "ETH", "USDC"],
    summary: "CBDC 시범 운영 확대로 디지털 금융 혁신 가속",
    aiAnalysis: "CBDC 도입은 암호화폐 시장에 중립적-긍정적 영향을 미칠 것으로 예상되며, 디지털 자산 인프라 발전에 기여할 것입니다."
  }
];

// POST /api/news/analyze - 뉴스 분석 트리거 (개발용 - 목 데이터 생성)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = 'generate_mock' } = body;

    if (action === 'generate_mock') {
      // 목 뉴스 데이터 생성
      const createdNews = [];
      const baseTime = Date.now();

      for (let i = 0; i < MOCK_NEWS_DATA.length; i++) {
        const newsData = MOCK_NEWS_DATA[i];
        const publishedAt = new Date(baseTime - (i * 2 * 60 * 60 * 1000)); // 2시간 간격

        const article = await prisma.newsArticle.create({
          data: {
            title: newsData.title,
            content: newsData.content,
            source: newsData.source,
            url: newsData.url,
            publishedAt,
            sentimentScore: newsData.sentimentScore,
            importanceScore: newsData.importanceScore,
            category: newsData.category,
            relatedSymbols: JSON.stringify(newsData.relatedSymbols),
            summary: newsData.summary,
            aiAnalysis: newsData.aiAnalysis,
          }
        });

        createdNews.push({
          ...article,
          relatedSymbols: JSON.parse(article.relatedSymbols),
        });
      }

      // 일일 리포트도 생성
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const report = await prisma.newsReport.create({
        data: {
          type: 'daily',
          date: today,
          overallSentiment: 0.42,
          marketTrend: 'bullish',
          keyEvents: JSON.stringify([
            "비트코인 신고점 전망 부각",
            "SEC 규제 프레임워크 발표 예정",
            "JP모건 암호화폐 서비스 확대"
          ]),
          summary: "오늘 암호화폐 시장은 기관 투자자들의 관심 증가와 규제 환경 개선 기대감으로 전반적으로 긍정적인 분위기를 보였습니다. 비트코인의 새로운 고점 전망과 대형 금융기관의 서비스 확대가 주요 호재로 작용했습니다.",
          topStoriesIds: JSON.stringify(createdNews.slice(0, 3).map(n => n.id)),
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          message: '뉴스 분석이 완료되었습니다',
          newsGenerated: createdNews.length,
          reportGenerated: 1,
          articles: createdNews,
          report: {
            ...report,
            keyEvents: JSON.parse(report.keyEvents),
          }
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('Error in news analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze news' },
      { status: 500 }
    );
  }
}