// Mock stablecoin conversion service (exploratory, not production)

const ENABLE_STABLECOINS = import.meta.env.VITE_ENABLE_STABLECOINS === 'true';

export type StablecoinType = 'USDC' | 'USDT';
export type Blockchain = 'polygon' | 'bsc' | 'arbitrum';

export interface ConversionQuote {
  stablecoinType: StablecoinType;
  stablecoinAmount: number;
  htgAmount: number;
  exchangeRate: number;
  blockchain: Blockchain;
  estimatedGasFee: number;
  timestamp: string;
}

export interface ConversionRequest {
  stablecoinType: StablecoinType;
  stablecoinAmount: number;
  blockchain: Blockchain;
  recipientAddress?: string;
}

/**
 * Mock endpoint for stablecoin to HTG conversion
 * DEMONSTRATION ONLY - NOT FOR PRODUCTION USE
 */
export async function getStablecoinQuote(
  request: ConversionRequest
): Promise<ConversionQuote | null> {
  // Early return if feature is disabled
  if (!ENABLE_STABLECOINS) {
    console.warn('Stablecoins feature is disabled');
    return null;
  }

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock exchange rate (1 USDC/USDT = ~132 HTG)
  const mockExchangeRate = 132.45;
  const mockGasFee = 0.001; // Mock gas fee in stablecoin

  const quote: ConversionQuote = {
    stablecoinType: request.stablecoinType,
    stablecoinAmount: request.stablecoinAmount,
    htgAmount: request.stablecoinAmount * mockExchangeRate,
    exchangeRate: mockExchangeRate,
    blockchain: request.blockchain,
    estimatedGasFee: mockGasFee,
    timestamp: new Date().toISOString(),
  };

  console.log('[Mock] Stablecoin conversion quote:', quote);
  return quote;
}

/**
 * Mock endpoint for initiating stablecoin payment
 * DEMONSTRATION ONLY - NOT FOR PRODUCTION USE
 */
export async function initiateStablecoinPayment(
  request: ConversionRequest
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  // Early return if feature is disabled
  if (!ENABLE_STABLECOINS) {
    return {
      success: false,
      error: 'Stablecoins feature is disabled',
    };
  }

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock transaction hash
  const mockTxHash = `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`;

  console.log('[Mock] Stablecoin payment initiated:', {
    ...request,
    txHash: mockTxHash,
  });

  return {
    success: true,
    txHash: mockTxHash,
  };
}

/**
 * Check if stablecoins feature is enabled
 */
export function isStablecoinsEnabled(): boolean {
  return ENABLE_STABLECOINS;
}

