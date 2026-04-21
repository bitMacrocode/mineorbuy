/**
 * @mineorbuy/engine — Mine or Buy calculator core engine
 *
 * Pure TypeScript, zero dependencies. Runs in browser or Node.
 * 1:1 port of mine_or_buy_engine.py v5.
 *
 * Scope: 4-year (one halving cycle) comparison of MINERS + OPS vs LUMP + DCA
 * for a US business deploying pre-tax profit into BTC.
 *
 * License: MIT
 */

// =============================================================================
// CONSTANTS
// =============================================================================

export const BLOCKS_PER_DAY = 144;
export const DAYS_PER_MONTH = 30.4375;
export const BLOCKS_PER_MONTH = BLOCKS_PER_DAY * DAYS_PER_MONTH;
export const HOURS_PER_MONTH = 24 * DAYS_PER_MONTH;

export const HALVING_SCHEDULE: ReadonlyArray<readonly [number, number]> = [
  [2024 + 4 / 12, 3.125],
  [2028 + 4 / 12, 1.5625],
  [2032 + 4 / 12, 0.78125],
];

export const DEFAULT_BTC_PRICE = 75_071.0;
export const DEFAULT_NETWORK_EH = 870.0;
export const DEFAULT_FEE_SHARE = 0.03;

export const DIFFICULTY_PRESETS = {
  conservative: { y1: 0.05, terminal: 0.03 },
  moderate: { y1: 0.15, terminal: 0.08 },
  aggressive: { y1: 0.25, terminal: 0.12 },
} as const;

export type DifficultyPreset = keyof typeof DIFFICULTY_PRESETS;

/**
 * UI-facing difficulty presets with coaching copy. Maps human-readable labels
 * to the existing DIFFICULTY_PRESETS numerical buckets.
 */
export const DIFFICULTY_UI_PRESETS = {
  cycle_trough: {
    key: 'conservative' as const,
    label: 'Cycle Trough',
    tagline: '+5% → +3% / yr',
    description:
      'Mid or late-cycle slowdown, similar to mid-2022 or the post-halving stretch of 2025. ' +
      'Hashrate grows slowly as existing fleets hold market share and next-gen ASIC ramp-up ' +
      'is still limited. Pick this if current retarget trend is near-zero or negative.',
  },
  baseline: {
    key: 'moderate' as const,
    label: 'Baseline',
    tagline: '+15% → +8% / yr',
    description:
      'Moderate forward growth consistent with steady-state periods between major hashrate ' +
      'events. The default assumption when no clear acceleration or slowdown signal is ' +
      'visible in recent retargets.',
  },
  hashrate_race: {
    key: 'aggressive' as const,
    label: 'Hashrate Race',
    tagline: '+25% → +12% / yr',
    description:
      'Aggressive new-capacity buildout, similar to 2023-2024 after the S19 XP cycle drove ' +
      'widespread fleet upgrades. Pick this if you expect competitors to deploy faster than ' +
      'the base case — or if recent retargets have been running hot.',
  },
} as const;

export type DifficultyUIKey = keyof typeof DIFFICULTY_UI_PRESETS;

export const HORIZON_YEARS = 4;

// =============================================================================
// PRICE PRESETS
// =============================================================================

export const PRICE_PRESETS = {
  power_law: {
    label: 'Power Law',
    tagline: 'BTC continues its historical trajectory',
    description:
      "Giovanni Santostasi's Power Law fit: price scales with (time since genesis)^5.8. " +
      'Fifteen-plus years of BTC price action follow this trajectory closely. ' +
      'At current BTC age, this implies roughly 25-35% forward CAGR over 4 years, ' +
      'decaying slowly as the asset matures. The base-case scenario if BTC keeps doing ' +
      'what BTC has always done.',
    implied_cagr_4yr: '~25-35%',
  },
  doomer: {
    label: 'Doomer',
    tagline: 'BTC does nothing for 4 years',
    description:
      "Flat at today's price for the full horizon. This scenario has never happened — " +
      'BTC has no zero-CAGR 4-year window in its history, including the 2018 and 2022 ' +
      "bear-market entries. Shown for stress-test purposes: what's the downside if the " +
      'next cycle looks like no cycle has ever looked?',
    implied_cagr_4yr: '0%',
  },
  optimist: {
    label: 'Optimist',
    tagline: 'Continued supply shock, sustained adoption',
    description:
      '40% annual CAGR. Bullish, but below historical realized performance: ' +
      '2017→2021 was ~60% CAGR and 2020→2024 was ~55% CAGR. Worst historical ' +
      '4-year window (2021→2025) was ~20%. This assumes halving-driven supply ' +
      'shock continues to meaningfully outpace demand growth.',
    implied_cagr_4yr: '40%',
  },
} as const;

