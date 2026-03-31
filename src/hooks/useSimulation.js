import { useState, useCallback } from 'react';
import { getFundingHistory, annualizeRate } from '../api/hyperliquid';

export function useSimulation() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runSimulation = useCallback(async ({ coin, positionSizeUSD, direction, daysBack }) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const startTime = Date.now() - daysBack * 24 * 60 * 60 * 1000;
      const raw = await getFundingHistory(coin, startTime, 2000);

      if (!raw || raw.length === 0) {
        throw new Error('No funding history found for this asset in the selected period.');
      }

      raw.sort((a, b) => a.time - b.time);

      // direction='short': perp short receives positive funding, pays negative funding
      // direction='long': perp long pays positive funding, receives negative funding
      const dirMult = direction === 'short' ? 1 : -1;

      let cumulativePnl = 0;
      let peakPnl = 0;
      let maxDrawdown = 0;
      let favorableHours = 0;
      const pnlSeries = [];
      const rates = [];

      for (const entry of raw) {
        const hourlyRate = parseFloat(entry.fundingRate);
        const annualized = annualizeRate(hourlyRate);
        // For delta-neutral (long spot + short/long perp), price exposure cancels.
        // P&L for this 1-hour period = positionSize * hourlyRate * directionMultiplier
        const periodPnl = positionSizeUSD * hourlyRate * dirMult;

        cumulativePnl += periodPnl;
        rates.push(annualized);

        if (cumulativePnl > peakPnl) peakPnl = cumulativePnl;
        const drawdown = peakPnl - cumulativePnl;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;

        if (periodPnl > 0) favorableHours++;

        pnlSeries.push({
          time: entry.time,
          cumulativePnl,
          periodPnl,
          fundingAnnualized: annualized,
        });
      }

      const totalHours = raw.length;
      const avgDailyPnl = totalHours > 0 ? (cumulativePnl / totalHours) * 24 : 0;
      const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;
      const variance = rates.reduce((s, r) => s + (r - avgRate) ** 2, 0) / rates.length;
      const stdDev = Math.sqrt(variance);
      // Annualized return as a % of the position size
      const annualizedReturn = positionSizeUSD > 0
        ? (cumulativePnl / positionSizeUSD) * (365 / daysBack) * 100
        : 0;

      setResult({
        pnlSeries,
        totalPnl: cumulativePnl,
        avgDailyPnl,
        maxDrawdown,
        favorableRatePct: (favorableHours / totalHours) * 100,
        avgRate,
        stdDev,
        minRate: Math.min(...rates),
        maxRate: Math.max(...rates),
        annualizedReturn,
        totalHours,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, runSimulation };
}
