/**
 * @mineorbuy/engine — Preset library
 *
 * Real-world hardware, hosting, and onramp presets as of April 2026.
 * Keep in sync with mine_or_buy_engine.py presets.
 */

import type { ASICSpec, HostingContract } from './engine';

// =============================================================================
// ASIC PRESETS (April 2026 market)
// =============================================================================

export const ASIC_PRESETS: Record<string, ASICSpec> = {
  s23_hydro: {
    name: 'Bitmain S23 Hydro',
    th_per_unit: 580,
    watts_per_unit: 5510,
    price_per_unit: 24_000,
    cooling: 'hydro',
    source:
      '2026 market: S23e Hydro 2U (865TH) lists $19.5-24.7k on OneMiners/ASIC Marketplace',
    url: 'https://www.simplemining.io/shop-miners',
    last_verified: '2026-04-21',
  },
  s21_xp_hydro: {
    name: 'Bitmain S21 XP Hydro',
    th_per_unit: 473,
    watts_per_unit: 5676,
    price_per_unit: 9_460,
    cooling: 'hydro',
    source: 'Compass/Simple Mining secondary market, ~$20/TH',
    url: 'https://www.simplemining.io/shop-miners',
    last_verified: '2026-04-21',
  },
  s21_xp: {
    name: 'Bitmain S21 XP',
    th_per_unit: 270,
    watts_per_unit: 3645,
    price_per_unit: 5_940,
    cooling: 'air',
    source: 'Compass Mining retail, ~$22/TH',
    url: 'https://compassmining.io/hardware',
    last_verified: '2026-04-21',
  },
  s21_pro: {
    name: 'Bitmain S21 Pro',
    th_per_unit: 234,
    watts_per_unit: 3510,
    price_per_unit: 4_446,
    cooling: 'air',
    source: 'Compass Mining retail, ~$19/TH',
    url: 'https://compassmining.io/hardware',
    last_verified: '2026-04-21',
  },
  m63s_plus: {
    name: 'MicroBT M63S+',
    th_per_unit: 402,
    watts_per_unit: 7437,
    price_per_unit: 12_937,
    cooling: 'hydro',
    source: 'Sazmining Norway fleet listing',
    url: 'https://www.sazmining.com/datacenters',
    last_verified: '2026-04-21',
  },
  s19_xp_hydro: {
    name: 'Bitmain S19 XP Hydro',
    th_per_unit: 257,
    watts_per_unit: 5346,
    price_per_unit: 3_997,
    cooling: 'hydro',
    source: 'Sazmining Paraguay entry tier',
    url: 'https://www.sazmining.com/datacenters',
    last_verified: '2026-04-21',
  },
};

// =============================================================================
// HOSTING PRESETS
// =============================================================================

export const HOSTING_PRESETS: Record<string, HostingContract> = {
  // Traditional hosts: profit via kWh markup, 0% profit share on BTC
  // Simple Mining — verified from simplemining.io/shop-miners (April 2026)
  simple_low: {
    provider: 'Simple Mining (Iowa, volume)',
    all_in_kwh_rate: 0.070,
    contract_years: 1,
    escalator: 0.0,
    profit_share: 0.0,
    source: 'simplemining.io/hosting — $0.070/kWh all-in for high-volume tier',
    available_asics: ['s23_hydro', 's21_xp_hydro', 's21_xp', 's21_pro'],
  },
  simple_std: {
    provider: 'Simple Mining (Iowa, standard)',
    all_in_kwh_rate: 0.080,
    contract_years: 1,
    escalator: 0.0,
    profit_share: 0.0,
    source: 'simplemining.io/hosting — $0.080/kWh all-in standard',
    available_asics: ['s23_hydro', 's21_xp_hydro', 's21_xp', 's21_pro'],
  },
  // Compass — common inventory per compassmining.io/hardware (catalog rotates; common models)
  compass_retail: {
    provider: 'Compass Mining (US retail)',
    all_in_kwh_rate: 0.078,
    contract_years: 2,
    escalator: 0.0,
    profit_share: 0.0,
    source: 'compassmining.io — $0.078/kWh typical US facility',
    available_asics: ['s21_xp', 's21_pro', 's19_xp_hydro'],
  },

  // Sazmining: aligned-incentive — low service fee + mgmt fee on mined BTC
  sazmining_py: {
    provider: 'Sazmining (Paraguay, 100% hydro)',
    all_in_kwh_rate: 0.047,
    contract_years: 2,
    escalator: 0.0,
    profit_share: 0.15,
    source: 'sazmining.com/blog — published $0.047/kWh; 80% Annual Rig Performance Guarantee (Paraguay)',
    url: 'https://www.sazmining.com/datacenters',
    last_verified: '2026-04-21',
    site_uptime: 0.80,
    available_asics: ['s19_xp_hydro', 's21_pro'],
  },
  sazmining_no: {
    provider: 'Sazmining (Norway, 99% carbon-free)',
    all_in_kwh_rate: 0.046,
    contract_years: 2,
    escalator: 0.0,
    profit_share: 0.20,
    source: 'sazmining.com/blog (M63S case study, Dec 2024) — $0.046/kWh, 95% ARPG (Norway)',
    url: 'https://www.sazmining.com/datacenters',
    last_verified: '2026-04-21',
    site_uptime: 0.95,
    available_asics: ['m63s_plus'],
  },
  sazmining_et: {
    provider: 'Sazmining (Ethiopia, GERD hydro)',
    all_in_kwh_rate: 0.056,
    contract_years: 2,
    escalator: 0.0,
    profit_share: 0.15,
    source: 'Sazmining press release, Sep 29 2025 — "100% renewable hydropower at just $0.056/kWh"',
    url: 'https://www.sazmining.com/datacenters',
    last_verified: '2026-04-21',
    site_uptime: 0.85,  // estimated; Ethiopia ARPG not yet published
    available_asics: ['s19_xp_hydro', 's21_xp_hydro', 's21_xp'],
  },
};

// =============================================================================
// ONRAMP PRESETS
// =============================================================================

export interface OnrampSpec {
  name: string;
  fee: number;
  url?: string;
  last_verified?: string;
}

export const ONRAMP_PRESETS: Record<string, OnrampSpec> = {
  river_recurring: { fee: 0.0, name: 'River Business (recurring)', url: 'https://river.com/business' },
  river_onetime: { fee: 0.0125, name: 'River Business (one-time)', url: 'https://river.com/business' },
  river_otc: { fee: 0.0015, name: 'River OTC (>$25k)', url: 'https://river.com/business' },
  bitcoin_well: { fee: 0.0099, name: 'Bitcoin Well', url: 'https://bitcoinwell.com' },
  swan: { fee: 0.0099, name: 'Swan Bitcoin', url: 'https://swanbitcoin.com' },
  strike: { fee: 0.0030, name: 'Strike', url: 'https://strike.me' },
  kraken_pro: { fee: 0.0016, name: 'Kraken Pro (taker)', url: 'https://pro.kraken.com' },
};