export type PricePresetKey = keyof typeof PRICE_PRESETS;
export type PriceModel = PricePresetKey | 'cagr';

// =============================================================================
// TYPES
// =============================================================================

export type OpExMode = 'operating_cash' | 'sats_reserve' | 'cash_yield' | 'cash_dead';
export type EntityType = 'sole_prop' | 'llc_partner' | 's_corp' | 'c_corp';

export interface MacroAssumptions {
  start_date: number;
  btc_price_start: number;
  btc_price_model: PriceModel;
  btc_cagr: number;
  network_hashrate_start_eh: number;
  difficulty_growth_y1: number;
  difficulty_growth_terminal: number;
  fee_share_of_reward: number;
  pool_fee: number;
  risk_free_rate: number;
}

export interface BusinessInputs {
  pretax_capital: number;
  annual_ongoing: number;
  marginal_federal_rate: number;
  marginal_state_rate: number;
  effective_rate: number;
  entity_type: EntityType;
  include_se_tax: boolean;
  se_tax_rate: number;
  ltcg_rate: number;
}

export interface ASICSpec {
  name: string;
  th_per_unit: number;
  watts_per_unit: number;
  price_per_unit: number;
  cooling: 'air' | 'hydro';
  source: string;
}

export interface HostingContract {
  provider: string;
  all_in_kwh_rate: number;
  contract_years: number;
  escalator: number;
  profit_share: number;
  source: string;
}

export interface MineInputs {
  asic: ASICSpec;
  hosting: HostingContract;
  opex_mode: OpExMode;
  uptime: number;
  resale_y4: number;
}

export interface BuyInputs {
  onramp: string;
  onramp_fee: number;
}

// =============================================================================
// HELPERS
// =============================================================================

export function jPerTh(asic: ASICSpec): number {
  return asic.watts_per_unit / asic.th_per_unit;
}

export function pricePerTh(asic: ASICSpec): number {
  return asic.price_per_unit / asic.th_per_unit;
}

export function marginalCombined(biz: BusinessInputs): number {
  let base = biz.marginal_federal_rate + biz.marginal_state_rate;
  if (
    biz.include_se_tax &&
    (biz.entity_type === 'sole_prop' || biz.entity_type === 'llc_partner')
  ) {
    base += biz.se_tax_rate;
  }
  return base;
}

// =============================================================================
// PROJECTIONS
// =============================================================================

export function btcPriceAt(month: number, macro: MacroAssumptions): number {
  const years = month / 12.0;
  if (macro.btc_price_model === 'doomer') return macro.btc_price_start;
  if (macro.btc_price_model === 'optimist') return macro.btc_price_start * Math.pow(1.4, years);
  if (macro.btc_price_model === 'cagr') {
    return macro.btc_price_start * Math.pow(1 + macro.btc_cagr, years);
  }
  // power_law
  const genesis = 2009 + 1 / 12;
  const daysAtStart = (macro.start_date - genesis) * 365.25;
  const daysNow = daysAtStart + years * 365.25;
  const B = 5.8;
  const A = macro.btc_price_start / Math.pow(daysAtStart, B);
  return A * Math.pow(daysNow, B);
}

export function blockSubsidyAt(yearDecimal: number): number {
  let subsidy = 50.0;
  for (const [halvingYear, newSubsidy] of HALVING_SCHEDULE) {
    if (yearDecimal >= halvingYear) subsidy = newSubsidy;
  }
  return subsidy;
}

export function networkHashrateAt(month: number, macro: MacroAssumptions): number {
  const years = month / 12.0;
  const rateNow =
    macro.difficulty_growth_y1 +
    ((macro.difficulty_growth_terminal - macro.difficulty_growth_y1) * years) / 5.0;
  const avgRate = (macro.difficulty_growth_y1 + rateNow) / 2;
  return macro.network_hashrate_start_eh * Math.pow(1 + avgRate, years);
}

// =============================================================================
// FLEET SIZING
// =============================================================================

interface Sizing {
  n_units: number;
  capex_gross_user: number;
  capex_total: number;
  tax_shield: number;
  reserved_opex: number;
}

