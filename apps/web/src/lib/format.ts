/**
 * Number formatting helpers for financial display.
 */

export function fmtBtc(n: number, digits = 4): string {
  const sign = n < 0 ? '−' : '';
  return `${sign}${Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function fmtUsd(n: number, opts: { cents?: boolean; signed?: boolean } = {}): string {
  const { cents = false, signed = false } = opts;
  const abs = Math.abs(n);
  const sign = signed && n > 0 ? '+' : n < 0 ? '−' : '';
  const digits = cents ? 2 : 0;
  return `${sign}$${abs.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function fmtPct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
}

export function fmtSigned(n: number, digits = 4): string {
  const sign = n >= 0 ? '+' : '−';
  return `${sign}${Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function fmtUsdSigned(n: number): string {
  return fmtUsd(n, { signed: true });
}

export function fmtKwh(n: number): string {
  return `$${n.toFixed(3)}/kWh`;
}

export function fmtLargeUsd(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}
