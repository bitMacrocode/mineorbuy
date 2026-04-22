'use client';

import { useState } from 'react';
import type { CompareResult } from '@mineorbuy/engine';
import { fmtLargeUsd } from '@/lib/format';
import { Panel } from './ui';

// ─── Flow data derivation ───────────────────────────────────────────────────

interface FlowLink {
  id: string;
  from: string;
  to: string;
  value: number;
  color: string;
  label: string;
  derivation: string;
}

interface FlowNode {
  id: string;
  label: string;
  value: number;
  column: number;
  color: string;
}

function deriveMineFlows(r: CompareResult): { nodes: FlowNode[]; links: FlowLink[] } {
  const m = r.mine_detail;
  const totalIn = r.inputs.pretax_capital + r.inputs.annual_ongoing * 4;
  const ongoing4yr = r.inputs.annual_ongoing * 4;

  const nodes: FlowNode[] = [
    { id: 'm-in', label: 'Pre-tax committed', value: totalIn, column: 0, color: '#94a3b8' },
    { id: 'm-hw', label: 'Hardware CapEx', value: m.capex_gross_user, column: 1, color: '#7dd3fc' },
    { id: 'm-shield', label: 'Tax Shield', value: m.tax_shield, column: 1, color: '#22d3ee' },
    { id: 'm-host', label: 'Hosting (4yr)', value: m.cumulative_opex_usd, column: 1, color: '#7dd3fc' },
    { id: 'm-btc', label: 'BTC Stack', value: m.terminal_stack_usd, column: 2, color: '#7dd3fc' },
    { id: 'm-resale', label: 'HW Resale', value: m.hardware_resale, column: 2, color: '#7dd3fc' },
    { id: 'm-tax', label: 'Exit Taxes', value: m.recapture_tax + m.ltcg_paid, column: 2, color: '#f59e0b' },
    { id: 'm-out', label: 'Walk-away', value: m.posttax_terminal_value, column: 3, color: '#94a3b8' },
  ];

  const links: FlowLink[] = [
    {
      id: 'ml-hw', from: 'm-in', to: 'm-hw', value: m.capex_gross_user,
      color: '#7dd3fc', label: 'Hardware purchase',
      derivation: `Pre-tax capital ${fmtLargeUsd(r.inputs.pretax_capital)} allocated to ASIC purchase`,
    },
    ...(ongoing4yr > 0 ? [{
      id: 'ml-host', from: 'm-in', to: 'm-host', value: ongoing4yr,
      color: '#7dd3fc', label: 'Hosting opex (ongoing)',
      derivation: `${fmtLargeUsd(r.inputs.annual_ongoing)}/yr × 4yr = ${fmtLargeUsd(ongoing4yr)} total hosting`,
    }] : []),
    {
      id: 'ml-shield', from: 'm-shield', to: 'm-hw', value: m.tax_shield,
      color: '#22d3ee', label: 'Sec 179 tax shield (refund)',
      derivation: `CapEx ${fmtLargeUsd(m.capex_total)} × marginal rate = ${fmtLargeUsd(m.tax_shield)} refunded`,
    },
    {
      id: 'ml-btc', from: 'm-hw', to: 'm-btc', value: m.terminal_stack_usd,
      color: '#7dd3fc', label: 'Mining → BTC appreciation',
      derivation: `${m.btc_stack.toFixed(4)} BTC mined × terminal price = ${fmtLargeUsd(m.terminal_stack_usd)}`,
    },
    {
      id: 'ml-resale', from: 'm-hw', to: 'm-resale', value: m.hardware_resale,
      color: '#7dd3fc', label: 'Hardware resale (yr 4)',
      derivation: `CapEx ${fmtLargeUsd(m.capex_total)} × 15% resale = ${fmtLargeUsd(m.hardware_resale)}`,
    },
    {
      id: 'ml-recap', from: 'm-resale', to: 'm-tax', value: m.recapture_tax,
      color: '#f59e0b', label: '§1245 recapture',
      derivation: `Resale ${fmtLargeUsd(m.hardware_resale)} × marginal rate = ${fmtLargeUsd(m.recapture_tax)}`,
    },
    ...(m.ltcg_paid > 0 ? [{
      id: 'ml-ltcg', from: 'm-btc', to: 'm-tax', value: m.ltcg_paid,
      color: '#f59e0b', label: 'LTCG on BTC gain',
      derivation: `Gain above cost basis × 20% = ${fmtLargeUsd(m.ltcg_paid)}`,
    }] : []),
    {
      id: 'ml-out', from: 'm-btc', to: 'm-out', value: m.posttax_terminal_value,
      color: '#7dd3fc', label: 'After-tax terminal',
      derivation: `BTC + resale − taxes = ${fmtLargeUsd(m.posttax_terminal_value)}`,
    },
  ];

  return { nodes, links };
}

