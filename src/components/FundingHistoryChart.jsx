import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { useFundingHistory } from '../hooks/useFundingHistory';

const COLORS = [
  '#60a5fa', '#34d399', '#f472b6', '#a78bfa', '#fb923c',
  '#facc15', '#38bdf8', '#4ade80', '#f87171', '#c084fc',
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey}: <span className="font-semibold">{p.value?.toFixed(2)}% APR</span>
        </p>
      ))}
    </div>
  );
}

function downsample(entries, targetPoints = 200) {
  if (entries.length <= targetPoints) return entries;
  const step = Math.ceil(entries.length / targetPoints);
  return entries.filter((_, i) => i % step === 0);
}

export function FundingHistoryChart({ selectedCoins }) {
  const { data, loading, error } = useFundingHistory(selectedCoins);

  const chartData = useMemo(() => {
    if (!selectedCoins.length || !Object.keys(data).length) return [];

    // Build a unified time series from all coins
    const timeSet = new Set();
    for (const coin of selectedCoins) {
      if (data[coin]) {
        for (const e of data[coin]) timeSet.add(e.time);
      }
    }
    const times = [...timeSet].sort((a, b) => a - b);

    // Build lookup maps
    const lookups = {};
    for (const coin of selectedCoins) {
      lookups[coin] = {};
      if (data[coin]) {
        for (const e of data[coin]) {
          lookups[coin][e.time] = e.fundingAnnualized;
        }
      }
    }

    const raw = times.map((t) => {
      const point = { time: t, label: format(new Date(t), 'MMM d HH:mm') };
      for (const coin of selectedCoins) {
        if (lookups[coin][t] !== undefined) {
          // Use ticker only as key for chart
          const ticker = coin.split(':')[1] || coin;
          point[ticker] = lookups[coin][t];
        }
      }
      return point;
    });

    return downsample(raw, 300);
  }, [data, selectedCoins]);

  if (!selectedCoins.length) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <h2 className="text-white font-semibold text-lg mb-1">Funding Rate History</h2>
        <p className="text-gray-400 text-xs mb-4">30-day history • Click bars in the chart above to add assets</p>
        <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
          Click bars in the funding rate chart above to compare assets
        </div>
      </div>
    );
  }

  const tickers = selectedCoins.map((c) => c.split(':')[1] || c);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-white font-semibold text-lg">Funding Rate History</h2>
        {loading && <span className="text-xs text-gray-500 animate-pulse">Loading...</span>}
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
      <p className="text-gray-400 text-xs mb-4">30-day annualized funding rates • Click bars to toggle assets</p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 8, right: 12, left: 12, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            interval={Math.floor(chartData.length / 6)}
          />
          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickFormatter={(v) => `${v.toFixed(0)}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
          <ReferenceLine y={0} stroke="#374151" />
          <ReferenceLine y={5.475} stroke="#f59e0b" strokeDasharray="4 2" />
          {tickers.map((ticker, i) => (
            <Line
              key={ticker}
              type="monotone"
              dataKey={ticker}
              stroke={COLORS[i % COLORS.length]}
              dot={false}
              strokeWidth={1.5}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
