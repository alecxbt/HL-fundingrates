import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { useFundingHistory } from '../hooks/useFundingHistory';

function computeStats(entries) {
  if (!entries || entries.length === 0) return null;
  const rates = entries.map((e) => e.fundingAnnualized);
  const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
  const variance = rates.reduce((a, b) => a + (b - mean) ** 2, 0) / rates.length;
  const stdDev = Math.sqrt(variance);
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const positiveHours = rates.filter((r) => r > 5).length;
  const positiveRatio = positiveHours / rates.length;
  return { mean, stdDev, min, max, positiveRatio, count: rates.length };
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm shadow-xl">
      <p className="font-semibold text-white mb-1">{d.ticker}</p>
      <p className="text-gray-300">Std Dev: <span className="text-blue-400 font-semibold">{d.stdDev?.toFixed(2)}%</span></p>
      <p className="text-gray-300">Mean APR: <span className={d.mean >= 5 ? 'text-green-400' : 'text-gray-200'} style={{fontWeight:600}}>{d.mean?.toFixed(2)}%</span></p>
      <p className="text-gray-300">Max APR: <span className="text-gray-200">{d.max?.toFixed(1)}%</span></p>
      <p className="text-gray-300">Min APR: <span className="text-gray-200">{d.min?.toFixed(1)}%</span></p>
      <p className="text-gray-300">% Time Positive: <span className="text-green-400">{(d.positiveRatio * 100).toFixed(0)}%</span></p>
    </div>
  );
}

export function FundingVarianceChart({ selectedCoins, allData }) {
  // Use top 10 by current funding rate if no selection, else selected
  const coinsToShow = useMemo(() => {
    if (selectedCoins.length > 0) return selectedCoins;
    return [...allData]
      .sort((a, b) => b.fundingAnnualized - a.fundingAnnualized)
      .slice(0, 10)
      .map((a) => a.name);
  }, [selectedCoins, allData]);

  const { data, loading } = useFundingHistory(coinsToShow);

  const chartData = useMemo(() => {
    return coinsToShow.map((coin) => {
      const stats = computeStats(data[coin]);
      const ticker = coin.split(':')[1] || coin;
      return { ticker, coin, ...stats };
    }).filter((d) => d.stdDev !== undefined);
  }, [data, coinsToShow]);

  const sorted = [...chartData].sort((a, b) => b.stdDev - a.stdDev);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-white font-semibold text-lg">Funding Rate Volatility (30d)</h2>
        {loading && <span className="text-xs text-gray-500 animate-pulse">Loading...</span>}
      </div>
      <p className="text-gray-400 text-xs mb-4">Standard deviation of annualized funding rate • High variance = more opportunities</p>
      {sorted.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
          {loading ? 'Computing variance...' : 'No data yet'}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={sorted} margin={{ top: 8, right: 12, left: 12, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="ticker"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickFormatter={(v) => `${v.toFixed(0)}%`}
              label={{ value: 'Std Dev %', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="stdDev" radius={[2, 2, 0, 0]}>
              {sorted.map((entry, i) => (
                <Cell
                  key={entry.coin}
                  fill={entry.mean >= 5 ? '#60a5fa' : '#6b7280'}
                  opacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