function deriveBuyFlows(r: CompareResult): { nodes: FlowNode[]; links: FlowLink[] } {
  const b = r.buy_detail;
  const totalIn = r.inputs.pretax_capital + r.inputs.annual_ongoing * 4;
  const ongoing4yr = r.inputs.annual_ongoing * 4;
  const ongoingTax = ongoing4yr * r.inputs.effective_rate;
  const ongoingBtc = ongoing4yr - ongoingTax;

  const nodes: FlowNode[] = [
    { id: 'b-in', label: 'Pre-tax committed', value: totalIn, column: 0, color: '#94a3b8' },
    { id: 'b-tax1', label: 'Income Tax', value: b.tax_paid_year1 + ongoingTax, column: 1, color: '#f59e0b' },
    { id: 'b-btc', label: 'BTC Purchased', value: b.posttax_capital + ongoingBtc, column: 1, color: '#7dd3fc' },
    { id: 'b-term', label: 'Terminal BTC', value: b.terminal_stack_usd, column: 2, color: '#7dd3fc' },
    { id: 'b-ltcg', label: 'LTCG Tax', value: b.ltcg_paid, column: 2, color: '#f59e0b' },
    { id: 'b-out', label: 'Walk-away', value: b.posttax_terminal_value, column: 3, color: '#94a3b8' },
  ];

  const links: FlowLink[] = [
    {
      id: 'bl-tax1', from: 'b-in', to: 'b-tax1', value: b.tax_paid_year1,
      color: '#f59e0b', label: 'Income tax (lump)',
      derivation: `${fmtLargeUsd(r.inputs.pretax_capital)} × ${(r.inputs.effective_rate * 100).toFixed(0)}% effective = ${fmtLargeUsd(b.tax_paid_year1)}`,
    },
    {
      id: 'bl-btc1', from: 'b-in', to: 'b-btc', value: b.posttax_capital,
      color: '#7dd3fc', label: 'Lump BTC purchase',
      derivation: `${fmtLargeUsd(r.inputs.pretax_capital)} − tax = ${fmtLargeUsd(b.posttax_capital)} DCA'd over 12mo`,
    },
    ...(ongoing4yr > 0 ? [
      {
        id: 'bl-tax2', from: 'b-in', to: 'b-tax1', value: ongoingTax,
        color: '#f59e0b', label: 'Income tax (ongoing DCA)',
        derivation: `${fmtLargeUsd(ongoing4yr)} ongoing × ${(r.inputs.effective_rate * 100).toFixed(0)}% = ${fmtLargeUsd(ongoingTax)}`,
      },
      {
        id: 'bl-btc2', from: 'b-in', to: 'b-btc', value: ongoingBtc,
        color: '#7dd3fc', label: 'Ongoing DCA (after tax)',
        derivation: `${fmtLargeUsd(ongoing4yr)} − tax = ${fmtLargeUsd(ongoingBtc)} to BTC across 48mo`,
      },
    ] : []),
    {
      id: 'bl-term', from: 'b-btc', to: 'b-term', value: b.terminal_stack_usd,
      color: '#7dd3fc', label: 'BTC appreciation',
      derivation: `${b.btc_stack.toFixed(4)} BTC × terminal price = ${fmtLargeUsd(b.terminal_stack_usd)}`,
    },
    ...(b.ltcg_paid > 0 ? [{
      id: 'bl-ltcg', from: 'b-term', to: 'b-ltcg', value: b.ltcg_paid,
      color: '#f59e0b', label: 'LTCG on BTC gain',
      derivation: `Gain above cost basis × 20% = ${fmtLargeUsd(b.ltcg_paid)}`,
    }] : []),
    {
      id: 'bl-out', from: 'b-term', to: 'b-out', value: b.posttax_terminal_value,
      color: '#7dd3fc', label: 'After-tax terminal',
      derivation: `Terminal − LTCG = ${fmtLargeUsd(b.posttax_terminal_value)}`,
    },
  ];

  return { nodes, links };
}

// ─── SVG Sankey renderer ────────────────────────────────────────────────────

const COL_X = [30, 220, 430, 620];
const NODE_W = 120;
const VIEW_W = 770;
const VIEW_H = 320;

function layoutNodes(nodes: FlowNode[]): Map<string, { x: number; y: number; h: number }> {
  const layout = new Map<string, { x: number; y: number; h: number }>();
  const maxVal = Math.max(...nodes.map(n => n.value), 1);
  const colGroups = new Map<number, FlowNode[]>();
  for (const n of nodes) {
    const arr = colGroups.get(n.column) ?? [];
    arr.push(n);
    colGroups.set(n.column, arr);
  }

  for (const [col, group] of colGroups) {
    const x = COL_X[col] ?? 0;
    let y = 20;
    for (const n of group) {
      const h = Math.max(20, (n.value / maxVal) * 180);
      layout.set(n.id, { x, y, h });
      y += h + 12;
    }
  }

  return layout;
}

