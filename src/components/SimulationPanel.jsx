import { useState, useMemo } from 'react';
import { PlayCircle, RefreshCw, FlaskConical } from 'lucide-react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import { useSimulation } from '../hooks/useSimulation';

const fmtUSD = (n) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

export function SimulationPanel({ assets, onSave }) {
  const [coin, setCoin] = useState('');
  const [positionSize, setPositionSize] = useState('10000');
  const [direction, setDirection] = useState('short');
  const [daysBack, setDaysBack] = useState(30);
  const [validationError, setValidationError] = useState('');
  const [lastRunParams, setLastRunParams] = useState(null);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const { result, loading, error, runSimulation } = useSimulation();

  const assetOptions = useMemo(
    () => [...new Set(assets.map((a) => a.name))].sort(),
    [assets]
  );

  const handleRun = () => {
    const size = parseFloat(positionSize);
    if (!coin) {
      setValidationError('Please select an asset.');
      return;
    }
    if (!size || size <= 0) {
      setValidationError('Enter a valid position size greater than $0.');
      return;
    }
    setValidationError('');
    setSavedFeedback(false);
    const params = { coin, positionSizeUSD: size, direction, daysBack };
    setLastRunParams(params);
    runSimulation(params);
  };

  // Downsample to ~500 points for chart performance
  const chartData = useMemo(() => {
    if (!result) return [];
    const series = result.pnlSeries;
    if (series.length <= 500) return series;
    const step = Math.ceil(series.length / 500);
    return series.filter((_, i) => i % step === 0);
  }, [result]);

  const posSize = parseFloat(positionSize) || 0;
  const selectedTicker = coin ? coin.split(':')[1] : '';
  const selectedDex = coin ? coin.split(':')[0] : '';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <FlaskConical size={18} className="text-purple-400" />
        <h2 className="text-white font-semibold text-base">Funding Rate Simulation</h2>
        <span className="text-gray-500 text-xs ml-1 hidden sm:block">
          Delta-neutral backtest · long spot + {direction === 'short' ? 'short' : 'long'} perp
        </span>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {/* Asset selector */}
        <div className="col-span-2 md:col-span-1">
          <label className="block text-gray-400 text-xs mb-1.5">Asset</label>
          <select
            value={coin}
            onChange={(e) => setCoin(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-600 cursor-pointer"
          >
            <option value="">Select asset...</option>
            {assetOptions.map((name) => (
              <option key={name} value={name}>
                {name.split(':')[1]} ({name.split(':')[0].toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Position size */}
        <div>
          <label className="block text-gray-400 text-xs mb-1.5">Position Size (USD)</label>
          <input
            type="number"
            value={positionSize}
            onChange={(e) => setPositionSize(e.target.value)}
            min="1"
            step="1000"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-600"
            placeholder="10000"
          />
        </div>

        {/* Direction */}
        <div>
          <label className="block text-gray-400 text-xs mb-1.5">Perp Side</label>
          <div className="flex rounded-lg overflow-hidden border border-gray-700 h-[38px]">
            <button
              onClick={() => setDirection('short')}
              className={`flex-1 text-xs font-medium transition-colors cursor-pointer ${
                direction === 'short'
                  ? 'bg-green-800/60 text-green-200'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Short (earn +FR)
            </button>
            <button
              onClick={() => setDirection('long')}
              className={`flex-1 text-xs font-medium transition-colors cursor-pointer ${
                direction === 'long'
                  ? 'bg-red-800/60 text-red-200'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Long (earn −FR)
            </button>
          </div>
        </div>

        {/* Lookback */}
        <div>
          <label className="block text-gray-400 text-xs mb-1.5">Lookback Period</label>
          <div className="flex rounded-lg overflow-hidden border border-gray-700 h-[38px]">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDaysBack(d)}
                className={`flex-1 text-xs font-medium transition-colors cursor-pointer ${
                  daysBack === d
                    ? 'bg-purple-800/60 text-purple-200'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Validation / run */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={handleRun}
          disabled={loading || !coin}
          className="flex items-center gap-2 px-5 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm text-white font-medium transition-colors cursor-pointer"
        >
          {loading
            ? <RefreshCw size={14} className="animate-spin" />
            : <PlayCircle size={14} />}
          {loading ? 'Running...' : 'Run Simulation'}
        </button>
        {validationError && (
          <span className="text-red-400 text-xs">{validationError}</span>
        )}
        {coin && posSize > 0 && (
          <span className="text-gray-500 text-xs">
            {direction === 'short' ? 'Short' : 'Long'} {fmtUSD(posSize)} {selectedTicker} perp on {selectedDex.toUpperCase()} · last {daysBack}d
          </span>
        )}
      </div>

      {/* API error */}
      {error && (
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3 text-red-300 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Summary stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <ResultCard
              label="Total P&L"
              value={fmtUSD(result.totalPnl)}
              sub={`over ${daysBack} days`}
              positive={result.totalPnl >= 0}
            />
            <ResultCard
              label="Avg Daily Earnings"
              value={fmtUSD(result.avgDailyPnl)}
              sub="per calendar day"
              positive={result.avgDailyPnl >= 0}
            />
            <ResultCard
              label="Annualized Return"
              value={`${result.annualizedReturn >= 0 ? '+' : ''}${result.annualizedReturn.toFixed(2)}%`}
              sub={`on ${fmtUSD(posSize)} position`}
              positive={result.annualizedReturn >= 0}
            />
            <ResultCard
              label="Favorable Periods"
              value={`${result.favorableRatePct.toFixed(1)}%`}
              sub="of hours funding worked for you"
              positive={result.favorableRatePct >= 50}
            />
          </div>

          {/* Add to Memo */}
          {onSave && lastRunParams && (
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => {
                  onSave({ ...lastRunParams, result, savedAt: new Date() });
                  setSavedFeedback(true);
                  setTimeout(() => setSavedFeedback(false), 2500);
                }}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                  savedFeedback
                    ? 'bg-green-800/40 border-green-700/50 text-green-300'
                    : 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-gray-200'
                }`}
              >
                {savedFeedback ? '✓ Added to memo' : '+ Add to Memo'}
              </button>
              <span className="text-gray-600 text-xs">Save this result to compile in an investment memo</span>
            </div>
          )}

          {/* Chart */}
          <div className="mb-4">
            <p className="text-gray-500 text-xs mb-2">
              Cumulative P&L (left axis, USD) vs. Funding Rate APR (right axis, %)
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="time"
                  tickFormatter={(t) => format(new Date(t), 'MMM d')}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  minTickGap={40}
                />
                <YAxis
                  yAxisId="pnl"
                  orientation="left"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 0
                      ? `$${v.toFixed(0)}`
                      : `-$${Math.abs(v).toFixed(0)}`
                  }
                  width={62}
                />
                <YAxis
                  yAxisId="rate"
                  orientation="right"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickFormatter={(v) => `${v.toFixed(1)}%`}
                  width={52}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#9ca3af', marginBottom: 4 }}
                  formatter={(value, name) => {
                    if (name === 'Cumulative P&L') return [fmtUSD(value), name];
                    return [`${value.toFixed(2)}%`, name];
                  }}
                  labelFormatter={(t) => format(new Date(t), 'MMM d, HH:mm')}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: '#9ca3af', paddingTop: 6 }}
                />
                <ReferenceLine yAxisId="pnl" y={0} stroke="#374151" strokeDasharray="4 2" />
                <Area
                  yAxisId="pnl"
                  type="monotone"
                  dataKey="cumulativePnl"
                  name="Cumulative P&L"
                  stroke={result.totalPnl >= 0 ? '#22c55e' : '#ef4444'}
                  fill={result.totalPnl >= 0 ? '#22c55e18' : '#ef444418'}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="rate"
                  type="monotone"
                  dataKey="fundingAnnualized"
                  name="Funding Rate APR"
                  stroke="#a78bfa"
                  strokeWidth={1}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Secondary stats row */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <MiniStat label="Avg Rate APR" value={`${result.avgRate.toFixed(2)}%`} />
            <MiniStat label="Rate Std Dev" value={`${result.stdDev.toFixed(2)}%`} />
            <MiniStat label="Min Rate APR" value={`${result.minRate.toFixed(2)}%`} color={result.minRate < 0 ? 'text-red-400' : 'text-gray-200'} />
            <MiniStat label="Max Rate APR" value={`${result.maxRate.toFixed(2)}%`} color="text-green-400" />
            <MiniStat label="Max Drawdown" value={fmtUSD(-result.maxDrawdown)} color="text-red-400" />
            <MiniStat label="Hourly Data Pts" value={result.totalHours.toLocaleString()} />
          </div>
        </>
      )}
    </div>
  );
}

function ResultCard({ label, value, sub, positive }) {
  return (
    <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700/40">
      <div className="text-gray-400 text-xs mb-1">{label}</div>
      <div className={`text-lg font-bold ${positive ? 'text-green-400' : 'text-red-400'}`}>
        {value}
      </div>
      <div className="text-gray-500 text-xs">{sub}</div>
    </div>
  );
}

function MiniStat({ label, value, color = 'text-gray-200' }) {
  return (
    <div className="bg-gray-800/40 rounded-lg p-2.5 text-center border border-gray-700/30">
      <div className="text-gray-500 text-xs mb-0.5">{label}</div>
      <div className={`text-sm font-medium ${color}`}>{value}</div>
    </div>
  );
}
