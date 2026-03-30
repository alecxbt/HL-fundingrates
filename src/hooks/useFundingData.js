import { useState, useEffect, useCallback } from 'react';
import { getAllEquityFundingRates, annualizeRate } from '../api/hyperliquid';

export function useFundingData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await getAllEquityFundingRates();
      const processed = raw.map((asset) => ({
        name: asset.name,
        ticker: asset.ticker,
        dex: asset.dex,
        fundingHourly: parseFloat(asset.funding || 0),
        fundingAnnualized: annualizeRate(asset.funding || 0),
        openInterest: parseFloat(asset.openInterest || 0),
        markPx: parseFloat(asset.markPx || 0),
        oraclePx: parseFloat(asset.oraclePx || 0),
        premium: parseFloat(asset.premium || 0),
        dayNtlVlm: parseFloat(asset.dayNtlVlm || 0),
        prevDayPx: parseFloat(asset.prevDayPx || 0),
        dayChange: asset.markPx && asset.prevDayPx
          ? ((parseFloat(asset.markPx) - parseFloat(asset.prevDayPx)) / parseFloat(asset.prevDayPx)) * 100
          : 0,
      }));
      setData(processed);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 60_000); // refresh every minute
    return () => clearInterval(interval);
  }, [fetch]);

  return { data, loading, error, lastUpdated, refresh: fetch };
}
