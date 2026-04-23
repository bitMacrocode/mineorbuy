'use client';

import { useState } from 'react';
import type { CompareResult } from '@mineorbuy/engine';
import { fmtLargeUsd } from '@/lib/format';
import { Panel } from './ui';

// ─── Data types ─────────────────────────────────────────────────────────────

type FlowColor = '#7dd3fc' | '#f59e0b' | '#4ade80' | '#94a3b8';

interface FlowItem {
  label: string;
  amount: number;
  color: FlowColor;
}

// ─── Derive inputs/outputs for each path ────────────────────────────────────

function mineData(r: CompareResult): { inputs: FlowItem[]; outputs: FlowItem[] } {
  const m = r.mine_detail;
  const ongoing4yr = r.inputs.annual_ongoing * 4;

  const inputs: FlowItem[] = [
    { label: 'ASIC purchase (Yr 1)', amount: m.capex_gross_user, color: '#7dd3fc' },
    ...(ongoing4yr > 0 ? [{ label: 'Hosting opex (Yr 1–4)', amount: m.cumulative_opex_usd, color: '#7dd3fc' as FlowColor }] : []),
    { label: 'Sec 179 tax refund', amount: m.tax_shield, color: '#4ade80' },
  ];

  const outputs: FlowItem[] = [
    { label: 'BTC mined (terminal)', amount: m.terminal_stack_usd, color: '#7dd3fc' },
    { label: 'Hardware resale (Yr 4)', amount: m.hardware_resale, color: '#7dd3fc' },
    ...(m.ltcg_paid > 0 ? [{ label: 'LTCG tax', amount: m.ltcg_paid, color: '#f59e0b' as FlowColor }] : []),
    ...(m.recapture_tax > 0 ? [{ label: '§1245 recapture', amount: m.recapture_tax, color: '#f59e0b' as FlowColor }] : []),
  ];

  return { inputs, outputs };
}

function buyData(r: CompareResult): { inputs: FlowItem[]; outputs: FlowItem[] } {
  const b = r.buy_detail;
  const ongoing4yr = r.inputs.annual_ongoing * 4;
  const ongoingTax = ongoing4yr * r.inputs.effective_rate;

  const inputs: FlowItem[] = [
    { label: 'Income tax (Yr 1)', amount: b.tax_paid_year1, color: '#f59e0b' },
    { label: 'BTC lump buy (Yr 1)', amount: b.posttax_capital, color: '#7dd3fc' },
    ...(ongoing4yr > 0 ? [
      { label: 'Tax on ongoing (Yr 1–4)', amount: ongoingTax, color: '#f59e0b' as FlowColor },
      { label: 'Ongoing DCA (Yr 1–4)', amount: ongoing4yr - ongoingTax, color: '#7dd3fc' as FlowColor },
    ] : []),
  ];

  const outputs: FlowItem[] = [
    { label: 'BTC stack (terminal)', amount: b.terminal_stack_usd, color: '#7dd3fc' },
    ...(b.ltcg_paid > 0 ? [{ label: 'LTCG tax', amount: b.ltcg_paid, color: '#f59e0b' as FlowColor }] : []),
  ];

  return { inputs, outputs };
}

// ─── Sankey SVG renderer (mempool.space transaction style) ──────────────────

const VW = 800;
const VH = 500;
const BLOCK_W = 14;
const LEFT_X = 160;       // right edge of left labels area
const RIGHT_X = VW - 160; // left edge of right labels area
const GAP = 6;
const PAD_Y = 10;
const MIN_BLOCK_H = 36;   // enough for two lines of text

interface BlockPos { y: number; h: number }

function stackBlocks(items: FlowItem[]): BlockPos[] {
  const total = items.reduce((s, i) => s + i.amount, 0);
  const totalGaps = (items.length - 1) * GAP;
  const availH = VH - 2 * PAD_Y - totalGaps;

  // First pass: proportional heights clamped to minimum
  let heights = items.map(item => Math.max(MIN_BLOCK_H, (item.amount / total) * availH));

  // If clamping expanded total, scale the large items down to fit
  const sumH = heights.reduce((s, h) => s + h, 0);
  if (sumH > availH) {
    const excess = sumH - availH;
    const shrinkable = heights.filter(h => h > MIN_BLOCK_H);
    const shrinkTotal = shrinkable.reduce((s, h) => s + h, 0);
    heights = heights.map(h => h > MIN_BLOCK_H ? h - excess * (h / shrinkTotal) : h);
  }

  const positions: BlockPos[] = [];
  let y = PAD_Y;
  for (const h of heights) {
    positions.push({ y, h });
    y += h + GAP;
  }
  return positions;
}

