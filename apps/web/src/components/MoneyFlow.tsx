'use client';

import { useState } from 'react';
import type { CompareResult } from '@mineorbuy/engine';
import { fmtLargeUsd } from '@/lib/format';
import { Panel } from './ui';

// ─── Types ──────────────────────────────────────────────────────────────────

type FlowColor = '#7dd3fc' | '#f59e0b' | '#4ade80' | '#94a3b8';

interface FlowNode {
  id: string;
  label: string;
  amount: number;        // always USD for sizing/layout
  btcAmount?: number;    // if set, show this exact BTC count in BTC mode (not USD÷price)
  color: FlowColor;
  col: number;           // 0=left, 1=mid, 2=right
}

interface FlowEdge {
  from: string;
  to: string;
  value: number;
  color: FlowColor;
}

// ─── Mine path: explicit causal edges ───────────────────────────────────────

function mineFlow(r: CompareResult, denom: 'usd' | 'btc'): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const m = r.mine_detail;
  const ongoing4yr = r.inputs.annual_ongoing * 4;
  const isBtc = denom === 'btc';

  // BTC mode: inputs → BTC stack only. No exit taxes, no walk-away, no resale.
  const nodes: FlowNode[] = [
    // Col 0: inputs
    { id: 'asic',    label: 'ASIC purchase (Yr 1)',   amount: m.capex_gross_user,      color: '#7dd3fc', col: 0 },
    ...(ongoing4yr > 0 ? [{ id: 'host', label: 'Hosting opex (Yr 1–4)', amount: m.cumulative_opex_usd, color: '#7dd3fc' as FlowColor, col: 0 }] : []),
    { id: 'shield',  label: 'Sec 179 tax refund',     amount: m.tax_shield,            color: '#4ade80', col: 0 },
    // Col 1: BTC stack (terminal in BTC mode, intermediate in USD mode)
    { id: 'btc',     label: isBtc ? 'BTC stacked' : 'BTC mined (terminal)', amount: m.terminal_stack_usd, btcAmount: m.btc_stack, color: '#7dd3fc', col: 1 },
    // USD-only nodes
    ...(!isBtc ? [
      { id: 'resale',  label: 'Hardware resale (Yr 4)',  amount: m.hardware_resale,       color: '#7dd3fc' as FlowColor, col: 1 },
      ...(m.ltcg_paid > 0 ? [{ id: 'ltcg', label: 'LTCG tax', amount: m.ltcg_paid, color: '#f59e0b' as FlowColor, col: 2 }] : []),
      ...(m.recapture_tax > 0 ? [{ id: 'recap', label: '§1245 recapture', amount: m.recapture_tax, color: '#f59e0b' as FlowColor, col: 2 }] : []),
      { id: 'walk',    label: 'Walk-away',               amount: m.posttax_terminal_value, color: '#94a3b8' as FlowColor, col: 2 },
    ] : []),
  ];

  const edges: FlowEdge[] = [
    // inputs → BTC stack
    { from: 'asic',   to: 'btc',    value: m.capex_gross_user,      color: '#7dd3fc' },
    ...(ongoing4yr > 0 ? [{ from: 'host', to: 'btc', value: m.cumulative_opex_usd, color: '#7dd3fc' as FlowColor }] : []),
    { from: 'shield', to: 'btc',    value: m.tax_shield,            color: '#4ade80' },
    // USD-only edges
    ...(!isBtc ? [
      { from: 'asic',   to: 'resale', value: m.hardware_resale,       color: '#7dd3fc' as FlowColor },
      ...(m.ltcg_paid > 0 ? [{ from: 'btc', to: 'ltcg', value: m.ltcg_paid, color: '#f59e0b' as FlowColor }] : []),
      { from: 'btc',    to: 'walk',   value: m.terminal_stack_usd - m.ltcg_paid, color: '#7dd3fc' as FlowColor },
      ...(m.recapture_tax > 0 ? [{ from: 'resale', to: 'recap', value: m.recapture_tax, color: '#f59e0b' as FlowColor }] : []),
      { from: 'resale', to: 'walk',   value: m.hardware_resale - m.recapture_tax, color: '#7dd3fc' as FlowColor },
    ] : []),
  ];

  return { nodes: nodes.filter(n => n.amount > 0), edges: edges.filter(e => e.value > 0) };
}

