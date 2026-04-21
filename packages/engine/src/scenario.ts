/**
 * Scenario builder — convenience function equivalent to Python's build_scenario.
 * Returns a complete set of inputs ready to feed into compare().
 */

import {
  BusinessInputs,
  MacroAssumptions,
  MineInputs,
  BuyInputs,
  PriceModel,
  DifficultyPreset,
  EntityType,
  OpExMode,
  DIFFICULTY_PRESETS,
  DEFAULT_BTC_PRICE,
  DEFAULT_NETWORK_EH,
  DEFAULT_FEE_SHARE,
} from './engine';
import { ASIC_PRESETS, HOSTING_PRESETS, ONRAMP_PRESETS } from './presets';

export interface ScenarioOverrides {
  pretax?: number;
  asicKey?: keyof typeof ASIC_PRESETS;
  hostingKey?: keyof typeof HOSTING_PRESETS;
  onrampKey?: keyof typeof ONRAMP_PRESETS;
  marginalFed?: number;
  marginalState?: number;
  effective?: number;
  priceModel?: PriceModel;
  cagr?: number;
  ltcg?: number;
  seTax?: boolean;
  entity?: EntityType;
  opexMode?: OpExMode;
  difficultyPreset?: DifficultyPreset;
}

export interface BuiltScenario {
  biz: BusinessInputs;
  mine: MineInputs;
  buy: BuyInputs;
  macro: MacroAssumptions;
}

export function buildScenario(overrides: ScenarioOverrides = {}): BuiltScenario {
  const {
    pretax = 100_000,
    asicKey = 's21_xp',
    hostingKey = 'compass_retail',
    onrampKey = 'river_recurring',
    marginalFed = 0.24,
    marginalState = 0.04,
    effective = 0.22,
    priceModel = 'power_law',
    cagr = 0.0,
    ltcg = 0.20,
    seTax = false,
    entity = 's_corp',
    opexMode = 'operating_cash',
    difficultyPreset = 'moderate',
  } = overrides;

  const diff = DIFFICULTY_PRESETS[difficultyPreset];
  const macro: MacroAssumptions = {
    start_date: 2026 + 4 / 12,
    btc_price_start: DEFAULT_BTC_PRICE,
    btc_price_model: priceModel,
    btc_cagr: cagr,
    network_hashrate_start_eh: DEFAULT_NETWORK_EH,
    difficulty_growth_y1: diff.y1,
    difficulty_growth_terminal: diff.terminal,
    fee_share_of_reward: DEFAULT_FEE_SHARE,
    pool_fee: 0.02,
    risk_free_rate: 0.045,
  };

  const biz: BusinessInputs = {
    pretax_capital: pretax,
    annual_ongoing: 0,
    marginal_federal_rate: marginalFed,
    marginal_state_rate: marginalState,
    effective_rate: effective,
    entity_type: entity,
    include_se_tax: seTax,
    se_tax_rate: 0.153,
    ltcg_rate: ltcg,
  };

  const mine: MineInputs = {
    asic: ASIC_PRESETS[asicKey],
    hosting: HOSTING_PRESETS[hostingKey],
    opex_mode: opexMode,
    uptime: 0.95,
    resale_y4: 0.15,
  };

  const onramp = ONRAMP_PRESETS[onrampKey];
  const buy: BuyInputs = {
    onramp: onramp.name,
    onramp_fee: onramp.fee,
  };

  return { biz, mine, buy, macro };
}