function SankeyPath({
  link,
  fromRect,
  toRect,
  maxVal,
  onHover,
}: {
  link: FlowLink;
  fromRect: { x: number; y: number; h: number };
  toRect: { x: number; y: number; h: number };
  maxVal: number;
  onHover: (link: FlowLink | null, e?: React.MouseEvent) => void;
}) {
  const sw = Math.max(2, (link.value / maxVal) * 60);
  const x1 = fromRect.x + NODE_W;
  const y1 = fromRect.y + fromRect.h / 2;
  const x2 = toRect.x;
  const y2 = toRect.y + toRect.h / 2;
  const cx = (x1 + x2) / 2;

  return (
    <path
      d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
      fill="none"
      stroke={link.color}
      strokeWidth={sw}
      strokeOpacity={0.35}
      className="transition-all hover:!stroke-opacity-70 cursor-pointer"
      onMouseEnter={(e) => onHover(link, e)}
      onMouseLeave={() => onHover(null)}
    />
  );
}

function SankeyDiagram({
  nodes,
  links,
  title,
}: {
  nodes: FlowNode[];
  links: FlowLink[];
  title: string;
}) {
  const [hovered, setHovered] = useState<{ link: FlowLink; x: number; y: number } | null>(null);
  const layout = layoutNodes(nodes);
  const maxVal = Math.max(...nodes.map(n => n.value), 1);

  const handleHover = (link: FlowLink | null, e?: React.MouseEvent) => {
    if (link && e) {
      const rect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect();
      setHovered({ link, x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) });
    } else {
      setHovered(null);
    }
  };

  return (
    <div className="relative">
      <div className="mb-1 text-xs font-medium uppercase tracking-wider text-fg-muted">{title}</div>
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Links */}
        {links.map(link => {
          const from = layout.get(link.from);
          const to = layout.get(link.to);
          if (!from || !to) return null;
          return (
            <SankeyPath
              key={link.id}
              link={link}
              fromRect={from}
              toRect={to}
              maxVal={maxVal}
              onHover={handleHover}
            />
          );
        })}
        {/* Nodes */}
        {nodes.map(n => {
          const pos = layout.get(n.id);
          if (!pos) return null;
          return (
            <g key={n.id}>
              <rect
                x={pos.x}
                y={pos.y}
                width={NODE_W}
                height={pos.h}
                rx={3}
                fill={n.color}
                fillOpacity={0.15}
                stroke={n.color}
                strokeWidth={1}
                strokeOpacity={0.4}
              />
              <text
                x={pos.x + NODE_W / 2}
                y={pos.y + pos.h / 2 - 5}
                textAnchor="middle"
                className="fill-fg-muted"
                fontSize={9}
                fontFamily="monospace"
              >
                {n.label}
              </text>
              <text
                x={pos.x + NODE_W / 2}
                y={pos.y + pos.h / 2 + 8}
                textAnchor="middle"
                className="fill-fg"
                fontSize={10}
                fontWeight={600}
                fontFamily="monospace"
              >
                {fmtLargeUsd(n.value)}
              </text>
            </g>
          );
        })}
      </svg>
      {/* Tooltip */}
      {hovered && (
        <div
          className="pointer-events-none absolute z-10 rounded border border-edge bg-bg-panel px-3 py-2 text-xs shadow-lg"
          style={{ left: Math.min(hovered.x + 12, VIEW_W - 200), top: hovered.y - 60 }}
        >
          <div className="font-medium text-fg">{hovered.link.label}</div>
          <div className="mt-0.5 tabular text-fg-muted">{fmtLargeUsd(hovered.link.value)}</div>
          <div className="mt-1 text-fg-faint">{hovered.link.derivation}</div>
        </div>
      )}
    </div>
  );
}

// ─── Exported component ─────────────────────────────────────────────────────

export function MoneyFlow({ result }: { result: CompareResult }) {
  const mine = deriveMineFlows(result);
  const buy = deriveBuyFlows(result);

  return (
    <Panel title="Money Flow — Where Every Dollar Goes" subtitle="Hover for exact derivation">
      <div className="grid gap-6 md:grid-cols-2">
        <SankeyDiagram nodes={mine.nodes} links={mine.links} title="Mine + Ops" />
        <SankeyDiagram nodes={buy.nodes} links={buy.links} title="Lump + DCA" />
      </div>
      <p className="mt-3 text-2xs text-fg-faint leading-relaxed">
        Tracked in nominal dollars. Tax shield is shown as a credit flowing back; it is not double-counted as reinvestment.
      </p>
    </Panel>
  );
}
