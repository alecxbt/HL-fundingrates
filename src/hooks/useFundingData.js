import { useState, useEffect, useCallback } from 'react';
import { getAllEquityFundingRates, annualizeRate, getL2Book, bidDepthNear } from '../api/hyperliquid';

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
        bidDepth: 0,
      }));

      // Fetch L2 bid depth for top 15 by funding rate
      const top15 = [...processed]
        .sort((a, b) => b.fundingAnnualized - a.fundingAnnualized)
        .slice(0, 15);
      const books = await Promise.allSettled(top15.map((a) => getL2Book(a.name)));
      books.forEach((result, i) => {
        if (result.status !== 'fulfilled') return;
        const book = result.value;
        const asset = top15[i];
        const bids = book?.levels?.[0] ?? [];
        const depth = bidDepthNear(bids, asset.markPx);
        const idx = processed.findIndex((a) => a.name === asset.name);
        if (idx !== -1) processed[idx].bidDepth = depth;
      });

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