// ─── Buy path: explicit causal edges ────────────────────────────────────────

function buyFlow(r: CompareResult, denom: 'usd' | 'btc'): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const b = r.buy_detail;
  const ongoing4yr = r.inputs.annual_ongoing * 4;
  const ongoingTax = ongoing4yr * r.inputs.effective_rate;
  const ongoingBtc = ongoing4yr - ongoingTax;
  const isBtc = denom === 'btc';

  const nodes: FlowNode[] = [
    // Col 0: inputs
    { id: 'tax1',    label: 'Income tax (Yr 1)',       amount: b.tax_paid_year1,        color: '#f59e0b', col: 0 },
    { id: 'lump',    label: 'BTC lump buy (Yr 1)',     amount: b.posttax_capital,        color: '#7dd3fc', col: 0 },
    ...(ongoing4yr > 0 ? [
      { id: 'tax2',  label: 'Tax on ongoing (Yr 1–4)', amount: ongoingTax,              color: '#f59e0b' as FlowColor, col: 0 },
      { id: 'dca',   label: 'Ongoing DCA (Yr 1–4)',    amount: ongoingBtc,              color: '#7dd3fc' as FlowColor, col: 0 },
    ] : []),
    // Col 1: BTC stack
    { id: 'term',    label: isBtc ? 'BTC stacked' : 'BTC stack (terminal)', amount: b.terminal_stack_usd, btcAmount: b.btc_stack, color: '#7dd3fc', col: 1 },
    // USD-only nodes
    ...(!isBtc ? [
      ...(b.ltcg_paid > 0 ? [{ id: 'ltcg', label: 'LTCG tax', amount: b.ltcg_paid, color: '#f59e0b' as FlowColor, col: 2 }] : []),
      { id: 'walk',    label: 'Walk-away',               amount: b.posttax_terminal_value, color: '#94a3b8' as FlowColor, col: 2 },
    ] : []),
  ];

  const edges: FlowEdge[] = [
    // inputs → BTC stack
    { from: 'lump',  to: 'term',  value: b.posttax_capital,         color: '#7dd3fc' },
    ...(ongoingBtc > 0 ? [{ from: 'dca', to: 'term', value: ongoingBtc, color: '#7dd3fc' as FlowColor }] : []),
    // USD-only edges
    ...(!isBtc ? [
      ...(b.ltcg_paid > 0 ? [{ from: 'term', to: 'ltcg', value: b.ltcg_paid, color: '#f59e0b' as FlowColor }] : []),
      { from: 'term',  to: 'walk',  value: b.posttax_terminal_value,  color: '#7dd3fc' as FlowColor },
    ] : []),
  ];

  return { nodes: nodes.filter(n => n.amount > 0), edges: edges.filter(e => e.value > 0) };
}

// ─── Layout engine ──────────────────────────────────────────────────────────

const VW = 800;
const VH = 520;
const BLOCK_W = 14;
const GAP = 6;
const PAD_Y = 30;   // leave room for column headers
const MIN_BLOCK_H = 36;
const COL_X = [160, 400, 620]; // x positions for columns 0, 1, 2
const COL_LABELS_USD = ['COMMITMENT', '4-YEAR GROWTH', 'YEAR-4 (OPTIONAL) EXIT'];
const COL_LABELS_BTC = ['COMMITMENT', 'BTC ACCUMULATED', ''];

interface Rect { x: number; y: number; h: number }

