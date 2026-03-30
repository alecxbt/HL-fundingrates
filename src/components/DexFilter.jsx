import { EQUITY_DEXES } from '../api/hyperliquid';

export function DexFilter({ activeDexes, onChange, counts }) {
  const toggle = (dex) => {
    if (activeDexes.includes(dex)) {
      if (activeDexes.length === 1) return; // keep at least one
      onChange(activeDexes.filter((d) => d !== dex));
    } else {
      onChange([...activeDexes, dex]);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-gray-500 text-xs">DEX:</span>
      {EQUITY_DEXES.map((dex) => {
        const active = activeDexes.includes(dex);
        const count = counts?.[dex] ?? 0;
        return (
          <button
            key={dex}
            onClick={() => toggle(dex)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              active
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            {dex} {count > 0 && <span className="opacity-70">({count})</span>}
          </button>
        );
      })}
    </div>
  );
}
