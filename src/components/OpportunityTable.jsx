import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function DayChangeBadge({ pct }) {
  if (Math.abs(pct) < 0.05) return <span className="text-gray-500">—</span>;
  if (pct > 0) return <span className="text-green-400 flex items-center gap-0.5"><TrendingUp size={12}/>{pct.toFixed(2)}%</span>;
  return <span className="text-red-400 flex items-center gap-0.5"><TrendingDown size={12}/>{pct.toFixed(2)}%</span>;
}

function FundingBadge({ rate }) {
  const cls = rate > 10
    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
    : rate > 5
    ? 'bg-green-900/30 text-green-400 border border-green-800/50'
    : rate < 0
    ? 'bg-red-900/30 text-red-400 border border-red-800/50'
    : 'bg-gray-800 text-gray-400 border border-gray-700';
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${cls}`}>
      {rate.toFixed(2)}%
    </span>
  );
}

export function OpportunityTable({ data, onSelect, selectedCoins }) {
  const sorted = [...data].sort((a, b) => b.fundingAnnualized - a.fundingAnnualized);
  const top = sorted.slice(0, 15);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-white font-semibold text-lg">Top Opportunities</h2>
          <p className="text-gray-400 text-xs mt-0.5">Ranked by annualized funding rate • Long spot / short perp • Bid Depth = resting bids within 0.5% of mark</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-800">
              <th className="text-left pb-2 font-medium">Asset</th>
              <th className="text-left pb-2 font-medium">DEX</th>
              <th className="text-right pb-2 font-medium">Funding APR</th>
              <th className="text-right pb-2 font-medium">Hourly</th>
              <th className="text-right pb-2 font-medium">Mark Price</th>
              <th className="text-right pb-2 font-medium">24h Change</th>
              <th className="text-right pb-2 font-medium">OI ($M)</th>
              <th className="text-right pb-2 font-medium">Vol ($M)</th>
              <th className="text-right pb-2 font-medium" title="Resting bid notional within 0.5% of mark price — approx. capital you can deploy short">Bid Depth</th>
            </tr>
          </thead>
          <tbody>
            {top.map((asset) => {
              const isSelected = selectedCoins?.includes(asset.name);
              return (
                <tr
                  key={asset.name}
                  className={`border-b border-gray-800/50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-900/20' : 'hover:bg-gray-800/40'
                  }`}
                  onClick={() => onSelect?.(asset.name)}
                >
                  <td className="py-2 font-semibold text-white">{asset.ticker}</td>
                  <td className="py-2 text-gray-500 text-xs">{asset.dex}</td>
                  <td className="py-2 text-right">
                    <FundingBadge rate={asset.fundingAnnualized} />
                  </td>
                  <td className="py-2 text-right font-mono text-gray-400 text-xs">
                    {(asset.fundingHourly * 100).toFixed(6)}%
                  </td>
                  <td className="py-2 text-right text-gray-200">
                    {asset.markPx > 0 ? `$${asset.markPx.toFixed(2)}` : '—'}
                  </td>
                  <td className="py-2 text-right">
                    <DayChangeBadge pct={asset.dayChange} />
                  </td>
                  <td className="py-2 text-right text-gray-400">
                    {asset.openInterest > 0 && asset.markPx > 0
                      ? (asset.openInterest * asset.markPx / 1e6).toFixed(2)
                      : '—'}
                  </td>
                  <td className="py-2 text-right text-gray-400">
                    {asset.dayNtlVlm > 0 ? (asset.dayNtlVlm / 1e6).toFixed(2) : '—'}
                  </td>
                  <td className="py-2 text-right">
                    {asset.bidDepth > 0 ? (
                      <span className="font-mono text-xs text-cyan-400">
                        ${asset.bidDepth >= 1e6
                          ? `${(asset.bidDepth / 1e6).toFixed(2)}M`
                          : asset.bidDepth >= 1e3
                          ? `${(asset.bidDepth / 1e3).toFixed(1)}K`
                          : asset.bidDepth.toFixed(0)}
                      </span>
                    ) : <span className="text-gray-600">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