function layoutColumn(nodes: FlowNode[]): Map<string, Rect> {
  if (nodes.length === 0) return new Map();
  const total = nodes.reduce((s, n) => s + n.amount, 0);
  const totalGaps = (nodes.length - 1) * GAP;
  const availH = VH - 2 * PAD_Y - totalGaps;

  let heights = nodes.map(n => Math.max(MIN_BLOCK_H, (n.amount / total) * availH));
  const sumH = heights.reduce((s, h) => s + h, 0);
  if (sumH > availH) {
    const excess = sumH - availH;
    const shrinkable = heights.filter(h => h > MIN_BLOCK_H);
    const shrinkTotal = shrinkable.reduce((s, h) => s + h, 0);
    heights = heights.map(h => h > MIN_BLOCK_H ? h - excess * (h / shrinkTotal) : h);
  }

  const result = new Map<string, Rect>();
  let y = PAD_Y;
  nodes.forEach((n, i) => {
    result.set(n.id, { x: COL_X[n.col], y, h: heights[i] });
    y += heights[i] + GAP;
  });
  return result;
}

// ─── SVG Renderer ───────────────────────────────────────────────────────────

function fmtVal(amount: number, denom: 'usd' | 'btc', denomPrice: number, btcAmount?: number): string {
  if (denom === 'btc') {
    // Use actual BTC count if available (real holdings), else convert USD at today's price
    const btc = btcAmount ?? (amount / denomPrice);
    return `${btc.toFixed(btc >= 1 ? 2 : 4)} BTC`;
  }
  return fmtLargeUsd(amount);
}

