import { useState, useMemo } from 'react';
import { RefreshCw, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { useFundingData } from './hooks/useFundingData';
import { EQUITY_DEXES } from './api/hyperliquid';
import { FundingBarChart } from './components/FundingBarChart';
import { FundingHistoryChart } from './components/FundingHistoryChart';
import { FundingVarianceChart } from './components/FundingVarianceChart';
import { OpportunityTable } from './components/OpportunityTable';
import { StatCards } from './components/StatCards';
import { DexFilter } from './components/DexFilter';
import './index.css';

export default function App() {
  const { data, loading, error, lastUpdated, refresh } = useFundingData();
  const [selectedCoins, setSelectedCoins] = useState([]);
  const [activeDexes, setActiveDexes] = useState(EQUITY_DEXES);

  const filteredData = useMemo(
    () => data.filter((d) => activeDexes.includes(d.dex)),
    [data, activeDexes]
  );

  const dexCounts = useMemo(() => {
    const counts = {};
    for (const d of data) counts[d.dex] = (counts[d.dex] || 0) + 1;
    return counts;
  }, [data]);

  const toggleCoin = (coinName) => {
    setSelectedCoins((prev) =>
      prev.includes(coinName) ? prev.filter((c) => c !== coinName) : [...prev, coinName]
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 rounded-lg p-1.5">
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl leading-none" style={{margin:0}}>HIP-3 Funding Tracker</h1>
              <p className="text-gray-400 text-xs mt-0.5">Hyperliquid equity perp funding rates</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-gray-500 text-xs hidden sm:block">
                Updated {format(lastUpdated, 'HH:mm:ss')}
              </span>
            )}
            <button
              onClick={refresh}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6 space-y-5">
        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 text-red-300 text-sm">
            Error loading data: {error} — Check CORS or API availability.
          </div>
        )}

        {/* Loading */}
        {loading && !data.length && (
          <div className="flex items-center justify-center h-48 text-gray-500">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw size={24} className="animate-spin" />
              <span className="text-sm">Loading funding rates from Hyperliquid...</span>
            </div>
          </div>
        )}

        {filteredData.length > 0 && (
          <>
            {/* Stat cards */}
            <StatCards data={filteredData} />

            {/* DEX filter + selected coin pills */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <DexFilter
                activeDexes={activeDexes}
                onChange={setActiveDexes}
                counts={dexCounts}
              />
              {selectedCoins.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-gray-500 text-xs">Selected:</span>
                  {selectedCoins.map((c) => (
                    <button
                      key={c}
                      onClick={() => toggleCoin(c)}
                      className="px-2 py-0.5 bg-blue-800/40 border border-blue-700/50 rounded text-xs text-blue-300 hover:bg-red-900/30 hover:border-red-700/50 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      {c.split(':')[1] || c} ×
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedCoins([])}
                    className="px-2 py-0.5 text-xs text-gray-500 hover:text-gray-300 cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Main bar chart */}
            <FundingBarChart
              data={filteredData}
              onSelect={toggleCoin}
              selectedCoins={selectedCoins}
            />

            {/* History + variance side by side */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <FundingHistoryChart selectedCoins={selectedCoins} />
              <FundingVarianceChart selectedCoins={selectedCoins} allData={filteredData} />
            </div>

            {/* Opportunity table */}
            <OpportunityTable
              data={filteredData}
              onSelect={toggleCoin}
              selectedCoins={selectedCoins}
            />
          </>
        )}
      </main>

      <footer className="border-t border-gray-800 px-6 py-4 mt-8">
        <div className="max-w-screen-2xl mx-auto text-center text-gray-600 text-xs">
          Data sourced from Hyperliquid public API • Rates refresh every 60s • Not financial advice
        </div>
      </footer>
    </div>
  );
}
