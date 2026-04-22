'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ASIC_PRESETS,
  HOSTING_PRESETS,
  ONRAMP_PRESETS,
  PRICE_PRESETS,
  DIFFICULTY_UI_PRESETS,
  type DifficultyUIKey,
  projectHalvings,
  HORIZON_YEARS,
  buildScenario,
  compare,
  type PriceModel,
} from '@mineorbuy/engine';
import {
  Panel,
  StatRow,
  SingleRow,
  FormField,
  Input,
  Select,
  SegmentedControl,
  Badge,
} from './ui';
import { fmtBtc, fmtUsd, fmtPct, fmtSigned, fmtUsdSigned, fmtLargeUsd } from '@/lib/format';
import type { MarketData } from '@/lib/market';
import { MoneyFlow } from './MoneyFlow';

// Bracket presets — nobody knows their marginal rate off the top of their head
const TAX_PRESETS: Record<string, { label: string; fed: number; state: number; eff: number; entity: string }> = {
  s_corp_low: {
    label: 'S-corp owner, 22% bracket',
    fed: 0.22,
    state: 0.04,
    eff: 0.20,
    entity: 's_corp',
  },
  s_corp_mid: {
    label: 'S-corp owner, 24% bracket (default)',
    fed: 0.24,
    state: 0.04,
    eff: 0.22,
    entity: 's_corp',
  },
  s_corp_high: {
    label: 'S-corp owner, 32% bracket',
    fed: 0.32,
    state: 0.05,
    eff: 0.28,
    entity: 's_corp',
  },
  ca_passthrough: {
    label: 'CA passthrough, 37% + 9.3%',
    fed: 0.37,
    state: 0.093,
    eff: 0.35,
    entity: 's_corp',
  },
  c_corp: {
    label: 'C-corp, 21% federal',
    fed: 0.21,
    state: 0.06,
    eff: 0.25,
    entity: 'c_corp',
  },
  sole_prop: {
    label: 'Sole prop, 22% + SE tax',
    fed: 0.22,
    state: 0.04,
    eff: 0.26,
    entity: 'sole_prop',
  },
};

