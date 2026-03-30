# HIP-3 Funding Rate Tracker

A real-time dashboard for tracking funding rates on [Hyperliquid](https://hyperliquid.xyz) equity perpetuals listed through HIP-3. Built to surface long spot / short perp opportunities where positive funding can be collected as yield.

## What is this for?

On Hyperliquid, HIP-3 allows third-party builders to deploy their own perpetual DEXes. These DEXes list tokenized equity perps — stocks, ETFs, commodities, and forex pairs — that trade 24/7 with funding rates that can diverge significantly from zero.

When funding is **positive**, longs pay shorts. This creates a basis trade opportunity:

- **Long the underlying spot asset** (e.g. TSLA stock)
- **Short the Hyperliquid equity perp** (e.g. `xyz:TSLA`)
- **Collect the funding rate** as yield while remaining market-neutral

This dashboard helps you find the highest-yielding opportunities across all active HIP-3 DEXes.

## Features

| Panel | Description |
|---|---|
| **Stat Cards** | At-a-glance summary: best opportunity, number of positive-funding assets, average APR, total OI |
| **Funding Rate Bar Chart** | All equity perps ranked by annualized funding rate. Green = collect, Red = pay, Amber = at floor (~5.48% APR). Click bars to add assets to the history chart. |
| **Funding History Chart** | 30-day line chart of selected assets' funding rates over time. Select up to ~10 assets for comparison. |
| **Funding Volatility Chart** | 30-day standard deviation of funding rates. High variance = more timing opportunities for entering/exiting the trade. |
| **Opportunity Table** | Top 15 assets by funding APR with mark price, 24h change, open interest, and daily volume. |

Data refreshes automatically every 60 seconds from the Hyperliquid public API.

## Getting Started

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## How to Use

1. **Scan the bar chart** — assets at the far left with the tallest green bars have the highest current funding. The amber dashed line marks the floor rate (~5.48% APR), which most assets sit at when near peg.

2. **Click bars or table rows** to select assets. This loads their 30-day funding history and variance into the charts below.

3. **Use the DEX filter** to focus on specific HIP-3 DEXes (`xyz`, `flx`, `km`, `cash`, `vntl`). The `xyz` DEX (Wagyu) has the most listings.

4. **Check the variance chart** — assets with high standard deviation have historically spiked above the floor, suggesting the current rate may not be representative. Use this alongside the history chart to judge entry timing.

5. **Evaluate the trade** — before entering, verify that a liquid spot market exists for the underlying asset and that the funding rate is stable enough to justify hedging costs.

## HIP-3 DEXes

| DEX | Operator | Assets |
|---|---|---|
| `xyz` | Wagyu.xyz | ~45 — major US equities, commodities, forex, indices |
| `flx` | Flex | ~14 |
| `km` | KM | ~19 |
| `cash` | Cash | ~14 |
| `vntl` | Ventual | ~11 — includes SPACEX, OPENAI, sector ETFs |

## Funding Rate Mechanics

- Rates are **per-hour** on Hyperliquid (not per-8-hours like most CEXes)
- **Annualized APR** = hourly rate × 24 × 365 × 100
- The **floor rate** is `0.00000625/hr` ≈ **5.48% APR** — many assets sit here when near peg
- Positive funding = perp trades at a premium to oracle; shorts are paid by longs

## Tech Stack

- [React](https://react.dev) + [Vite](https://vite.dev)
- [Recharts](https://recharts.org) for all charts
- [Tailwind CSS v4](https://tailwindcss.com)
- [Hyperliquid Info API](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api) — no API key required
