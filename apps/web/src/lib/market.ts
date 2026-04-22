/**
 * Live data fetchers: BTC price from CoinGecko, network hashrate & next
 * difficulty adjustment from mempool.space. All cached at the edge to avoid
 * rate limits. Falls back to hardcoded defaults if fetch fails.
 */

import { DEFAULT_BTC_PRICE, DEFAULT_NETWORK_EH } from '@mineorbuy/engine';

export interface MarketData {
  btcPrice: number;
  networkHashrateEh: number;
  difficultyNextAdjustmentPct: number;
  blockHeight: number;
  avgBlockTimeSec: number;
  fetchedAt: string;
  sources: { btc: string; hashrate: string };
  stale: boolean;
}

const FALLBACK: MarketData = {
  btcPrice: DEFAULT_BTC_PRICE,
  networkHashrateEh: DEFAULT_NETWORK_EH,
  difficultyNextAdjustmentPct: 0,
  blockHeight: 0,
  avgBlockTimeSec: 600,
  fetchedAt: new Date().toISOString(),
  sources: { btc: 'default', hashrate: 'default' },
  stale: true,
};

export async function fetchMarketData(): Promise<MarketData> {
  try {
    const [btcRes, hrRes, diffRes, heightRes] = await Promise.allSettled([
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', {
        next: { revalidate: 300 }, // 5 min cache
      }),
      fetch('https://mempool.space/api/v1/mining/hashrate/3d', {
        next: { revalidate: 3600 }, // 1 hr cache
      }),
      fetch('https://mempool.space/api/v1/difficulty-adjustment', {
        next: { revalidate: 600 }, // 10 min cache
      }),
      fetch('https://mempool.space/api/blocks/tip/height', {
        next: { revalidate: 600 }, // 10 min cache
      }),
    ]);

    const btcPrice =
      btcRes.status === 'fulfilled' && btcRes.value.ok
        ? (await btcRes.value.json())?.bitcoin?.usd ?? FALLBACK.btcPrice
        : FALLBACK.btcPrice;

    let networkHashrateEh = FALLBACK.networkHashrateEh;
    if (hrRes.status === 'fulfilled' && hrRes.value.ok) {
      const data = await hrRes.value.json();
      // mempool returns hashrate in H/s; convert to EH/s (1e18)
      const hs = data?.currentHashrate ?? 0;
      if (hs > 0) networkHashrateEh = hs / 1e18;
    }

    let difficultyNextAdjustmentPct = 0;
    if (diffRes.status === 'fulfilled' && diffRes.value.ok) {
      const data = await diffRes.value.json();
      difficultyNextAdjustmentPct = data?.difficultyChange ?? 0;
    }

    let blockHeight = 0;
    if (heightRes.status === 'fulfilled' && heightRes.value.ok) {
      const text = await heightRes.value.text();
      const parsed = parseInt(text.trim(), 10);
      if (!isNaN(parsed) && parsed > 0) blockHeight = parsed;
    }

    // Derive avg block time from difficulty adjustment remaining time if available,
    // otherwise use the standard 600s (10min) target
    const avgBlockTimeSec = 600;

    const btcSource =
      btcRes.status === 'fulfilled' && btcRes.value.ok ? 'coingecko' : 'default';
    const hrSource =
      hrRes.status === 'fulfilled' && hrRes.value.ok ? 'mempool.space' : 'default';

    return {
      btcPrice,
      networkHashrateEh,
      difficultyNextAdjustmentPct,
      blockHeight,
      avgBlockTimeSec,
      fetchedAt: new Date().toISOString(),
      sources: { btc: btcSource, hashrate: hrSource },
      stale: btcSource === 'default' || hrSource === 'default',
    };
  } catch {
    return FALLBACK;
  }
}
