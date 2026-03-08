import { EXCHANGE_RATE_API_URL, EXCHANGE_RATE_CACHE_DURATION, STORAGE_KEYS } from '../utils/constants';
import type { CurrencyInfo } from '../types';

export async function fetchCurrencyInfo(): Promise<Record<string, CurrencyInfo>> {
  try {
    const base = import.meta.env.BASE_URL || '/';
    const res = await fetch(`${base}currencyInfo.json`);
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

async function fetchApiRates(): Promise<Record<string, number>> {
  const res = await fetch(EXCHANGE_RATE_API_URL);
  if (!res.ok) throw new Error(`為替レートAPI エラー: ${res.status}`);
  const data = await res.json();
  if (!data.rates) throw new Error('為替レートAPIのレスポンスが不正です');
  return data.rates;
}

export async function fetchExchangeRates(
  currencyInfo: Record<string, CurrencyInfo>,
): Promise<Record<string, number>> {
  const apiRates = await fetchApiRates();
  const allowed = new Set(Object.keys(currencyInfo));
  const rates = Object.fromEntries(
    Object.entries(apiRates).filter(([code]) => allowed.has(code)),
  );

  localStorage.setItem(
    STORAGE_KEYS.EXCHANGE_RATE,
    JSON.stringify({ exchangeRates: rates, timestamp: Date.now() }),
  );

  return rates;
}

export async function getValidExchangeRates(
  currencyInfo: Record<string, CurrencyInfo>,
): Promise<Record<string, number>> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.EXCHANGE_RATE);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.timestamp >= Date.now() - EXCHANGE_RATE_CACHE_DURATION) {
        return parsed.exchangeRates;
      }
    }
  } catch {
    // cache invalid, fetch fresh
  }

  return fetchExchangeRates(currencyInfo);
}
