-- CreateTable
CREATE TABLE "technical_indicators" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "symbol" TEXT NOT NULL DEFAULT 'BTC',
    "timeframe" TEXT NOT NULL DEFAULT '1d',
    "price" REAL NOT NULL,
    "high" REAL NOT NULL,
    "low" REAL NOT NULL,
    "volume" REAL,
    "sma5" REAL,
    "sma10" REAL,
    "sma20" REAL,
    "sma50" REAL,
    "ema12" REAL,
    "ema26" REAL,
    "rsi" REAL,
    "stochK" REAL,
    "stochD" REAL,
    "macd" REAL,
    "macdSignal" REAL,
    "macdHistogram" REAL,
    "bbUpper" REAL,
    "bbMiddle" REAL,
    "bbLower" REAL,
    "bbWidth" REAL,
    "support" REAL,
    "resistance" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "technical_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "symbol" TEXT NOT NULL DEFAULT 'BTC',
    "timeframe" TEXT NOT NULL DEFAULT '1d',
    "overallTrend" TEXT NOT NULL,
    "trendStrength" REAL NOT NULL DEFAULT 0.0,
    "confidence" REAL NOT NULL DEFAULT 0.0,
    "buySignals" INTEGER NOT NULL DEFAULT 0,
    "sellSignals" INTEGER NOT NULL DEFAULT 0,
    "neutralSignals" INTEGER NOT NULL DEFAULT 0,
    "recommendation" TEXT NOT NULL,
    "keySupport" REAL,
    "keyResistance" REAL,
    "nextTarget" REAL,
    "stopLoss" REAL,
    "summary" TEXT NOT NULL,
    "aiInsights" TEXT NOT NULL,
    "riskAssessment" TEXT NOT NULL,
    "signalStrength" REAL NOT NULL DEFAULT 0.0,
    "volatilityLevel" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "technical_indicators_timestamp_idx" ON "technical_indicators"("timestamp");

-- CreateIndex
CREATE INDEX "technical_indicators_symbol_idx" ON "technical_indicators"("symbol");

-- CreateIndex
CREATE INDEX "technical_indicators_timeframe_idx" ON "technical_indicators"("timeframe");

-- CreateIndex
CREATE INDEX "technical_reports_timestamp_idx" ON "technical_reports"("timestamp");

-- CreateIndex
CREATE INDEX "technical_reports_symbol_idx" ON "technical_reports"("symbol");

-- CreateIndex
CREATE INDEX "technical_reports_overallTrend_idx" ON "technical_reports"("overallTrend");

-- CreateIndex
CREATE INDEX "technical_reports_recommendation_idx" ON "technical_reports"("recommendation");