function FlowDiagram({
  nodes,
  edges,
  title,
  denom,
  termPrice,
}: {
  nodes: FlowNode[];
  edges: FlowEdge[];
  title: string;
  denom: 'usd' | 'btc';
  termPrice: number;
}) {
  const [hovKey, setHovKey] = useState<string | null>(null);

  // Layout each column independently
  const col0 = nodes.filter(n => n.col === 0);
  const col1 = nodes.filter(n => n.col === 1);
  const col2 = nodes.filter(n => n.col === 2);
  const layout = new Map([
    ...layoutColumn(col0),
    ...layoutColumn(col1),
    ...layoutColumn(col2),
  ]);

  // Build ribbons with port tracking (cumulative offsets per node side)
  const outPortY = new Map<string, number>(); // right edge of source
  const inPortY = new Map<string, number>();  // left edge of target
  nodes.forEach(n => {
    const r = layout.get(n.id);
    if (r) { outPortY.set(n.id, r.y); inPortY.set(n.id, r.y); }
  });

  const ribbons = edges.map((e, i) => {
    const fromRect = layout.get(e.from);
    const toRect = layout.get(e.to);
    if (!fromRect || !toRect) return null;

    const fromTotal = edges.filter(x => x.from === e.from).reduce((s, x) => s + x.value, 0);
    const toTotal = edges.filter(x => x.to === e.to).reduce((s, x) => s + x.value, 0);

    const h1 = fromTotal > 0 ? (e.value / fromTotal) * fromRect.h : 0;
    const h2 = toTotal > 0 ? (e.value / toTotal) * toRect.h : 0;

    const y1 = outPortY.get(e.from) ?? 0;
    const y2 = inPortY.get(e.to) ?? 0;

    outPortY.set(e.from, y1 + h1);
    inPortY.set(e.to, y2 + h2);

    const x1 = fromRect.x + BLOCK_W;
    const x2 = toRect.x;
    const cx1 = x1 + (x2 - x1) * 0.4;
    const cx2 = x1 + (x2 - x1) * 0.6;

    const key = `${e.from}-${e.to}-${i}`;
    return { key, y1, h1, y2, h2, x1, x2, cx1, cx2, color: e.color };
  }).filter(Boolean) as Array<{
    key: string; y1: number; h1: number; y2: number; h2: number;
    x1: number; x2: number; cx1: number; cx2: number; color: FlowColor;
  }>;

  return (
    <div>
      <div className="mb-2 text-xs font-medium uppercase tracking-wider text-fg-muted">{title}</div>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setHovKey(null)}
      >
        {/* Column headers */}
        {COL_X.map((x, i) => {
          const label = (denom === 'btc' ? COL_LABELS_BTC : COL_LABELS_USD)[i];
          if (!label) return null;
          return (
            <text
              key={`col-${i}`}
              x={x + BLOCK_W / 2}
              y={14}
              textAnchor="middle"
              fontSize={9}
              fontWeight={600}
              fontFamily="monospace"
              letterSpacing="0.08em"
              className="fill-fg-faint"
            >
              {label}
            </text>
          );
        })}

        {/* Ribbons */}
        {ribbons.map(r => {
          const dimmed = hovKey !== null && hovKey !== r.key;
          return (
            <path
              key={r.key}
              d={[
                `M${r.x1},${r.y1}`,
                `C${r.cx1},${r.y1} ${r.cx2},${r.y2} ${r.x2},${r.y2}`,
                `L${r.x2},${r.y2 + r.h2}`,
                `C${r.cx2},${r.y2 + r.h2} ${r.cx1},${r.y1 + r.h1} ${r.x1},${r.y1 + r.h1}`,
                'Z',
              ].join(' ')}
              fill={r.color}
              fillOpacity={dimmed ? 0.06 : 0.18}
              stroke={r.color}
              strokeWidth={0.5}
              strokeOpacity={dimmed ? 0.05 : 0.25}
              className="cursor-pointer transition-opacity"
              onMouseEnter={() => setHovKey(r.key)}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map(n => {
          const r = layout.get(n.id);
          if (!r) return null;
          const isLeft = n.col === 0;
          const isRight = n.col === 2;
          const isMid = n.col === 1;
          const textX = isLeft ? r.x - 6 : r.x + BLOCK_W + 6;
          const anchor = isLeft ? 'end' : 'start';
          // Dead-end tax nodes at col 0 (Buy income tax) — label on right since no outgoing edge
          const hasOutEdge = edges.some(e => e.from === n.id);
          const labelX = (isLeft && !hasOutEdge) ? r.x + BLOCK_W + 6 : textX;
          const labelAnchor = (isLeft && !hasOutEdge) ? 'start' : anchor;

          return (
            <g key={n.id}>
              <rect
                x={r.x} y={r.y} width={BLOCK_W} height={r.h} rx={2}
                fill={n.color} fillOpacity={0.7}
              />
              <text
                x={labelX} y={r.y + r.h / 2 - 6}
                textAnchor={labelAnchor}
                fontSize={11} fontFamily="monospace" className="fill-fg-muted"
              >
                {n.label}
              </text>
              <text
                x={labelX} y={r.y + r.h / 2 + 7}
                textAnchor={labelAnchor}
                fontSize={13} fontWeight={600} fontFamily="monospace" className="fill-fg"
              >
                {n.color === '#f59e0b' ? '−' : ''}{fmtVal(n.amount, denom, termPrice, n.btcAmount)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Exported component ─────────────────────────────────────────────────────

export function MoneyFlow({ result, denom, termPrice }: { result: CompareResult; denom: 'usd' | 'btc'; termPrice: number }) {
  const mine = mineFlow(result, denom);
  const buy = buyFlow(result, denom);

  return (
    <Panel
      title="Money Flow"
      subtitle={denom === 'btc'
        ? 'BTC accumulation across a 4-year simulation'
        : 'Where every dollar goes across the 4-year horizon'}
    >
      <p className="mb-4 text-2xs text-fg-faint leading-relaxed">
        {denom === 'btc'
          ? 'BTC accumulation across a 4-year simulation. Exit taxes (LTCG, §1245) only apply on sale and are hidden here — most operators stack, not sell.'
          : 'Pre-tax capital flows left to right through a 4-year simulation. Year-4 exit taxes assume sale of BTC and hardware; operators who HODL avoid LTCG and §1245 until realization.'}
      </p>
      <div className="grid gap-8 md:grid-cols-2">
        <FlowDiagram nodes={mine.nodes} edges={mine.edges} title="Mine + Ops" denom={denom} termPrice={termPrice} />
        <FlowDiagram nodes={buy.nodes} edges={buy.edges} title="Lump + DCA" denom={denom} termPrice={termPrice} />
      </div>
      <p className="mt-4 text-2xs text-fg-faint leading-relaxed">
        Blue = productive capital / returns. Amber = tax outflows. Green = tax refund (Sec 179). Hover ribbons to isolate a flow.
      </p>
    </Panel>
  );
}