export function Calculator({ market }: { market: MarketData }) {
  const [pretax, setPretax] = useState(100_000);
  const [asicKey, setAsicKey] = useState<string>('s21_xp');
  const [hostingKey, setHostingKey] = useState<string>('compass_retail');
  const [onrampKey, setOnrampKey] = useState<string>('river_recurring');
  const [priceModel, setPriceModel] = useState<PriceModel>('power_law');
  const [customCagr, setCustomCagr] = useState(25);
  const [taxPresetKey, setTaxPresetKey] = useState<string>('s_corp_mid');
  const [difficultyKey, setDifficultyKey] = useState<DifficultyUIKey>('baseline');

  const selectedHost = HOSTING_PRESETS[hostingKey as keyof typeof HOSTING_PRESETS];
  const availableAsicKeys = selectedHost.available_asics ?? Object.keys(ASIC_PRESETS);

  useEffect(() => {
    if (!availableAsicKeys.includes(asicKey)) {
      setAsicKey(availableAsicKeys[0] ?? 's21_xp');
    }
  }, [hostingKey, availableAsicKeys, asicKey]);

  const result = useMemo(() => {
    const taxPreset = TAX_PRESETS[taxPresetKey];
    const { biz, mine, buy, macro } = buildScenario({
      pretax,
      asicKey: asicKey as keyof typeof ASIC_PRESETS,
      hostingKey: hostingKey as keyof typeof HOSTING_PRESETS,
      onrampKey: onrampKey as keyof typeof ONRAMP_PRESETS,
      marginalFed: taxPreset.fed,
      marginalState: taxPreset.state,
      effective: taxPreset.eff,
      entity: taxPreset.entity as any,
      priceModel,
      cagr: priceModel === 'cagr' ? customCagr / 100 : 0,
      difficultyPreset: DIFFICULTY_UI_PRESETS[difficultyKey].key,
    });
    // Swap in live market data
    macro.btc_price_start = market.btcPrice;
    macro.network_hashrate_start_eh = market.networkHashrateEh;
    if (market.blockHeight > 0) {
      macro.current_block_height = market.blockHeight;
      macro.avg_block_time_sec = market.avgBlockTimeSec;
    }
    return compare(biz, mine, buy, macro);
  }, [
    pretax,
    asicKey,
    hostingKey,
    onrampKey,
    priceModel,
    customCagr,
    taxPresetKey,
    difficultyKey,
    market.btcPrice,
    market.networkHashrateEh,
    market.blockHeight,
  ]);

  const m = result.mine_detail;
  const b = result.buy_detail;
  const deltaBtc = m.btc_stack - b.btc_stack;
  const deltaPost = m.posttax_terminal_value - b.posttax_terminal_value;
  const mineWins = deltaBtc > 0;

  const retargetPct = market.difficultyNextAdjustmentPct;
  const suggestedPreset: DifficultyUIKey =
    retargetPct <= 0 ? 'cycle_trough' :
    retargetPct <= 3 ? 'baseline' :
    'hashrate_race';
  const suggestedLabel = DIFFICULTY_UI_PRESETS[suggestedPreset].label;

  // Halving projection for display
  const halvings = market.blockHeight > 0
    ? projectHalvings(market.blockHeight, market.avgBlockTimeSec)
    : null;
  const nextHalving = halvings?.find(h => !h.isHistorical && h.projectedUnixSec > Date.now() / 1000);

  const formatHalvingDate = (unixSec: number) => {
    const d = new Date(unixSec * 1000);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthsAway = Math.round((unixSec - Date.now() / 1000) / (30.4375 * 86400));
    return `est. ${months[d.getMonth()]} ${d.getFullYear()} (${monthsAway}mo)`;
  };

  const simStartYear = 2026 + 4 / 12;
  const simEndYear = simStartYear + HORIZON_YEARS;
  const formatYear = (y: number) => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const yr = Math.floor(y);
    const mo = Math.round((y - yr) * 12);
    return `${months[mo] ?? 'Jan'} ${yr}`;
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      {/* LEFT: INPUTS */}
      <div className="flex flex-col gap-4">
        <Panel title="Your Business">
          <div className="flex flex-col gap-4">
            <FormField label="Pre-tax capital to deploy" hint="annual net profit available">
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm text-fg-faint">$</span>
                <Input
                  type="number"
                  value={pretax}
                  onChange={(e) => setPretax(Number(e.target.value) || 0)}
                  min={1000}
                  step={1000}
                  className="pl-6"
                />
              </div>
            </FormField>

            <FormField label="Tax situation" hint="pick the closest match">
              <Select value={taxPresetKey} onChange={(e) => setTaxPresetKey(e.target.value)}>
                {Object.entries(TAX_PRESETS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </Select>
              <div className="mt-1.5 text-2xs text-fg-faint tabular">
                Marginal combined: {fmtPct(TAX_PRESETS[taxPresetKey].fed + TAX_PRESETS[taxPresetKey].state)}
                {'  ·  '}
                Effective: {fmtPct(TAX_PRESETS[taxPresetKey].eff)}
              </div>
            </FormField>
          </div>
        </Panel>

        <Panel title="Mining Setup">
          <div className="flex flex-col gap-4">
            <FormField label="Hosting" hint="determines which ASICs you can run">
              <Select value={hostingKey} onChange={(e) => setHostingKey(e.target.value)}>
                {Object.entries(HOSTING_PRESETS).map(([k, h]) => {
                  const mgmt = h.profit_share > 0 ? `  + ${(h.profit_share * 100).toFixed(0)}% mgmt` : '';
                  return (
                    <option key={k} value={k}>
                      {h.provider}  ·  ${h.all_in_kwh_rate.toFixed(3)}/kWh{mgmt}
                    </option>
                  );
                })}
              </Select>
            </FormField>

            <FormField label="ASIC" hint="efficiency × price per TH">
              <Select value={asicKey} onChange={(e) => setAsicKey(e.target.value)}>
                {availableAsicKeys.map((k) => {
                  const a = ASIC_PRESETS[k as keyof typeof ASIC_PRESETS];
                  if (!a) return null;
                  return (
                    <option key={k} value={k}>
                      {a.name}  ·  {(a.watts_per_unit / a.th_per_unit).toFixed(1)} J/TH  ·  ${(a.price_per_unit / a.th_per_unit).toFixed(0)}/TH
                    </option>
                  );
                })}
              </Select>
            </FormField>

            <FormField label="Onramp (for Buy path)">
              <Select value={onrampKey} onChange={(e) => setOnrampKey(e.target.value)}>
                {Object.entries(ONRAMP_PRESETS).map(([k, o]) => (
                  <option key={k} value={k}>
                    {o.name}  ·  {(o.fee * 100).toFixed(2)}% fee
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </Panel>

        <Panel title="BTC Price Assumption">
          <div className="flex flex-col gap-3">
            <SegmentedControl
              value={priceModel === 'cagr' ? 'cagr' : priceModel}
              onChange={(v) => setPriceModel(v as PriceModel)}
              options={[
                { value: 'power_law', label: 'Power Law', tagline: '~25-35% CAGR' },
                { value: 'doomer', label: 'Doomer', tagline: 'Flat 4yr' },
                { value: 'optimist', label: 'Optimist', tagline: '40% CAGR' },
                { value: 'cagr', label: 'Custom', tagline: 'Your number' },
              ]}
            />
            {priceModel === 'cagr' ? (
              <FormField label="Custom CAGR">
                <div className="relative">
                  <Input
                    type="number"
                    value={customCagr}
                    onChange={(e) => setCustomCagr(Number(e.target.value) || 0)}
                    step={1}
                  />
                  <span className="absolute right-3 top-2 text-sm text-fg-faint">%</span>
                </div>
              </FormField>
            ) : (
              <div className="rounded border border-edge bg-bg-soft p-3">
                <div className="text-xs font-medium text-fg">
                  {PRICE_PRESETS[priceModel as keyof typeof PRICE_PRESETS].label}
                </div>
                <div className="mt-1 text-xs leading-relaxed text-fg-muted">
                  {PRICE_PRESETS[priceModel as keyof typeof PRICE_PRESETS].description}
                </div>
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Network Difficulty">
          <div className="flex flex-col gap-3">
            <SegmentedControl
              value={difficultyKey}
              onChange={(v) => setDifficultyKey(v as DifficultyUIKey)}
              options={[
                { value: 'cycle_trough', label: 'Cycle Trough', tagline: '+5→3%' },
                { value: 'baseline', label: 'Baseline', tagline: '+15→8%' },
                { value: 'hashrate_race', label: 'Hashrate Race', tagline: '+25→12%' },
              ]}
            />
            <div className="rounded border border-edge bg-bg-soft p-3">
              <div className="text-xs font-medium text-fg">
                {DIFFICULTY_UI_PRESETS[difficultyKey].label}
              </div>
              <div className="mt-1 text-xs leading-relaxed text-fg-muted">
                {DIFFICULTY_UI_PRESETS[difficultyKey].description}
              </div>
            </div>
            {retargetPct !== 0 && (
              <div className="text-2xs text-fg-faint leading-relaxed">
                <span className="text-fg-muted">Next retarget:</span>{' '}
                <span className="tabular">
                  {retargetPct > 0 ? '+' : ''}{retargetPct.toFixed(2)}%
                </span>
                {' '}— aligns with{' '}
                <button
                  type="button"
                  onClick={() => setDifficultyKey(suggestedPreset)}
                  className="underline hover:text-fg"
                >
                  {suggestedLabel}
                </button>
              </div>
            )}
          </div>
        </Panel>
      </div>

      {/* RIGHT: RESULTS */}
      <div className="flex flex-col gap-4">
        {/* Verdict */}
        <div
          className={`rounded-lg border p-6 ${
            mineWins
              ? 'border-mine/40 bg-mine/5'
              : 'border-buy/40 bg-buy/5'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-fg-muted">
                4-year verdict
                <Badge tone={mineWins ? 'mine' : 'buy'}>
                  {mineWins ? 'Mine wins sats' : 'Buy wins sats'}
                </Badge>
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <span
                  className={`text-4xl font-bold tabular ${
                    mineWins ? 'text-mine' : 'text-buy'
                  }`}
                >
                  {fmtSigned(deltaBtc, 3)}
                </span>
                <span className="text-sm text-fg-muted">BTC</span>
                <span className="text-base tabular text-fg-muted">
                  {fmtUsdSigned(deltaPost)} post-tax
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                Over 4 years, on identical pre-tax dollars committed to each path.
              </p>
            </div>
          </div>
        </div>

        {/* Side-by-side numbers */}
        <Panel title="Mine vs Buy, 4-year horizon">
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 border-b border-edge pb-2 text-xs font-medium uppercase tracking-wider text-fg-faint">
            <span>Metric</span>
            <span className="text-right text-mine">Mine + Ops</span>
            <span className="min-w-[120px] text-right text-buy">Lump + DCA</span>
          </div>

          <div className="divide-y divide-edge/60">
            <div className="py-2">
              <StatRow
                label="Units / initial outlay"
                mine={`${m.total_units.toFixed(1)}  ·  ${fmtUsd(m.capex_gross_user)}`}
                buy={fmtUsd(b.posttax_capital)}
              />
              <StatRow
                label="Tax shield refund (Sec 179)"
                mine={fmtUsd(m.tax_shield)}
                buy="—"
              />
              <StatRow
                label="Total committed (4 yr)"
                mine={fmtUsd(result.inputs.total_pretax_committed)}
                buy={fmtUsd(result.inputs.total_pretax_committed)}
              />
              <StatRow
                label="Ongoing hosting / DCA per year"
                mine={fmtUsd(result.inputs.annual_ongoing)}
                buy={fmtUsd(result.inputs.annual_ongoing)}
              />
            </div>

            <div className="py-2">
              <StatRow label="BTC stack" mine={fmtBtc(m.btc_stack)} buy={fmtBtc(b.btc_stack)} emphasis />
              <StatRow
                label="Cost per coin"
                mine={m.btc_stack > 0 ? fmtUsd(m.cost_basis / m.btc_stack) : '—'}
                buy={b.btc_stack > 0 ? fmtUsd(b.cost_basis / b.btc_stack) : '—'}
              />
              <StatRow
                label="Terminal USD (pre-tax)"
                mine={fmtUsd(m.pretax_terminal_value)}
                buy={fmtUsd(b.pretax_terminal_value)}
              />
              <StatRow
                label="Terminal USD (post-liquidation)"
                mine={fmtUsd(m.posttax_terminal_value)}
                buy={fmtUsd(b.posttax_terminal_value)}
                emphasis
              />
            </div>

            <div className="py-2">
              <StatRow
                label="Hardware resale (yr 4)"
                mine={fmtUsd(m.hardware_resale)}
                buy="—"
              />
              <StatRow
                label="§1245 recapture tax"
                mine={`−${fmtUsd(m.recapture_tax)}`}
                buy="—"
              />
              <StatRow
                label="LTCG on BTC gain"
                mine={m.ltcg_paid > 0 ? `−${fmtUsd(m.ltcg_paid)}` : '—'}
                buy={b.ltcg_paid > 0 ? `−${fmtUsd(b.ltcg_paid)}` : '—'}
              />
            </div>
          </div>
        </Panel>

        {/* Money Flow */}
        <MoneyFlow result={result} />

        {/* Assumptions reference */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Panel title="Active Assumptions">
            <div className="space-y-0.5">
              <SingleRow label="BTC price today" value={fmtUsd(market.btcPrice)} />
              <SingleRow
                label="Modeled BTC price (Yr 4)"
                value={fmtUsd(m.terminal_btc_price)}
              />
              <SingleRow
                label="Network hashrate"
                value={`${market.networkHashrateEh.toFixed(0)} EH/s`}
              />
              <SingleRow
                label="Next retarget (~14d)"
                value={
                  retargetPct !== 0
                    ? `${retargetPct > 0 ? '+' : ''}${retargetPct.toFixed(2)}%`
                    : '—'
                }
              />
              <SingleRow label="Price model" value={result.inputs.btc_price_model_label} />
              <SingleRow
                label="Difficulty growth"
                value={result.inputs.difficulty_growth}
                muted
              />
              <SingleRow
                label="Data source"
                value={
                  market.stale
                    ? 'fallback (defaults)'
                    : `${market.sources.btc} · ${market.sources.hashrate}`
                }
                muted
              />
              {nextHalving && (
                <SingleRow
                  label="Next halving"
                  value={`Block ${nextHalving.height.toLocaleString()} · ${formatHalvingDate(nextHalving.projectedUnixSec)}`}
                  muted
                />
              )}
              <SingleRow
                label="Simulation window"
                value={`${formatYear(simStartYear)} → ${formatYear(simEndYear)}`}
                muted
              />
            </div>
          </Panel>

          <Panel title="Reference">
            <div className="space-y-0.5">
              <SingleRow
                label="BTC hurdle (cash → BTC today)"
                value={fmtBtc(result.btc_hurdle, 3)}
              />
              <SingleRow
                label="Mine hosting (4yr total)"
                value={fmtUsd(m.cumulative_opex_usd)}
              />
              <SingleRow
                label="Hosting rate"
                value={result.inputs.hosting.split('@')[1]?.trim() ?? ''}
                muted
              />
              <SingleRow
                label="ASIC"
                value={result.inputs.asic}
                muted
              />
              <SingleRow
                label="OpEx mode"
                value={result.inputs.opex_mode}
                muted
              />
              {selectedHost.last_verified && (
                <SingleRow
                  label="Pricing verified"
                  value={selectedHost.last_verified}
                  muted
                />
              )}
              {selectedHost.url && (
                <div className="pt-1 text-2xs">
                  <a
                    href={selectedHost.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-fg-muted hover:text-fg underline"
                  >
                    Visit {selectedHost.provider} →
                  </a>
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
