// Real-time Bitcoin price ticker with WebSocket integration

'use client';

import { useEffect, useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency, formatPercentage, cn } from '@/lib/utils';
import { useRealTimePrice } from '@/lib/hooks/use-api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface PriceData {
  price: number;
  change24h: number;
  changePercentage24h: number;
  volume: number;
  marketCap: number;
  high24h: number;
  low24h: number;
  timestamp: Date;
}

interface PriceTickerProps {
  className?: string;
  showVolume?: boolean;
  showMarketCap?: boolean;
  compact?: boolean;
}

export function PriceTicker({ 
  className, 
  showVolume = true, 
  showMarketCap = true, 
  compact = false 
}: PriceTickerProps) {
  const { data: chartData, isLoading, error, isRefetching } = useRealTimePrice();
  const [previousPrice, setPreviPrice] = useState<number | null>(null);
  const [priceAnimation, setPriceAnimation] = useState<'up' | 'down' | null>(null);

  // Extract price data from chart response
  const priceData: PriceData | null = useMemo(() => {
    if (!chartData?.success || !chartData.metadata) return null;

    return {
      price: chartData.metadata.latestPrice,
      change24h: 0, // Would be calculated from price difference
      changePercentage24h: chartData.metadata.priceChange24h,
      volume: chartData.metadata.volume24h,
      marketCap: 0, // Would come from API
      high24h: chartData.metadata.latestPrice * 1.05, // Placeholder
      low24h: chartData.metadata.latestPrice * 0.95, // Placeholder
      timestamp: new Date(chartData.metadata.lastUpdated)
    };
  }, [chartData]);

  // Animate price changes
  useEffect(() => {
    if (priceData && previousPrice !== null) {
      if (priceData.price > previousPrice) {
        setPriceAnimation('up');
      } else if (priceData.price < previousPrice) {
        setPriceAnimation('down');
      }
      
      // Clear animation after 1 second
      const timer = setTimeout(() => setPriceAnimation(null), 1000);
      return () => clearTimeout(timer);
    }
    
    if (priceData) {
      setPreviPrice(priceData.price);
    }
  }, [priceData, previousPrice]);

  if (isLoading && !priceData) {
    return (
      <div className={cn('flex items-center justify-center p-4', className)}>
        <LoadingSpinner />
        <span className="ml-2 text-sm text-gray-600">Loading price data...</span>
      </div>
    );
  }

  if (error || !priceData) {
    return (
      <div className={cn('flex items-center justify-center p-4 text-red-600', className)}>
        <span className="text-sm">Failed to load price data</span>
      </div>
    );
  }

  const isPositive = priceData.changePercentage24h >= 0;
  const trendIcon = isPositive ? TrendingUp : priceData.changePercentage24h < 0 ? TrendingDown : Minus;
  const TrendIcon = trendIcon;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center">
          <span className={cn(
            'text-lg font-bold transition-colors duration-300',
            priceAnimation === 'up' && 'text-green-600',
            priceAnimation === 'down' && 'text-red-600',
            !priceAnimation && 'text-gray-900'
          )}>
            {formatCurrency(priceData.price)}
          </span>
          {isRefetching && <LoadingSpinner size="sm" className="ml-2" />}
        </div>
        
        <div className={cn(
          'flex items-center gap-1 text-sm',
          isPositive ? 'text-green-600' : 'text-red-600'
        )}>
          <TrendIcon className="h-4 w-4" />
          <span>{formatPercentage(priceData.changePercentage24h)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'bg-white rounded-lg shadow-sm border border-gray-200 p-6',
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">₿</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Bitcoin</h2>
              <span className="text-sm text-gray-500">BTC/USD</span>
            </div>
          </div>
          
          {isRefetching && (
            <div className="flex items-center gap-1 text-blue-600">
              <LoadingSpinner size="sm" />
              <span className="text-xs">Updating...</span>
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">
            Last updated: {priceData.timestamp.toLocaleTimeString()}
          </div>
          <div className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium',
            isPositive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          )}>
            <TrendIcon className="h-4 w-4" />
            <span>{formatPercentage(priceData.changePercentage24h)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Current Price</div>
          <div className={cn(
            'text-2xl font-bold transition-all duration-500',
            priceAnimation === 'up' && 'text-green-600 scale-105',
            priceAnimation === 'down' && 'text-red-600 scale-105',
            !priceAnimation && 'text-gray-900 scale-100'
          )}>
            {formatCurrency(priceData.price)}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-gray-500 uppercase tracking-wider">24h High</div>
          <div className="text-lg font-semibold text-gray-900">
            {formatCurrency(priceData.high24h)}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-gray-500 uppercase tracking-wider">24h Low</div>
          <div className="text-lg font-semibold text-gray-900">
            {formatCurrency(priceData.low24h)}
          </div>
        </div>

        {showVolume && (
          <div className="space-y-1">
            <div className="text-xs text-gray-500 uppercase tracking-wider">24h Volume</div>
            <div className="text-lg font-semibold text-gray-900">
              ${(priceData.volume / 1e9).toFixed(2)}B
            </div>
          </div>
        )}
      </div>

      {showMarketCap && priceData.marketCap > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Market Cap</span>
            <span className="text-sm font-semibold text-gray-900">
              ${(priceData.marketCap / 1e12).toFixed(2)}T
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Minimal price display for headers/navbars
export function MiniPriceTicker({ className }: { className?: string }) {
  return (
    <PriceTicker
      className={className}
      showVolume={false}
      showMarketCap={false}
      compact={true}
    />
  );
}

// Price alert component
interface PriceAlertProps {
  targetPrice: number;
  currentPrice: number;
  onAlert: () => void;
}

export function PriceAlert({ targetPrice, currentPrice, onAlert }: PriceAlertProps) {
  const [alerted, setAlerted] = useState(false);

  useEffect(() => {
    if (!alerted && (
      (targetPrice > currentPrice && currentPrice >= targetPrice) ||
      (targetPrice < currentPrice && currentPrice <= targetPrice)
    )) {
      setAlerted(true);
      onAlert();
    }
  }, [targetPrice, currentPrice, alerted, onAlert]);

  const isAbove = currentPrice >= targetPrice;
  const difference = Math.abs(currentPrice - targetPrice);
  const percentageDiff = (difference / targetPrice) * 100;

  return (
    <div className={cn(
      'p-3 rounded-md border',
      alerted 
        ? 'bg-green-50 border-green-200 text-green-800'
        : 'bg-gray-50 border-gray-200 text-gray-600'
    )}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">
            Price Alert: {formatCurrency(targetPrice)}
          </div>
          <div className="text-xs">
            Current: {formatCurrency(currentPrice)} 
            {isAbove ? ' (Above)' : ' (Below)'} 
            ({percentageDiff.toFixed(2)}%)
          </div>
        </div>
        
        {alerted && (
          <div className="text-green-600">
            <TrendingUp className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}