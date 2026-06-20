export function formatRelativeTime(timestamp: number): string {
  const ts = timestamp > 1e12 ? timestamp : timestamp * 1000;
  const diffMs = Date.now() - ts;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;

  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

function smartDecimals(value: number): number {
  if (!value || !isFinite(value)) return 2;
  const abs = Math.abs(value);
  if (abs >= 0.01) return 2;
  return Math.min(8, Math.ceil(-Math.log10(abs)));
}

export function formatEur(value: number, fractionDigits?: number): string {
  if (value === undefined || value === null || !isFinite(value)) return "€0.00";
  const digits = fractionDigits ?? smartDecimals(value);
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatUsd(value: number): string {
  const digits = smartDecimals(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatCurrency(value: number, currency: string): string {
  if (value === undefined || value === null || !isFinite(value)) return `${currency.toUpperCase()} 0.00`;
  const digits = smartDecimals(value);
  try {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  } catch {
    return `${value.toFixed(digits)} ${currency.toUpperCase()}`;
  }
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCrypto(value: number, decimals = 6): string {
  return value.toFixed(decimals);
}
