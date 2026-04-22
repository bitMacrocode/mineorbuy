# Roadmap

## v0.1 — Shipped (April 2026)
- Engine with tax shield, §1245 recapture, LTCG, Sazmining profit-share modeling
- Python reference + TypeScript port with byte-for-byte parity
- Three BTC price scenarios (Power Law, Doomer, Optimist) + custom CAGR
- Three network difficulty presets with live mempool.space signal
- Live BTC price and hashrate via CoinGecko + mempool.space
- Six US tax bracket presets covering S-corp, C-corp, sole prop, CA passthrough
- Per-host ASIC filtering
- Methodology page, source URLs, `last_verified` dates

## v0.2 — Next
- Sensitivity heatmap page (`/sensitivity`) with preset axes: kWh × CAGR, Tax × kWh, Uptime × CAGR
- URL-encoded scenario state for shareable links
- Per-host ASIC pricing (hardware prices vary by host, not universal MSRP)

## v0.3 — Later
- Tax bracket wizard (derive marginal rate from entity + state + income + filing status)
- Sazmining billing model — display derived rate with source monthly fee as secondary
- Blockware Marketplace integration (secondary-market ASICs bundled with hosting)
- Break-even solver ("what kWh rate do I need for Mine to beat Buy?")

## Phase 3 — Eventually
- Hashrate Index ASIC Price Index live pull (Premium API)
- "Paste your Sazmining / Compass / Simple contract PDF" upload and auto-fill
- Sensitivity to hosting contract early termination risk
- C-corp vs S-corp optimization wizard
