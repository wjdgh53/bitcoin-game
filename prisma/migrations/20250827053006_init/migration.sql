-- CreateTable
CREATE TABLE "bitcoin_prices" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "price" REAL NOT NULL,
    "volume" REAL,
    "marketCap" REAL,
    "change24h" REAL,
    "changePercentage24h" REAL,
    "high24h" REAL,
    "low24h" REAL,
    "source" TEXT NOT NULL DEFAULT 'coingecko'
);

-- CreateTable
CREATE TABLE "portfolios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL DEFAULT 'demo-user',
    "balance" REAL NOT NULL DEFAULT 10000.0,
    "bitcoinHoldings" REAL NOT NULL DEFAULT 0.0,
    "totalValue" REAL NOT NULL DEFAULT 10000.0,
    "profit" REAL NOT NULL DEFAULT 0.0,
    "profitPercentage" REAL NOT NULL DEFAULT 0.0,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "trades" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL DEFAULT 'demo-user',
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "price" REAL NOT NULL,
    "total" REAL NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "portfolios_userId_key" ON "portfolios"("userId");
