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

      <footer className="border-t border-edge pt-4 text-xs text-fg-faint">
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