function sizeFleet(biz: BusinessInputs, mine: MineInputs, _macro: MacroAssumptions): Sizing {
  const { asic, hosting } = mine;
  const H = HORIZON_YEARS * 12;
  const mr = marginalCombined(biz);

  const opexPerUnitMoBase =
    (asic.watts_per_unit / 1000) *
    HOURS_PER_MONTH *
    mine.uptime *
    hosting.all_in_kwh_rate;

  let avgEscMult = 1.0;
  if (hosting.escalator > 0) {
    let s = 0;
    for (let m = 0; m < H; m++) {
      const yr = Math.min(Math.floor(m / 12), hosting.contract_years - 1);
      s += Math.pow(1 + hosting.escalator, yr);
    }
    avgEscMult = s / H;
  }
  const opexPerUnitHorizon = opexPerUnitMoBase * H * avgEscMult;

  let capexGross: number;
  let reservedOpex: number;
  let nUnits: number;
  let capexTotal: number;

  if (mine.opex_mode === 'operating_cash') {
    capexGross = biz.pretax_capital;
    capexTotal = capexGross / (1 - mr);
    nUnits = capexTotal / asic.price_per_unit;
    reservedOpex = 0;
  } else {
    const denom = 1 + opexPerUnitHorizon / (asic.price_per_unit * (1 - mr));
    capexGross = biz.pretax_capital / denom;
    capexTotal = capexGross / (1 - mr);
    nUnits = capexTotal / asic.price_per_unit;
    reservedOpex = nUnits * opexPerUnitHorizon;
  }

  return {
    n_units: nUnits,
    capex_gross_user: capexGross,
    capex_total: capexTotal,
    tax_shield: capexTotal * mr,
    reserved_opex: reservedOpex,
  };
}

// =============================================================================
// MINE SIMULATION
// =============================================================================

export interface MonthlyMineRow {
  month: number;
  year_decimal: number;
  subsidy: number;
  net_hashrate_eh: number;
  btc_earned_net: number;
  opex_usd: number;
  btc_stack: number;
  btc_price: number;
  stack_usd: number;
  reserve_cash: number;
  reserve_btc: number;
}

export interface MineResult {
  path: 'mine';
  opex_mode: OpExMode;
  total_units: number;
  capex_gross_user: number;
  capex_total: number;
  reserved_opex: number;
  tax_shield: number;
  total_th: number;
  total_watts: number;
  btc_stack: number;
  cost_basis: number;
  cumulative_opex_usd: number;
  leftover_cash: number;
  total_yield_earned: number;
  hardware_resale: number;
  recapture_tax: number;
  terminal_btc_price: number;
  terminal_stack_usd: number;
  pretax_terminal_value: number;
  posttax_terminal_value: number;
  ltcg_paid: number;
  monthly: MonthlyMineRow[];
}

