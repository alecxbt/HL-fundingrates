const BASE_URL = 'https://api.hyperliquid.xyz/info';

async function post(body) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// Known HIP-3 equity DEXes
export const EQUITY_DEXES = ['xyz', 'flx', 'km', 'cash', 'vntl'];

// Returns { dex, name (e.g. "xyz:TSLA"), ticker (e.g. "TSLA"), ... } for all equity perps across all DEXes
export async function getAllEquityPerps() {
  const allMetas = await post({ type: 'allPerpMetas' });
  // allMetas is an array of DEX meta objects; each has a `universe` array
  // DEX 0 is crypto (no `:` in names), DEXes 1+ are HIP-3
  const result = [];
  for (const dexMeta of allMetas) {
    if (!dexMeta.universe) continue;
    for (const asset of dexMeta.universe) {
      if (!asset.name || !asset.name.includes(':')) continue;
      if (asset.isDelisted) continue;
      const [dex, ticker] = asset.name.split(':');
      result.push({ ...asset, dex, ticker });
    }
  }
  return result;
}

// Returns current funding rates and market data for a given DEX
export async function getDexAssetCtxs(dex) {
  const [meta, assetCtxs] = await post({ type: 'metaAndAssetCtxs', dex });
  return meta.universe.map((asset, i) => ({
    ...asset,
    ...assetCtxs[i],
    dex,
    ticker: asset.name.includes(':') ? asset.name.split(':')[1] : asset.name,
  }));
}

// Returns all equity perps with current funding rates from all DEXes
export async function getAllEquityFundingRates() {
  const results = await Promise.allSettled(
    EQUITY_DEXES.map((dex) => getDexAssetCtxs(dex))
  );
  const all = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      // Filter to only equity perps (those with `:` in name)
      all.push(...r.value.filter((a) => a.name && a.name.includes(':')));
    }
  }
  return all;
}

// Fetch historical funding rate for a single coin, paginating up to maxEntries
export async function getFundingHistory(coin, startTime, maxEntries = 2000) {
  const entries = [];
  let cursor = startTime;
  while (entries.length < maxEntries) {
    const batch = await post({ type: 'fundingHistory', coin, startTime: cursor });
    if (!batch || batch.length === 0) break;
    entries.push(...batch);
    if (batch.length < 500) break; // last page
    cursor = batch[batch.length - 1].time + 1;
  }
  return entries;
}

// Annualize an hourly funding rate to percentage
export function annualizeRate(hourlyRate) {
  return parseFloat(hourlyRate) * 24 * 365 * 100;
}

// Fetch L2 order book for a coin (e.g. "xyz:TSLA")
export async function getL2Book(coin) {
  return post({ type: 'l2Book', coin });
}

// Sum bid-side notional within pctThreshold of markPx (e.g. 0.005 = 0.5%)
export function bidDepthNear(levels, markPx, pctThreshold = 0.005) {
  if (!levels || !markPx) return 0;
  const floor = markPx * (1 - pctThreshold);
  let notional = 0;
  for (const { px, sz } of levels) {
    const price = parseFloat(px);
    const size = parseFloat(sz);
    if (price >= floor) notional += price * size;
  }
  return notional;
}

// 30-day start time in ms
export function thirtyDaysAgo() {
  return Date.now() - 30 * 24 * 60 * 60 * 1000;
}
