-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "personality" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "analysis_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentName" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recommendation" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "title" TEXT NOT NULL,
    "executiveSummary" TEXT NOT NULL,
    "marketAnalysis" TEXT NOT NULL,
    "technicalAnalysis" TEXT NOT NULL,
    "riskAssessment" TEXT NOT NULL,
    "strategyRationale" TEXT NOT NULL,
    "nextSteps" TEXT NOT NULL,
    "currentPrice" REAL NOT NULL,
    "priceChange24h" REAL NOT NULL,
    "trend" TEXT NOT NULL,
    "momentum" REAL NOT NULL,
    "support" REAL NOT NULL,
    "resistance" REAL NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "agents_type_key" ON "agents"("type");
