/**
 * UI primitives. Minimal, composable, terminal-aesthetic.
 */

import React from 'react';

export function Panel({
  children,
  className = '',
  title,
  subtitle,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-edge bg-bg-panel ${className}`}
    >
      {title && (
        <header className="border-b border-edge px-4 py-2.5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-fg-faint">{subtitle}</p>
          )}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function StatRow({
  label,
  mine,
  buy,
  emphasis = false,
  mineColor,
  buyColor,
}: {
  label: string;
  mine?: string | React.ReactNode;
  buy?: string | React.ReactNode;
  emphasis?: boolean;
  mineColor?: string;
  buyColor?: string;
}) {
  const labelCls = emphasis
    ? 'text-fg text-sm font-medium'
    : 'text-fg-muted text-sm';
  const valueCls = emphasis ? 'text-base font-semibold tabular' : 'text-sm tabular';
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-6 py-1.5">
      <span className={labelCls}>{label}</span>
      <span className={`${valueCls} text-right ${mineColor ?? 'text-mine'}`}>
        {mine ?? '—'}
      </span>
      <span className={`${valueCls} text-right ${buyColor ?? 'text-buy'} min-w-[120px]`}>
        {buy ?? '—'}
      </span>
    </div>
  );
}

export function SingleRow({
  label,
  value,
  emphasis = false,
  muted = false,
}: {
  label: string;
  value: string | React.ReactNode;
  emphasis?: boolean;
  muted?: boolean;
}) {
  const labelCls = muted
    ? 'text-fg-faint text-xs'
    : emphasis
      ? 'text-fg text-sm font-medium'
      : 'text-fg-muted text-sm';
  const valueCls = emphasis
    ? 'text-base font-semibold tabular'
    : muted
      ? 'text-xs tabular text-fg-muted'
      : 'text-sm tabular text-fg';
  return (
    <div className="flex items-baseline justify-between py-1">
      <span className={labelCls}>{label}</span>
      <span className={valueCls}>{value}</span>
    </div>
  );
}

export function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-fg-muted">
          {label}
        </span>
        {hint && <span className="text-2xs text-fg-faint">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded border border-edge bg-bg-soft px-3 py-2 text-sm text-fg tabular outline-none transition-colors focus:border-edge-strong focus:bg-bg-elev ${props.className ?? ''}`}
    />
  );
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode },
) {
  return (
    <select
      {...props}
      className={`w-full rounded border border-edge bg-bg-soft px-3 py-2 text-sm text-fg outline-none transition-colors focus:border-edge-strong focus:bg-bg-elev ${props.className ?? ''}`}
    >
      {props.children}
    </select>
  );
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string; tagline?: string }>;
}) {
  return (
    <div className="flex gap-1 rounded border border-edge bg-bg-soft p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded px-2 py-1.5 text-left text-xs transition-colors ${
              active
                ? 'bg-bg-elev text-fg'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            <div className={`font-medium ${active ? 'text-fg' : ''}`}>{opt.label}</div>
            {opt.tagline && (
              <div className="mt-0.5 text-2xs text-fg-faint">{opt.tagline}</div>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'mine' | 'buy' | 'win' | 'loss' | 'warn';
  children: React.ReactNode;
}) {
  const toneCls =
    tone === 'mine'
      ? 'bg-mine/15 text-mine ring-mine/30'
      : tone === 'buy'
        ? 'bg-buy/15 text-buy ring-buy/30'
        : tone === 'win'
          ? 'bg-win/15 text-win ring-win/30'
          : tone === 'loss'
            ? 'bg-loss/15 text-loss ring-loss/30'
            : tone === 'warn'
              ? 'bg-warn/15 text-warn ring-warn/30'
              : 'bg-bg-elev text-fg-muted ring-edge';
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-2xs font-medium uppercase tracking-wider ring-1 ring-inset ${toneCls}`}
    >
      {children}
    </span>
  );
}
