import { useState, useEffect } from 'react';
import { getFundingHistory, annualizeRate, thirtyDaysAgo } from '../api/hyperliquid';

export function useFundingHistory(coins) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!coins || coins.length === 0) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const startTime = thirtyDaysAgo();

    Promise.allSettled(
      coins.map((coin) =>
        getFundingHistory(coin, startTime).then((entries) => ({
          coin,
          entries: entries.map((e) => ({
            time: e.time,
            fundingAnnualized: annualizeRate(e.fundingRate),
            premium: parseFloat(e.premium),
          })),
        }))
      )
    ).then((results) => {
      if (cancelled) return;
      const map = {};
      for (const r of results) {
        if (r.status === 'fulfilled') {
          map[r.value.coin] = r.value.entries;
        }
      }
      setData(map);
      setLoading(false);
    }).catch((e) => {
      if (!cancelled) {
        setError(e.message);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [coins.join(',')]);

  return { data, loading, error };
}