function FlowDiagram({
  inputs,
  outputs,
  title,
}: {
  inputs: FlowItem[];
  outputs: FlowItem[];
  title: string;
}) {
  const [hovIdx, setHovIdx] = useState<string | null>(null);
  const inPos = stackBlocks(inputs);
  const outPos = stackBlocks(outputs);

  const totalIn = inputs.reduce((s, i) => s + i.amount, 0);
  const totalOut = outputs.reduce((s, i) => s + i.amount, 0);

  // Build ribbon flows: each (input, output) pair gets a proportional ribbon
  const ribbons: Array<{
    key: string;
    y1: number; h1: number;
    y2: number; h2: number;
    color: FlowColor;
  }> = [];

  // Track cumulative offsets within each block
  const inOffsets = inputs.map(() => 0);
  const outOffsets = outputs.map(() => 0);

  for (let i = 0; i < inputs.length; i++) {
    for (let j = 0; j < outputs.length; j++) {
      // How much of input i flows to output j
      const h1 = inPos[i].h * (outputs[j].amount / totalOut);
      const h2 = outPos[j].h * (inputs[i].amount / totalIn);

      ribbons.push({
        key: `${i}-${j}`,
        y1: inPos[i].y + inOffsets[i],
        h1,
        y2: outPos[j].y + outOffsets[j],
        h2,
        color: outputs[j].color,
      });

      inOffsets[i] += h1;
      outOffsets[j] += h2;
    }
  }

  const x1 = LEFT_X;
  const x2 = RIGHT_X;
  const cx1 = x1 + (x2 - x1) * 0.4;
  const cx2 = x1 + (x2 - x1) * 0.6;

  return (
    <div>
      <div className="mb-2 text-xs font-medium uppercase tracking-wider text-fg-muted">{title}</div>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setHovIdx(null)}
      >
        {/* Ribbons */}
        {ribbons.map(r => {
          const dimmed = hovIdx !== null && hovIdx !== r.key;
          return (
            <path
              key={r.key}
              d={[
                `M${x1 + BLOCK_W},${r.y1}`,
                `C${cx1},${r.y1} ${cx2},${r.y2} ${x2},${r.y2}`,
                `L${x2},${r.y2 + r.h2}`,
                `C${cx2},${r.y2 + r.h2} ${cx1},${r.y1 + r.h1} ${x1 + BLOCK_W},${r.y1 + r.h1}`,
                'Z',
              ].join(' ')}
              fill={r.color}
              fillOpacity={dimmed ? 0.06 : 0.18}
              stroke={r.color}
              strokeWidth={0.5}
              strokeOpacity={dimmed ? 0.05 : 0.25}
              className="cursor-pointer transition-opacity"
              onMouseEnter={() => setHovIdx(r.key)}
            />
          );
        })}

        {/* Left blocks + labels */}
        {inputs.map((item, i) => {
          const p = inPos[i];
          return (
            <g key={`in-${i}`}>
              <rect x={x1} y={p.y} width={BLOCK_W} height={p.h} rx={2} fill={item.color} fillOpacity={0.7} />
              <text x={x1 - 6} y={p.y + p.h / 2 - 6} textAnchor="end" fontSize={11} fontFamily="monospace" className="fill-fg-muted">
                {item.label}
              </text>
              <text x={x1 - 6} y={p.y + p.h / 2 + 7} textAnchor="end" fontSize={13} fontWeight={600} fontFamily="monospace" className="fill-fg">
                {fmtLargeUsd(item.amount)}
              </text>
            </g>
          );
        })}

        {/* Right blocks + labels */}
        {outputs.map((item, j) => {
          const p = outPos[j];
          return (
            <g key={`out-${j}`}>
              <rect x={x2} y={p.y} width={BLOCK_W} height={p.h} rx={2} fill={item.color} fillOpacity={0.7} />
              <text x={x2 + BLOCK_W + 6} y={p.y + p.h / 2 - 6} textAnchor="start" fontSize={11} fontFamily="monospace" className="fill-fg-muted">
                {item.label}
              </text>
              <text x={x2 + BLOCK_W + 6} y={p.y + p.h / 2 + 7} textAnchor="start" fontSize={13} fontWeight={600} fontFamily="monospace" className="fill-fg">
                {item.color === '#f59e0b' ? '−' : ''}{fmtLargeUsd(item.amount)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Exported component ─────────────────────────────────────────────────────

export function MoneyFlow({ result }: { result: CompareResult }) {
  const mine = mineData(result);
  const buy = buyData(result);

  return (
    <Panel title="Money Flow" subtitle="Where every dollar goes across the 4-year horizon">
      <div className="grid gap-8 md:grid-cols-2">
        <FlowDiagram inputs={mine.inputs} outputs={mine.outputs} title="Mine + Ops" />
        <FlowDiagram inputs={buy.inputs} outputs={buy.outputs} title="Lump + DCA" />
      </div>
      <p className="mt-4 text-2xs text-fg-faint leading-relaxed">
        Blue = productive capital / returns. Amber = tax outflows. Green = tax refund (Sec 179). Hover ribbons to isolate a flow.
      </p>
    </Panel>
  );
}