export function simulateMine(
  biz: BusinessInputs,
  mine: MineInputs,
  macro: MacroAssumptions,
): MineResult {
  const { asic, hosting } = mine;
  const H = HORIZON_YEARS * 12;
  const sizing = sizeFleet(biz, mine, macro);

  const nUnits = sizing.n_units;
  const totalTh = nUnits * asic.th_per_unit;
  const totalWatts = nUnits * asic.watts_per_unit;

  let reserveCash = sizing.reserved_opex;
  let reserveBtc = 0;
  if (mine.opex_mode === 'sats_reserve') {
    reserveBtc = reserveCash / btcPriceAt(0, macro);
    reserveCash = 0;
  }

  let btcStack = 0;
  let cumulativeOpexUsd = 0;
  let totalYieldEarned = 0;
  const monthly: MonthlyMineRow[] = [];

  for (let m = 1; m <= H; m++) {
    const yearDec = macro.start_date + (m - 1) / 12.0;
    const subsidy = blockSubsidyAt(yearDec);
    const netEh = networkHashrateAt(m, macro);
    const netTh = netEh * 1e6;

    const monthlyPoolBtc = BLOCKS_PER_MONTH * subsidy * (1 + macro.fee_share_of_reward);
    const share = totalTh / netTh;
    const btcEarnedGross = monthlyPoolBtc * share;
    const btcEarnedNet = btcEarnedGross * (1 - macro.pool_fee) * (1 - hosting.profit_share);

    const kwhM = (totalWatts / 1000.0) * HOURS_PER_MONTH * mine.uptime;
    const yr = Math.min(Math.floor(m / 12), hosting.contract_years - 1);
    const rateM = hosting.all_in_kwh_rate * Math.pow(1 + hosting.escalator, yr);
    const opexM = kwhM * rateM;
    cumulativeOpexUsd += opexM;

    const btcPrice = btcPriceAt(m, macro);

    if (mine.opex_mode === 'cash_dead') {
      reserveCash -= opexM;
    } else if (mine.opex_mode === 'cash_yield') {
      const yld = reserveCash * (macro.risk_free_rate / 12);
      reserveCash += yld;
      totalYieldEarned += yld;
      reserveCash -= opexM;
    } else if (mine.opex_mode === 'sats_reserve') {
      reserveBtc -= opexM / btcPrice;
    }

    btcStack += btcEarnedNet;

    monthly.push({
      month: m,
      year_decimal: yearDec,
      subsidy,
      net_hashrate_eh: netEh,
      btc_earned_net: btcEarnedNet,
      opex_usd: opexM,
      btc_stack: btcStack,
      btc_price: btcPrice,
      stack_usd: btcStack * btcPrice,
      reserve_cash: reserveCash,
      reserve_btc: reserveBtc,
    });
  }

  let leftoverCash = 0;
  if (mine.opex_mode === 'sats_reserve') {
    btcStack += Math.max(0, reserveBtc);
  } else if (mine.opex_mode === 'cash_yield' || mine.opex_mode === 'cash_dead') {
    leftoverCash = Math.max(0, reserveCash);
  }

  const hardwareResale = sizing.capex_total * mine.resale_y4;
  const recaptureTax = hardwareResale * marginalCombined(biz);

  const terminalBtcPrice = btcPriceAt(H, macro);
  const terminalStackUsd = btcStack * terminalBtcPrice;
  const pretaxTerminalValue = terminalStackUsd + hardwareResale + leftoverCash;

  const costBasisMined = monthly.reduce((acc, r) => acc + r.btc_earned_net * r.btc_price, 0);
  const costBasis =
    mine.opex_mode === 'sats_reserve' ? costBasisMined + sizing.reserved_opex : costBasisMined;
  const gain = Math.max(0, terminalStackUsd - costBasis);
  const ltcg = gain * biz.ltcg_rate;

  const posttaxTerminalValue =
    terminalStackUsd - ltcg + hardwareResale - recaptureTax + leftoverCash;

  return {
    path: 'mine',
    opex_mode: mine.opex_mode,
    total_units: nUnits,
    capex_gross_user: sizing.capex_gross_user,
    capex_total: sizing.capex_total,
    reserved_opex: sizing.reserved_opex,
    tax_shield: sizing.tax_shield,
    total_th: totalTh,
    total_watts: totalWatts,
    btc_stack: btcStack,
    cost_basis: costBasis,
    cumulative_opex_usd: cumulativeOpexUsd,
    leftover_cash: leftoverCash,
    total_yield_earned: totalYieldEarned,
    hardware_resale: hardwareResale,
    recapture_tax: recaptureTax,
    terminal_btc_price: terminalBtcPrice,
    terminal_stack_usd: terminalStackUsd,
    pretax_terminal_value: pretaxTerminalValue,
    posttax_terminal_value: posttaxTerminalValue,
    ltcg_paid: ltcg,
    monthly,
  };
}

// =============================================================================
// BUY SIMULATION
// =============================================================================

export interface MonthlyBuyRow {
  month: number;
  btc_price: number;
  btc_stack: number;
  stack_usd: number;
}

export interface BuyResult {
  path: 'buy';
  tax_paid_year1: number;
  posttax_capital: number;
  annual_ongoing_pretax: number;
  cost_basis: number;
  btc_stack: number;
  terminal_btc_price: number;
  terminal_stack_usd: number;
  pretax_terminal_value: number;
  posttax_terminal_value: number;
  ltcg_paid: number;
  monthly: MonthlyBuyRow[];
}

