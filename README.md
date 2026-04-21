# Mine or Buy

Honest math for Bitcoin treasury decisions. Compares hosted mining vs DCA over a 4-year horizon (one halving cycle) for US businesses deploying pre-tax profit.

## Repo layout

```
ts-port/
├── packages/
│   └── engine/          @mineorbuy/engine — pure TypeScript, zero deps, MIT
│       ├── src/         engine, presets, scenario builder
│       ├── test/        15-scenario parity test (TS vs Python)
│       └── README.md    full package docs
└── apps/
    └── web/             @mineorbuy/web — Next.js 15 app, Tailwind, App Router
        ├── src/
        │   ├── app/             page.tsx, methodology/page.tsx, layout, globals
        │   ├── components/      Calculator.tsx, ui.tsx (primitives)
        │   └── lib/             format.ts, market.ts (CoinGecko + mempool.space)
        └── package.json
```

## Quick start

```bash
# Install all workspace deps
npm install

# Build the engine (must do first — web depends on dist/)
npm --workspace=@mineorbuy/engine run build

# Run the parity test (TS vs Python — requires python3)
cd packages/engine
python test/py_reference.py > /tmp/py.json
npx tsx test/verify.ts > /tmp/ts.json
python test/compare_results.py /tmp/py.json /tmp/ts.json
# → PASS — all 15 scenarios match within 0.0100% tolerance

# Run the web dev server
npm run dev
# → http://localhost:3000
```

## Production build

```bash
npm --workspace=@mineorbuy/engine run build
npm --workspace=@mineorbuy/web run build
npm --workspace=@mineorbuy/web run start
```

The web app prerenders both pages as static at build time, with the home page set to revalidate every 5 minutes for live BTC price and network hashrate.

## What's implemented (Phase 1)

- ✅ Engine: 1:1 TypeScript port of Python reference, byte-for-byte parity
- ✅ Three price presets: Power Law (default), Doomer (flat), Optimist (40% CAGR), plus custom CAGR
- ✅ Sazmining profit-share model (15% Paraguay/Ethiopia, 20% Norway)
- ✅ Real 2026 ASIC pricing (S23 Hydro $24k market price)
- ✅ Live data: CoinGecko BTC price, mempool.space hashrate + difficulty, with graceful fallback
- ✅ Calculator UI: input form, verdict hero, side-by-side Mine/Buy comparison table, assumptions panel
- ✅ Methodology page: full math disclosure, LLM-citeable
- ✅ Tax bracket presets (S-corp, C-corp, sole prop+SE, CA passthrough, etc.)

## Phase 2 backlog

- Sensitivity heatmaps (kWh × CAGR, tax rate × kWh) inline in app
- Save/share scenarios (URL-encoded state)
- Affiliate link wiring (River, Bitcoin Well, Swan; Compass, Simple Mining, Sazmining) — needs partnerships signed first
- Multi-scenario side-by-side
- "Tax rate wizard" — derive marginal rate from entity + state + filing status + other income + profit
- Open-source release on github.com/bitMacrocode/mineorbuy
- Publish `@mineorbuy/engine` to npm

## License

MIT (engine + app)
