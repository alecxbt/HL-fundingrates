import { useMemo } from 'react';
import { BookOpen, Download, FileText, X } from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────

const fmtUSD = (n) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

function buildSvgChart(pnlSeries, width = 640, height = 160) {
  const step = Math.ceil(pnlSeries.length / 200);
  const pts = pnlSeries.filter((_, i) => i % step === 0);
  if (pts.length < 2) return '<svg></svg>';

  const PAD = { top: 18, right: 16, bottom: 28, left: 62 };
  const iW = width - PAD.left - PAD.right;
  const iH = height - PAD.top - PAD.bottom;
  const vals = pts.map((p) => p.cumulativePnl);
  const minV = Math.min(0, ...vals);
  const maxV = Math.max(0, ...vals);
  const rng = maxV - minV || 1;

  const sx = (i) => (PAD.left + (i / (pts.length - 1)) * iW).toFixed(1);
  const sy = (v) => (PAD.top + ((maxV - v) / rng) * iH).toFixed(1);
  const z = sy(0);
  const color = vals[vals.length - 1] >= 0 ? '#16a34a' : '#dc2626';

  const linePts = pts.map((p, i) => `${sx(i)},${sy(p.cumulativePnl)}`).join(' ');
  const areaPts = [
    `${sx(0)},${z}`,
    ...pts.map((p, i) => `${sx(i)},${sy(p.cumulativePnl)}`),
    `${sx(pts.length - 1)},${z}`,
  ].join(' ');

  const yTicks = [minV, maxV];
  if (minV < 0 && maxV > 0) yTicks.push(0);
  const yTicksSvg = yTicks
    .map((v) => {
      const label = v >= 0 ? `$${Math.round(v)}` : `-$${Math.round(Math.abs(v))}`;
      return `<text x="${PAD.left - 4}" y="${parseFloat(sy(v)) + 4}" text-anchor="end" font-size="9" fill="#6b7280">${label}</text>`;
    })
    .join('');

  const xIdxs = [0, Math.floor(pts.length / 2), pts.length - 1];
  const xLabelsSvg = xIdxs
    .map((i) => {
      const label = new Date(pts[i].time).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return `<text x="${sx(i)}" y="${PAD.top + iH + 16}" text-anchor="middle" font-size="9" fill="#6b7280">${label}</text>`;
    })
    .join('');

  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="font-family:sans-serif;display:block">
  <rect width="${width}" height="${height}" fill="white"/>
  <line x1="${PAD.left}" y1="${PAD.top}" x2="${PAD.left}" y2="${PAD.top + iH}" stroke="#e5e7eb" stroke-width="1"/>
  <line x1="${PAD.left}" y1="${PAD.top + iH}" x2="${PAD.left + iW}" y2="${PAD.top + iH}" stroke="#e5e7eb" stroke-width="1"/>
  <line x1="${PAD.left}" y1="${z}" x2="${PAD.left + iW}" y2="${z}" stroke="#9ca3af" stroke-width="1" stroke-dasharray="3,2"/>
  <polygon points="${areaPts}" fill="${color}" fill-opacity="0.12"/>
  <polyline points="${linePts}" fill="none" stroke="${color}" stroke-width="1.5"/>
  ${yTicksSvg}
  ${xLabelsSvg}
</svg>`;
}

function generateMemoHTML(backtests) {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalPnl = backtests.reduce((s, b) => s + b.result.totalPnl, 0);
  const avgAnnReturn =
    backtests.reduce((s, b) => s + b.result.annualizedReturn, 0) / backtests.length;
  const avgFavorable =
    backtests.reduce((s, b) => s + b.result.favorableRatePct, 0) / backtests.length;
  const avgStdDev =
    backtests.reduce((s, b) => s + b.result.stdDev, 0) / backtests.length;

  const sign = (n) => (n >= 0 ? '+' : '');
  const posColor = (n) => (n >= 0 ? '#16a34a' : '#dc2626');

  const tableRows = backtests
    .map((bt, i) => {
      const ticker = bt.coin.split(':')[1];
      const dex = bt.coin.split(':')[0].toUpperCase();
      const r = bt.result;
      return `<tr style="background:${i % 2 === 0 ? '#f9fafb' : 'white'}">
        <td>${ticker}</td>
        <td>${dex}</td>
        <td style="text-align:right">$${Number(bt.positionSizeUSD).toLocaleString()}</td>
        <td>${bt.direction === 'short' ? 'Short' : 'Long'} perp</td>
        <td style="text-align:right">${bt.daysBack}d</td>
        <td style="text-align:right;color:${posColor(r.totalPnl)};font-weight:600">${fmtUSD(r.totalPnl)}</td>
        <td style="text-align:right;color:${posColor(r.annualizedReturn)};font-weight:600">${sign(r.annualizedReturn)}${r.annualizedReturn.toFixed(1)}%</td>
        <td style="text-align:right">${r.favorableRatePct.toFixed(1)}%</td>
        <td style="text-align:right">${r.avgRate.toFixed(2)}%</td>
        <td style="text-align:right">${r.stdDev.toFixed(2)}%</td>
        <td style="text-align:right;color:#dc2626">${fmtUSD(-r.maxDrawdown)}</td>
      </tr>`;
    })
    .join('');

  const detailSections = backtests
    .map((bt) => {
      const ticker = bt.coin.split(':')[1];
      const dex = bt.coin.split(':')[0].toUpperCase();
      const r = bt.result;
      const chart = buildSvgChart(r.pnlSeries);
      return `
    <div style="margin-bottom:32px;page-break-inside:avoid">
      <h3 style="margin:0 0 6px;font-size:15px;color:#111">${ticker} <span style="font-size:12px;font-weight:400;color:#6b7280">${dex} · ${bt.direction === 'short' ? 'Short' : 'Long'} Perp · $${Number(bt.positionSizeUSD).toLocaleString()} · ${bt.daysBack}d lookback</span></h3>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:10px">
        <div style="border:1px solid #e5e7eb;padding:10px;border-radius:6px">
          <div style="font-size:10px;color:#9ca3af;margin-bottom:2px">Total P&L</div>
          <div style="font-size:16px;font-weight:700;color:${posColor(r.totalPnl)}">${fmtUSD(r.totalPnl)}</div>
        </div>
        <div style="border:1px solid #e5e7eb;padding:10px;border-radius:6px">
          <div style="font-size:10px;color:#9ca3af;margin-bottom:2px">Ann. Return</div>
          <div style="font-size:16px;font-weight:700;color:${posColor(r.annualizedReturn)}">${sign(r.annualizedReturn)}${r.annualizedReturn.toFixed(2)}%</div>
        </div>
        <div style="border:1px solid #e5e7eb;padding:10px;border-radius:6px">
          <div style="font-size:10px;color:#9ca3af;margin-bottom:2px">Avg Daily</div>
          <div style="font-size:16px;font-weight:700;color:${posColor(r.avgDailyPnl)}">${fmtUSD(r.avgDailyPnl)}</div>
        </div>
        <div style="border:1px solid #e5e7eb;padding:10px;border-radius:6px">
          <div style="font-size:10px;color:#9ca3af;margin-bottom:2px">Favorable %</div>
          <div style="font-size:16px;font-weight:700;color:#374151">${r.favorableRatePct.toFixed(1)}%</div>
        </div>
        <div style="border:1px solid #e5e7eb;padding:10px;border-radius:6px">
          <div style="font-size:10px;color:#9ca3af;margin-bottom:2px">Max Drawdown</div>
          <div style="font-size:16px;font-weight:700;color:#dc2626">${fmtUSD(-r.maxDrawdown)}</div>
        </div>
      </div>
      <div style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden">
        ${chart}
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px;font-size:11px;color:#6b7280">
        <span>Avg Rate APR: <strong style="color:#374151">${r.avgRate.toFixed(2)}%</strong></span>
        <span>Rate Std Dev: <strong style="color:#374151">${r.stdDev.toFixed(2)}%</strong></span>
        <span>Min Rate: <strong style="color:#374151">${r.minRate.toFixed(2)}%</strong></span>
        <span>Max Rate: <strong style="color:#374151">${r.maxRate.toFixed(2)}%</strong></span>
      </div>
    </div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>HIP-3 Funding Rate Strategy — Investment Memo</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; margin: 0; padding: 0; background: white; }
    .page { max-width: 900px; margin: 0 auto; padding: 48px 40px; }
    h1 { font-size: 26px; margin: 0 0 4px; }
    h2 { font-size: 16px; color: #374151; margin: 32px 0 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
    h3 { font-size: 15px; margin: 0 0 8px; }
    p { font-size: 13px; color: #4b5563; line-height: 1.6; margin: 0 0 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 0; }
    th { background: #f3f4f6; border: 1px solid #e5e7eb; padding: 7px 10px; text-align: left; font-weight: 600; font-size: 11px; color: #374151; }
    td { border: 1px solid #e5e7eb; padding: 7px 10px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin: 14px 0; }
    .summary-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
    .summary-label { font-size: 11px; color: #9ca3af; margin-bottom: 4px; }
    .summary-value { font-size: 22px; font-weight: 700; }
    .summary-sub { font-size: 10px; color: #9ca3af; margin-top: 2px; }
    .print-btn { display: inline-flex; align-items: center; gap: 6px; background: #1d4ed8; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; margin-bottom: 32px; }
    .print-btn:hover { background: #1e40af; }
    .disclaimer { font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 32px; }
    @media print {
      .print-btn { display: none !important; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="page">
    <button class="print-btn" onclick="window.print()">&#x1F4BE; Save as PDF / Print</button>

    <div style="border-bottom:2px solid #111;padding-bottom:16px;margin-bottom:20px">
      <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Investment Memo</div>
      <h1>HIP-3 Equity Perp Funding Rate Strategy</h1>
      <div style="font-size:13px;color:#6b7280;margin-top:4px">Prepared ${date} · Hyperliquid HIP-3 Equity Perpetuals · Delta-Neutral Funding Capture</div>
    </div>

    <h2>Strategy Overview</h2>
    <p>This memo presents backtested results of a delta-neutral funding rate capture strategy applied to HIP-3 equity perpetual contracts on Hyperliquid. The strategy involves simultaneously holding a long spot position and a short perpetual position (or long perpetual when funding is negative) in the same underlying equity. By remaining market-neutral, price exposure is eliminated and the portfolio earns the net funding rate paid between longs and shorts.</p>
    <p>HIP-3 equity perpetuals are tokenized representations of real-world equity prices, traded on Hyperliquid's decentralized order book. Funding rates are set algorithmically based on the spread between the perpetual mark price and the oracle price. Elevated funding rates — often observed during periods of high market demand — represent a predictable yield that can be captured through this strategy.</p>

    <h2>Portfolio Summary — ${backtests.length} Backtest${backtests.length !== 1 ? 's' : ''}</h2>
    <div class="summary-grid">
      <div class="summary-box">
        <div class="summary-label">Combined Simulated P&L</div>
        <div class="summary-value" style="color:${posColor(totalPnl)}">${fmtUSD(totalPnl)}</div>
        <div class="summary-sub">across all positions</div>
      </div>
      <div class="summary-box">
        <div class="summary-label">Avg Annualized Return</div>
        <div class="summary-value" style="color:${posColor(avgAnnReturn)}">${sign(avgAnnReturn)}${avgAnnReturn.toFixed(1)}%</div>
        <div class="summary-sub">avg across ${backtests.length} backtest${backtests.length !== 1 ? 's' : ''}</div>
      </div>
      <div class="summary-box">
        <div class="summary-label">Avg Favorable Rate %</div>
        <div class="summary-value" style="color:#374151">${avgFavorable.toFixed(1)}%</div>
        <div class="summary-sub">of hours funding worked in our favor</div>
      </div>
      <div class="summary-box">
        <div class="summary-label">Avg Rate Std Dev</div>
        <div class="summary-value" style="color:#374151">${avgStdDev.toFixed(2)}%</div>
        <div class="summary-sub">annualized rate volatility (APR pts)</div>
      </div>
    </div>

    <h2>Backtest Comparison</h2>
    <table>
      <thead>
        <tr>
          <th>Asset</th><th>DEX</th><th style="text-align:right">Size</th><th>Direction</th>
          <th style="text-align:right">Period</th><th style="text-align:right">Total P&L</th>
          <th style="text-align:right">Ann. Return</th><th style="text-align:right">Favorable%</th>
          <th style="text-align:right">Avg Rate</th><th style="text-align:right">Std Dev</th>
          <th style="text-align:right">Max Drawdown</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>

    <h2>Individual Backtest Detail</h2>
    ${detailSections}

    <div class="disclaimer">
      This memo was generated by HIP-3 Funding Tracker using publicly available data from the Hyperliquid API.
      Backtest results are simulated and assume zero transaction costs, zero slippage, and continuous position holding.
      Past backtest performance does not guarantee future results. This is not financial advice.
      Generated ${date}.
    </div>
  </div>
</body>
</html>`;
}

function exportAsPDF(backtests) {
  const html = generateMemoHTML(backtests);
  const win = window.open('', '_blank');
  if (!win) {
    alert('Pop-up blocked. Please allow pop-ups for this page to export the memo.');
    return;
  }
  win.document.write(html);
  win.document.close();
}

function exportAsCSV(backtests) {
  const headers = [
    'Asset', 'DEX', 'Direction', 'Position USD', 'Days Back',
    'Total PnL', 'Avg Daily PnL', 'Ann Return %', 'Favorable %',
    'Avg Rate %', 'Rate Std Dev %', 'Min Rate %', 'Max Rate %',
    'Max Drawdown', 'Data Points', 'Saved At',
  ];
  const rows = backtests.map((bt) => {
    const r = bt.result;
    return [
      bt.coin.split(':')[1],
      bt.coin.split(':')[0].toUpperCase(),
      bt.direction === 'short' ? 'Short Perp' : 'Long Perp',
      bt.positionSizeUSD,
      bt.daysBack,
      r.totalPnl.toFixed(2),
      r.avgDailyPnl.toFixed(2),
      r.annualizedReturn.toFixed(2),
      r.favorableRatePct.toFixed(1),
      r.avgRate.toFixed(2),
      r.stdDev.toFixed(2),
      r.minRate.toFixed(2),
      r.maxRate.toFixed(2),
      (-r.maxDrawdown).toFixed(2),
      r.totalHours,
      new Date(bt.savedAt).toISOString(),
    ];
  });

  const csv = [headers, ...rows]
    .map((row) => row.map((v) => (String(v).includes(',') ? `"${v}"` : v)).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hip3-backtests-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MemoPanel({ backtests, onRemove }) {
  const agg = useMemo(() => {
    if (!backtests.length) return null;
    const totalPnl = backtests.reduce((s, b) => s + b.result.totalPnl, 0);
    const avgAnnReturn = backtests.reduce((s, b) => s + b.result.annualizedReturn, 0) / backtests.length;
    const avgFavorable = backtests.reduce((s, b) => s + b.result.favorableRatePct, 0) / backtests.length;
    const avgStdDev = backtests.reduce((s, b) => s + b.result.stdDev, 0) / backtests.length;
    return { totalPnl, avgAnnReturn, avgFavorable, avgStdDev };
  }, [backtests]);

  if (!backtests.length) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-blue-400" />
          <h2 className="text-white font-semibold text-base">Investment Memo</h2>
          <span className="text-gray-500 text-xs ml-1">
            {backtests.length} saved backtest{backtests.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportAsCSV(backtests)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-gray-300 transition-colors cursor-pointer"
          >
            <FileText size={13} />
            Export CSV
          </button>
          <button
            onClick={() => exportAsPDF(backtests)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 border border-blue-600 rounded-lg text-xs text-white font-medium transition-colors cursor-pointer"
          >
            <Download size={13} />
            Export PDF Memo
          </button>
        </div>
      </div>

      {/* Aggregate stats */}
      {agg && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <AggCard
            label="Combined P&L"
            value={fmtUSD(agg.totalPnl)}
            sub="across all positions"
            positive={agg.totalPnl >= 0}
          />
          <AggCard
            label="Avg Annualized Return"
            value={`${agg.avgAnnReturn >= 0 ? '+' : ''}${agg.avgAnnReturn.toFixed(1)}%`}
            sub={`avg across ${backtests.length} backtests`}
            positive={agg.avgAnnReturn >= 0}
          />
          <AggCard
            label="Avg Favorable Rate"
            value={`${agg.avgFavorable.toFixed(1)}%`}
            sub="of hours funding in your favor"
            positive={agg.avgFavorable >= 50}
          />
          <AggCard
            label="Avg Rate Std Dev"
            value={`${agg.avgStdDev.toFixed(2)}%`}
            sub="annualized rate volatility"
            positive={null}
          />
        </div>
      )}

      {/* Comparison table */}
      <div className="mb-5 overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-700">
              {['Asset', 'DEX', 'Direction', 'Size', 'Period', 'Total P&L', 'Ann. Return', 'Favorable%', 'Avg Rate', 'Std Dev', 'Max DD', ''].map(
                (h) => (
                  <th key={h} className="text-left text-gray-500 font-medium py-2 px-2 first:pl-0 whitespace-nowrap">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {backtests.map((bt, i) => {
              const r = bt.result;
              const ticker = bt.coin.split(':')[1];
              const dex = bt.coin.split(':')[0].toUpperCase();
              return (
                <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/30">
                  <td className="py-2 px-2 pl-0 text-gray-200 font-medium">{ticker}</td>
                  <td className="py-2 px-2 text-gray-400">{dex}</td>
                  <td className="py-2 px-2 text-gray-400">{bt.direction === 'short' ? 'Short' : 'Long'}</td>
                  <td className="py-2 px-2 text-gray-400">${Number(bt.positionSizeUSD).toLocaleString()}</td>
                  <td className="py-2 px-2 text-gray-400">{bt.daysBack}d</td>
                  <td className={`py-2 px-2 font-semibold ${r.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {fmtUSD(r.totalPnl)}
                  </td>
                  <td className={`py-2 px-2 font-semibold ${r.annualizedReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {r.annualizedReturn >= 0 ? '+' : ''}{r.annualizedReturn.toFixed(1)}%
                  </td>
                  <td className="py-2 px-2 text-gray-300">{r.favorableRatePct.toFixed(1)}%</td>
                  <td className="py-2 px-2 text-gray-300">{r.avgRate.toFixed(2)}%</td>
                  <td className="py-2 px-2 text-gray-400">{r.stdDev.toFixed(2)}%</td>
                  <td className="py-2 px-2 text-red-400">{fmtUSD(-r.maxDrawdown)}</td>
                  <td className="py-2 px-2">
                    <button
                      onClick={() => onRemove(i)}
                      className="text-gray-600 hover:text-red-400 transition-colors cursor-pointer"
                      title="Remove from memo"
                    >
                      <X size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Individual mini-cards */}
      <div className="space-y-3">
        {backtests.map((bt, i) => {
          const r = bt.result;
          const ticker = bt.coin.split(':')[1];
          const dex = bt.coin.split(':')[0].toUpperCase();
          return (
            <div key={i} className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">
                  {ticker}
                  <span className="text-gray-500 text-xs font-normal ml-2">
                    {dex} · {bt.direction === 'short' ? 'Short' : 'Long'} · ${Number(bt.positionSizeUSD).toLocaleString()} · {bt.daysBack}d
                  </span>
                </span>
                <div className="flex items-center gap-3 text-xs">
                  <span className={r.totalPnl >= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                    {fmtUSD(r.totalPnl)}
                  </span>
                  <span className={r.annualizedReturn >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {r.annualizedReturn >= 0 ? '+' : ''}{r.annualizedReturn.toFixed(1)}% ann.
                  </span>
                  <span className="text-gray-500">{r.favorableRatePct.toFixed(0)}% favorable</span>
                </div>
              </div>
              {/* Mini rate bar */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Avg rate {r.avgRate.toFixed(2)}%</span>
                <span>·</span>
                <span>±{r.stdDev.toFixed(2)}% σ</span>
                <span>·</span>
                <span>Max DD {fmtUSD(-r.maxDrawdown)}</span>
                <span>·</span>
                <span>{r.totalHours} hourly pts</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AggCard({ label, value, sub, positive }) {
  const colorClass =
    positive === null ? 'text-gray-200' : positive ? 'text-green-400' : 'text-red-400';
  return (
    <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700/40">
      <div className="text-gray-400 text-xs mb-1">{label}</div>
      <div className={`text-lg font-bold ${colorClass}`}>{value}</div>
      <div className="text-gray-500 text-xs">{sub}</div>
    </div>
  );
}
