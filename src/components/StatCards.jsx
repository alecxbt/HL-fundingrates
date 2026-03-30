import { TrendingUp, Activity, DollarSign, Zap } from 'lucide-react';

function Card({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-start gap-3">
      <div className={`p-2 rounded-lg ${accent}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-gray-400 text-xs">{label}</p>
        <p className="text-white text-xl font-semibold mt-0.5">{value}</p>
        {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function StatCards({ data }) {
  if (!data.length) return null;

  const positive = data.filter((d) => d.fundingAnnualized > 5);
  const topRate = Math.max(...data.map((d) => d.fundingAnnualized));
  const topAsset = data.find((d) => d.fundingAnnualized === topRate);
  const totalOI = data.reduce((s, d) => s + (d.openInterest * d.markPx || 0), 0);
  const avgRate = data.reduce((s, d) => s + d.fundingAnnualized, 0) / data.length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card
        icon={Zap}
        label="Best Opportunity"
        value={`${topRate.toFixed(1)}% APR`}
        sub={topAsset ? `${topAsset.ticker} on ${topAsset.dex}` : ''}
        accent="bg-green-600"
      />
      <Card
        icon={TrendingUp}
        label="Positive Funding Assets"
        value={`${positive.length} / ${data.length}`}
        sub="above floor rate (5.48%)"
        accent="bg-blue-600"
      />
      <Card
        icon={Activity}
        label="Average Funding APR"
        value={`${avgRate.toFixed(2)}%`}
        sub="across all equity perps"
        accent="bg-purple-600"
      />
      <Card
        icon={DollarSign}
        label="Total Open Interest"
        value={`$${(totalOI / 1e6).toFixed(1)}M`}
        sub="across all DEXes"
        accent="bg-orange-600"
      />
    </div>
  );
}
