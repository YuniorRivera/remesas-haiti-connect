/**
 * FX Rates Service
 * 
 * Centralized FX rate fetching with 60s cache.
 * Single source of truth for exchange rates to avoid duplicate API calls.
 * 
 * Environment variables:
 * - VITE_FX_API_URL: Optional external FX API endpoint
 * - VITE_FX_API_KEY: Optional API key for external FX service
 * 
 * If no external API is configured, falls back to Supabase fees_matrix.
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export interface FXRates {
  dop_htg_mid: number;
  dop_htg_client: number;
  usd_dop: number;
  lastUpdated: number;
}

interface CacheEntry {
  rates: FXRates;
  expiresAt: number;
}

// In-memory cache (60 seconds TTL)
const CACHE_TTL_MS = 60 * 1000;
let cache: CacheEntry | null = null;

/**
 * Get FX rates from external API if configured, otherwise from Supabase
 */
async function fetchFromAPI(): Promise<FXRates | null> {
  const apiUrl = import.meta.env.VITE_FX_API_URL;
  const apiKey = import.meta.env.VITE_FX_API_KEY;

  if (!apiUrl) {
    return null; // No external API configured
  }

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
      // Cache for 60s at browser level too
      cache: 'default',
    });

    if (!response.ok) {
      throw new Error(`FX API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Expect API to return: { dop_htg: number, usd_dop: number, ... }
    // Adjust based on your API's response format
    return {
      dop_htg_mid: data.dop_htg || data.rate || 7.85,
      dop_htg_client: data.dop_htg_client || data.dop_htg || 7.85,
      usd_dop: data.usd_dop || 59.50,
      lastUpdated: Date.now(),
    };
  } catch (error) {
    logger.error('Error fetching FX from external API:', error);
    return null;
  }
}

/**
 * Get FX rates from Supabase fees_matrix (fallback)
 */
async function fetchFromSupabase(): Promise<FXRates> {
  try {
    // Get latest active fees matrix for any channel (they should have same mid rate)
    const { data, error } = await supabase
      .from('fees_matrix')
      .select('fx_dop_htg_mid, fx_usd_dop, spread_bps')
      .eq('corridor', 'RD->HT')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching FX from Supabase:', error);
      throw error;
    }

    if (!data) {
      // Fallback to default rates if no fees matrix exists
      logger.warn('No active fees matrix found, using default rates');
      return {
        dop_htg_mid: 7.85,
        dop_htg_client: 7.73, // ~1.5% spread
        usd_dop: 59.50,
        lastUpdated: Date.now(),
      };
    }

    const spreadPct = (data.spread_bps || 150) / 10000;
    const clientRate = data.fx_dop_htg_mid * (1 - spreadPct);

    return {
      dop_htg_mid: data.fx_dop_htg_mid,
      dop_htg_client: clientRate,
      usd_dop: data.fx_usd_dop,
      lastUpdated: Date.now(),
    };
  } catch (error) {
    logger.error('Error in fetchFromSupabase:', error);
    // Ultimate fallback
    return {
      dop_htg_mid: 7.85,
      dop_htg_client: 7.73,
      usd_dop: 59.50,
      lastUpdated: Date.now(),
    };
  }
}

/**
 * Get FX rates with 60s cache
 * 
 * @returns Promise<FXRates> Current exchange rates
 */
export async function getFXRates(): Promise<FXRates> {
  // Check cache first
  if (cache && cache.expiresAt > Date.now()) {
    logger.debug('FX rates served from cache');
    return cache.rates;
  }

  // Try external API first if configured
  const apiRates = await fetchFromAPI();
  
  // Fallback to Supabase if no API or API failed
  const rates = apiRates || await fetchFromSupabase();

  // Update cache
  cache = {
    rates,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };

  logger.debug('FX rates fetched and cached', { rates });
  return rates;
}

/**
 * Clear FX rates cache (useful for testing or forcing refresh)
 */
export function clearFXCache(): void {
  cache = null;
  logger.debug('FX cache cleared');
}

/**
 * Get cached FX rates without network request
 * Returns null if cache expired or doesn't exist
 */
export function getCachedFXRates(): FXRates | null {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.rates;
  }
  return null;
}