export function simulateBuy(
  biz: BusinessInputs,
  buy: BuyInputs,
  macro: MacroAssumptions,
  annualOngoingBtcCommit = 0,
): BuyResult {
  const H = HORIZON_YEARS * 12;
  const taxPaid = biz.pretax_capital * biz.effective_rate;
  const posttax = biz.pretax_capital - taxPaid;

  const dcaMonths = 12;
  const perMonthInitial = posttax / dcaMonths;
  const monthlyOngoingPosttax =
    (annualOngoingBtcCommit * (1 - biz.effective_rate)) / 12.0;

  let btcStack = 0;
  let basis = 0;
  const monthly: MonthlyBuyRow[] = [];

  for (let m = 1; m <= H; m++) {
    const price = btcPriceAt(m, macro);
    let buyThisMonth = 0;
    if (m <= dcaMonths) buyThisMonth += perMonthInitial;
    if (annualOngoingBtcCommit > 0) buyThisMonth += monthlyOngoingPosttax;

    if (buyThisMonth > 0) {
      const eff = buyThisMonth * (1 - buy.onramp_fee);
      btcStack += eff / price;
      basis += eff;
    }

    monthly.push({
      month: m,
      btc_price: price,
      btc_stack: btcStack,
      stack_usd: btcStack * price,
    });
  }

  const terminalPrice = btcPriceAt(H, macro);
  const terminalUsd = btcStack * terminalPrice;
  const gain = Math.max(0, terminalUsd - basis);
  const ltcg = gain * biz.ltcg_rate;

  return {
    path: 'buy',
    tax_paid_year1: taxPaid,
    posttax_capital: posttax,
    annual_ongoing_pretax: annualOngoingBtcCommit,
    cost_basis: basis,
    btc_stack: btcStack,
    terminal_btc_price: terminalPrice,
    terminal_stack_usd: terminalUsd,
    pretax_terminal_value: terminalUsd,
    posttax_terminal_value: terminalUsd - ltcg,
    ltcg_paid: ltcg,
    monthly,
  };
}

// =============================================================================
// COMPARE
// =============================================================================

export interface CompareInputs {
  pretax_capital: number;
  annual_ongoing: number;
  total_pretax_committed: number;
  horizon_years: number;
  marginal_combined: number;
  effective_rate: number;
  asic: string;
  hosting: string;
  opex_mode: OpExMode;
  onramp: string;
  btc_price_model: PriceModel;
  btc_price_model_label: string;
  btc_cagr: number | null;
  difficulty_growth: string;
}

export interface CompareResult {
  inputs: CompareInputs;
  btc_hurdle: number;
  mine_detail: MineResult;
  buy_detail: BuyResult;
  winners: {
    sats_pretax: 'mine' | 'buy';
    usd_pretax: 'mine' | 'buy';
    usd_posttax: 'mine' | 'buy';
  };
}

export function compare(
  biz: BusinessInputs,
  mine: MineInputs,
  buy: BuyInputs,
  macro: MacroAssumptions,
): CompareResult {
  const mRes = simulateMine(biz, mine, macro);

  let annualOngoing = 0;
  if (mine.opex_mode === 'operating_cash') {
    const annualOpexPretax = mRes.cumulative_opex_usd / HORIZON_YEARS;
    annualOngoing = biz.annual_ongoing || annualOpexPretax;
  }

  const bRes = simulateBuy(biz, buy, macro, annualOngoing);

  const totalPretaxCommitted = biz.pretax_capital + annualOngoing * HORIZON_YEARS;
  const btcHurdle =
    (totalPretaxCommitted * (1 - biz.effective_rate)) / macro.btc_price_start;

  const priceLabel =
    macro.btc_price_model === 'cagr'
      ? `Custom CAGR (${(macro.btc_cagr * 100).toFixed(0)}%)`
      : PRICE_PRESETS[macro.btc_price_model].label;

  return {
    inputs: {
      pretax_capital: biz.pretax_capital,
      annual_ongoing: annualOngoing,
      total_pretax_committed: totalPretaxCommitted,
      horizon_years: HORIZON_YEARS,
      marginal_combined: marginalCombined(biz),
      effective_rate: biz.effective_rate,
      asic: mine.asic.name,
      hosting:
        `${mine.hosting.provider} @ $${mine.hosting.all_in_kwh_rate.toFixed(4)}/kWh` +
        (mine.hosting.profit_share > 0
          ? ` + ${(mine.hosting.profit_share * 100).toFixed(0)}% mgmt fee`
          : ''),
      opex_mode: mine.opex_mode,
      onramp: buy.onramp,
      btc_price_model: macro.btc_price_model,
      btc_price_model_label: priceLabel,
      btc_cagr: macro.btc_price_model === 'cagr' ? macro.btc_cagr : null,
      difficulty_growth: `${(macro.difficulty_growth_y1 * 100).toFixed(0)}% → ${(macro.difficulty_growth_terminal * 100).toFixed(0)}%`,
    },
    btc_hurdle: btcHurdle,
    mine_detail: mRes,
    buy_detail: bRes,
    winners: {
      sats_pretax: mRes.btc_stack > bRes.btc_stack ? 'mine' : 'buy',
      usd_pretax:
        mRes.pretax_terminal_value > bRes.pretax_terminal_value ? 'mine' : 'buy',
      usd_posttax:
        mRes.posttax_terminal_value > bRes.posttax_terminal_value ? 'mine' : 'buy',
    },
  };
}
