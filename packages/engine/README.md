# @mineorbuy/engine

Core calculation engine for Mine or Buy — a Bitcoin treasury decision calculator for US businesses.

Compares hosted mining vs DCA over a 4-year horizon (one halving cycle), properly accounting for Section 179 / bonus depreciation tax shield, §1245 recapture on hardware sale, LTCG on the final BTC stack, and Sazmining-style profit-share hosting models.

## Why a 4-year horizon

Mining decisions past 4 years are dominated by assumptions we can't credibly make: future ASIC efficiency, future hosting market structure, and future tax treatment. This calculator answers the question for one halving cycle. Anything beyond is the operator's call, not ours to project.

## Install

```bash
npm install @mineorbuy/engine
```

## Quick start

```typescript
import { buildScenario, compare } from '@mineorbuy/engine';

const { biz, mine, buy, macro } = buildScenario({
  pretax: 100_000,
  asicKey: 's21_xp',
  hostingKey: 'compass_retail',
  marginalFed: 0.24,
  marginalState: 0.04,
  effective: 0.22,
  priceModel: 'power_law',      // 'power_law' | 'doomer' | 'optimist' | 'cagr'
});

const result = compare(biz, mine, buy, macro);

console.log(`Mine: ${result.mine_detail.btc_stack.toFixed(4)} BTC`);
console.log(`Buy:  ${result.buy_detail.btc_stack.toFixed(4)} BTC`);
console.log(`Winner (sats): ${result.winners.sats_pretax}`);
```

## Price model presets

| Preset | Implied 4yr CAGR | Description |
|---|---|---|
| `power_law` (default) | ~25-35% | Santostasi Power Law fit — BTC continues its historical trajectory |
| `doomer` | 0% | Flat — unprecedented in BTC history, shown as stress test |
| `optimist` | 40% | Bullish but below historical 4-year windows (2017→21: 60%, 2020→24: 55%) |
| `cagr` | user-supplied | Pass your own CAGR via the `cagr` parameter |

## Hosting presets (April 2026)

Traditional hosts (profit via kWh markup, 0% BTC haircut):
- `simple_low` — Simple Mining Iowa volume tier, $0.070/kWh
- `simple_std` — Simple Mining Iowa standard, $0.080/kWh
- `compass_retail` — Compass Mining US retail, $0.078/kWh

Sazmining aligned-incentive model (low service fee + mgmt fee on mined BTC):
- `sazmining_py` — Paraguay, $0.059/kWh + 15% mgmt fee
- `sazmining_no` — Norway, $0.068/kWh + 20% mgmt fee
- `sazmining_et` — Ethiopia (GERD hydro), $0.056/kWh + 15% mgmt fee

## Methodology

See `/docs/methodology.md` in the site repo for the full math. Key assumptions:

- **Tax shield amplification**: Pre-tax CapEx commitment is multiplied by `1/(1-marginal_rate)` to represent additional miners purchased using the Section 179 / bonus depreciation refund. Under OBBBA 2025, 100% bonus depreciation is available for qualifying property placed in service after January 19, 2025.
- **Fair Buy parity**: When the Mine path is in `operating_cash` mode, the Buy path receives matching ongoing DCA equal to Mine's annual hosting opex, so both paths commit identical total pre-tax dollars.
- **Pool fee**: 2% (Luxor FPPS default).
- **Hardware resale**: Year-4 fraction of original cost per the Hashrate Index ASIC Price Index new-gen tier curve (~0.15 = 15% of original).
- **§1245 recapture**: Hardware resale proceeds taxed at marginal rate up to prior deductions.
- **LTCG**: Applied to gain above cost basis on terminal BTC stack.

## Verification

The engine is verified byte-for-byte against the Python reference implementation:

```bash
python test/py_reference.py > /tmp/py_results.json
npx tsx test/verify.ts > /tmp/ts_results.json
python test/compare_results.py /tmp/py_results.json /tmp/ts_results.json
# → PASS — all 15 scenarios match within 0.0100% tolerance
```

## License

MIT
