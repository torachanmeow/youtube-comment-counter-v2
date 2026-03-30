import { useState, useCallback, useEffect } from 'react';
import { fetchCurrencyInfo, fetchExchangeRates, getValidExchangeRates } from '../services/exchangeRateAPI';
import { useChatStore } from '../stores/useChatStore';
import type { CurrencyInfo } from '../types';

let isInitializing = false;

export function useExchangeRate() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exchangeRates = useChatStore((s) => s.exchangeRates);
  const currencyInfo = useChatStore((s) => s.currencyInfo);
  const setExchangeRates = useChatStore((s) => s.setExchangeRates);
  const setCurrencyInfo = useChatStore((s) => s.setCurrencyInfo);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const currency = await fetchCurrencyInfo();
      const rates = await getValidExchangeRates(currency);
      setCurrencyInfo(currency);
      setExchangeRates(rates);
      return { currency, rates };
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [setCurrencyInfo, setExchangeRates]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const currency = await fetchCurrencyInfo();
      const rates = await fetchExchangeRates(currency);
      setExchangeRates(rates);
      return rates;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [setExchangeRates]);

  useEffect(() => {
    if (Object.keys(exchangeRates).length > 0 && Object.keys(currencyInfo).length > 0) return;
    if (isInitializing) return;
    isInitializing = true;
    initialize().finally(() => { isInitializing = false; });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { exchangeRates, currencyInfo, isLoading, error, initialize, refresh } as {
    exchangeRates: Record<string, number>;
    currencyInfo: Record<string, CurrencyInfo>;
    isLoading: boolean;
    error: Error | null;
    initialize: () => Promise<{ currency: Record<string, CurrencyInfo>; rates: Record<string, number> }>;
    refresh: () => Promise<Record<string, number>>;
  };
}
