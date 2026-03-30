import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  ResponsiveContainer,
} from 'recharts';

const POSITIVE_COLOR = '#22c55e';
const NEGATIVE_COLOR = '#ef4444';
const FLOOR_COLOR = '#f59e0b';
const FLOOR_RATE = 5.475; // ~0.00000625/hr annualized

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm shadow-xl">
      <p className="font-semibold text-white mb-1">{d.ticker} <span className="text-gray-400 text-xs">({d.dex})</span></p>
      <p className="text-gray-300">Annual Rate: <span className={d.fundingAnnualized >= 0 ? 'text-green-400' : 'text-red-400'} style={{fontWeight: 600}}>{d.fundingAnnualized.toFixed(2)}%</span></p>
      <p className="text-gray-300">Hourly Rate: <span className="text-gray-200">{(d.fundingHourly * 100).toFixed(6)}%</span></p>
      <p className="text-gray-300">Mark Price: <span className="text-gray-200">${d.markPx?.toFixed(2)}</span></p>
      <p className="text-gray-300">OI: <span className="text-gray-200">${(d.openInterest * d.markPx / 1e6).toFixed(1)}M</span></p>
      <p className="text-gray-300">24h Vol: <span className="text-gray-200">${(d.dayNtlVlm / 1e6).toFixed(1)}M</span></p>
      {d.fundingAnnualized > 1 && (
        <p className="text-green-300 mt-1 text-xs border-t border-gray-700 pt-1">
          Long spot + short perp: collect {d.fundingAnnualized.toFixed(1)}% APR
        </p>
      )}
    </div>
  );
}

export function FundingBarChart({ data, onSelect, selectedCoins }) {
  const sorted = [...data].sort((a, b) => b.fundingAnnualized - a.fundingAnnualized);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-white font-semibold text-lg">Current Funding Rates</h2>
          <p className="text-gray-400 text-xs mt-0.5">Annualized • Click bars to add to history chart</p>
        </div>
        <div className="flex gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500 inline-block"></span>Positive (collect)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block"></span>Negative (pay)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400 inline-block"></span>Floor rate</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={sorted} margin={{ top: 8, right: 12, left: 12, bottom: 60 }}>
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
            label={{ value: 'APR %', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#374151" />
          <ReferenceLine
            y={FLOOR_RATE}
            stroke="#f59e0b"
            strokeDasharray="4 2"
            label={{ value: 'Floor', fill: '#f59e0b', fontSize: 10, position: 'right' }}
          />
          <Bar dataKey="fundingAnnualized" radius={[2, 2, 0, 0]} onClick={(d) => onSelect?.(d.name)}>
            {sorted.map((entry) => {
              const isSelected = selectedCoins?.includes(entry.name);
              const isFloor = Math.abs(entry.fundingAnnualized - FLOOR_RATE) < 0.01;
              let color = entry.fundingAnnualized >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR;
              if (isFloor) color = FLOOR_COLOR;
              return (
                <Cell
                  key={entry.name}
                  fill={color}
                  opacity={isSelected ? 1 : 0.75}
                  stroke={isSelected ? '#fff' : 'transparent'}
                  strokeWidth={isSelected ? 1.5 : 0}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
