/**
 * Verification harness: runs the same 15-scenario grid as the Python reference
 * and emits compact JSON for byte-level comparison.
 *
 * Usage:
 *   npx tsx test/verify.ts > ts_results.json
 *   python test/compare_results.py py_results.json ts_results.json
 */

import { buildScenario, compare } from '../src';
import type { ScenarioOverrides } from '../src/scenario';

const SCENARIOS: Array<[string, ScenarioOverrides]> = [
  ['1. $29k Compass retail, Power Law, 28%', { pretax: 29_000 }],
  ['2. $100k Compass retail, Power Law, 28% [BASELINE]', {}],
  ['3. $100k Compass retail, FLAT, 28%', { priceModel: 'doomer' }],
  ['4. $100k Sazmining PY, Power Law, 28%', { hostingKey: 'sazmining_py' }],
  ['5. $100k Sazmining PY, FLAT, 28%', { hostingKey: 'sazmining_py', priceModel: 'doomer' }],
  ['6. $100k Sazmining Ethiopia, Power Law, 28%', { hostingKey: 'sazmining_et' }],
  ['7. $100k Sazmining Ethiopia, FLAT, 28%', { hostingKey: 'sazmining_et', priceModel: 'doomer' }],
  ['8. $100k Sazmining Norway, Power Law, 28%', { hostingKey: 'sazmining_no' }],
  ['9. $100k Simple Mining volume, Power Law, 28%', { hostingKey: 'simple_low' }],
  ['10. $100k S23 Hydro, Saz ET, Power Law, 28%', { asicKey: 's23_hydro', hostingKey: 'sazmining_et' }],
  ['11. $100k S21 XP Hydro, Saz ET, Power Law, 28%', { asicKey: 's21_xp_hydro', hostingKey: 'sazmining_et' }],
  ['12. $100k Compass, Optimist 40% CAGR, 28%', { priceModel: 'optimist' }],
  [
    '13. $500k CA passthrough 46%, Saz ET, Power Law',
    {
      pretax: 500_000,
      marginalFed: 0.37,
      marginalState: 0.093,
      effective: 0.35,
      hostingKey: 'sazmining_et',
    },
  ],
  [
    '14. $5M C-corp 27%, Saz ET, Power Law',
    {
      pretax: 5_000_000,
      marginalFed: 0.21,
      marginalState: 0.06,
      effective: 0.25,
      hostingKey: 'sazmining_et',
      entity: 'c_corp',
    },
  ],
  [
    '15. Sole prop $200k 37% + SE, Simple Mining, Power Law',
    {
      pretax: 200_000,
      marginalFed: 0.22,
      marginalState: 0.04,
      effective: 0.26,
      hostingKey: 'simple_low',
      entity: 'sole_prop',
      seTax: true,
    },
  ],
];

const results = SCENARIOS.map(([name, overrides]) => {
  const { biz, mine, buy, macro } = buildScenario(overrides);
  const r = compare(biz, mine, buy, macro);
  const m = r.mine_detail;
  const b = r.buy_detail;
  return {
    name,
    // Tight subset — enough to catch any numerical drift
    mine_units: round6(m.total_units),
    mine_capex_total: round6(m.capex_total),
    mine_tax_shield: round6(m.tax_shield),
    mine_total_th: round6(m.total_th),
    mine_cumulative_opex: round6(m.cumulative_opex_usd),
    mine_btc_stack: round8(m.btc_stack),
    mine_hardware_resale: round6(m.hardware_resale),
    mine_recapture_tax: round6(m.recapture_tax),
    mine_terminal_stack_usd: round6(m.terminal_stack_usd),
    mine_pretax_terminal: round6(m.pretax_terminal_value),
    mine_posttax_terminal: round6(m.posttax_terminal_value),
    buy_posttax_capital: round6(b.posttax_capital),
    buy_btc_stack: round8(b.btc_stack),
    buy_pretax_terminal: round6(b.pretax_terminal_value),
    buy_posttax_terminal: round6(b.posttax_terminal_value),
    btc_hurdle: round8(r.btc_hurdle),
    total_pretax_committed: round6(r.inputs.total_pretax_committed),
    winner_sats: r.winners.sats_pretax,
    winner_usd_posttax: r.winners.usd_posttax,
  };
});

console.log(JSON.stringify(results, null, 2));

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
function round8(n: number): number {
  return Math.round(n * 1e8) / 1e8;
}
