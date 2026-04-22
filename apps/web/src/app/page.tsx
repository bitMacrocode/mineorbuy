import { Calculator } from '@/components/Calculator';
import { fetchMarketData } from '@/lib/market';
import { Badge } from '@/components/ui';
import Link from 'next/link';

export const revalidate = 300; // 5 minutes

export default async function HomePage() {
  const market = await fetchMarketData();

  return (
    <main className="flex flex-col gap-6">
      <header className="border-b border-edge pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-fg">
                Mine or Buy
              </h1>
              <Badge>v0.1</Badge>
            </div>
            <p className="mt-1 text-sm text-fg-muted">
              Honest math for Bitcoin treasury decisions. 4-year horizon,
              one halving cycle.
            </p>
          </div>
          <nav className="flex items-center gap-5 text-xs font-medium">
            <Link
              href="/methodology"
              className="text-fg-muted transition-colors hover:text-fg"
            >
              Methodology
            </Link>
            <a
              href="https://github.com/bitMacrocode/mineorbuy"
              className="text-fg-muted transition-colors hover:text-fg"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <Calculator market={market} />

      <section className="border-t border-edge pt-4">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Hosting Providers</h3>
            <ul className="mt-2 space-y-1.5 text-xs">
              <li><a href="https://compassmining.io" target="_blank" rel="noopener noreferrer" className="text-fg-faint underline hover:text-fg">Compass Mining</a> <span className="text-fg-faint">— US retail, $0.078/kWh</span></li>
              <li><a href="https://www.simplemining.io/hosting" target="_blank" rel="noopener noreferrer" className="text-fg-faint underline hover:text-fg">Simple Mining</a> <span className="text-fg-faint">— Iowa, $0.070–0.080/kWh</span></li>
              <li><a href="https://www.sazmining.com/datacenters" target="_blank" rel="noopener noreferrer" className="text-fg-faint underline hover:text-fg">Sazmining</a> <span className="text-fg-faint">— Paraguay, Norway, Ethiopia + profit-share</span></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Onramps</h3>
            <ul className="mt-2 space-y-1.5 text-xs">
              <li><a href="https://river.com/business" target="_blank" rel="noopener noreferrer" className="text-fg-faint underline hover:text-fg">River</a> <span className="text-fg-faint">— 0% recurring, business accounts</span></li>
              <li><a href="https://bitcoinwell.com" target="_blank" rel="noopener noreferrer" className="text-fg-faint underline hover:text-fg">Bitcoin Well</a> <span className="text-fg-faint">— 0.99% non-custodial</span></li>
              <li><a href="https://swanbitcoin.com" target="_blank" rel="noopener noreferrer" className="text-fg-faint underline hover:text-fg">Swan Bitcoin</a> <span className="text-fg-faint">— 0.99% auto-withdraw</span></li>
              <li><a href="https://strike.me" target="_blank" rel="noopener noreferrer" className="text-fg-faint underline hover:text-fg">Strike</a> <span className="text-fg-faint">— 0.30%</span></li>
              <li><a href="https://pro.kraken.com" target="_blank" rel="noopener noreferrer" className="text-fg-faint underline hover:text-fg">Kraken Pro</a> <span className="text-fg-faint">— 0.16% taker</span></li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="border-t border-edge pt-4 text-xs text-fg-faint">
        <p className="leading-relaxed">
          Built by direct Bitcoin mining and deep physical engineering experience. Engine is open-source and auditable. Go verify it.
        </p>
        <p className="leading-relaxed">
          This tool makes a 4-year projection comparing hosted Bitcoin mining
          against DCA, on equal pre-tax dollars committed. It is not financial
          advice. Your actual tax situation, hosting contract terms, and ASIC
          performance will differ. Mining is a physical operation with
          counterparty risk, uptime risk, and regulatory risk that this calc
          does not quantify. The engine source is public and the math is
          auditable — see{' '}
          <Link href="/methodology" className="underline hover:text-fg">
            methodology
          </Link>
          .
        </p>
      </footer>
    </main>
  );
}
