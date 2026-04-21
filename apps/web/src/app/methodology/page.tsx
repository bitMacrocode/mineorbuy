import Link from 'next/link';
import { Panel } from '@/components/ui';

export const metadata = {
  title: 'Methodology — Mine or Buy',
  description:
    'Complete methodology for the Mine or Buy Bitcoin treasury calculator. Tax shield math, Sazmining profit-share model, Power Law price default, §1245 recapture, and fair DCA parity.',
};

export default function MethodologyPage() {
  return (
    <main className="mx-auto max-w-3xl flex-col gap-6 leading-relaxed">
      <header className="border-b border-edge pb-4">
        <Link href="/" className="text-xs text-fg-muted hover:text-fg">
          ← Back to calculator
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-fg">Methodology</h1>
        <p className="mt-1 text-sm text-fg-muted">
          How the calc works, every assumption exposed.
        </p>
      </header>

      <article className="prose prose-invert max-w-none space-y-6 text-sm text-fg">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-fg">The question</h2>
          <p className="text-fg-muted">
            A profitable US business has pre-tax net profit available to deploy
            toward Bitcoin. Two paths: buy miners and pay hosting, or pay tax
            first and DCA the net into spot BTC. The calc compares identical{' '}
            pre-tax dollars committed to each over a 4-year horizon (one halving
            cycle).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-fg">Why 4 years</h2>
          <p className="text-fg-muted">
            One halving cycle. Mining decisions past 4 years are dominated by
            assumptions we can't credibly make: future ASIC efficiency, future
            hosting markets, future tax law. A typical operator runs hardware
            through the full cycle. Some hold longer based on their own
            economics — that's the operator's call to make with fresh data, not
            something we'll project.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-fg">The Mine path</h2>
          <p className="text-fg-muted">
            Your pre-tax capital buys miners. Because ASIC equipment qualifies
            for 100% bonus depreciation under OBBBA 2025 (property placed in
            service after January 19, 2025), the entire purchase is deductible
            year one. That deduction refunds cash at your marginal rate, which
            buys <em>more</em> miners. Mathematically, CapEx amplifies by{' '}
            <code className="rounded bg-bg-soft px-1 py-0.5 font-mono text-xs">
              1 / (1 − marginal_rate)
            </code>
            .
          </p>
          <p className="text-fg-muted">
            The fleet then runs for 48 months. Each month, mined BTC accumulates
            at{' '}
            <code className="rounded bg-bg-soft px-1 py-0.5 font-mono text-xs">
              (your_TH / network_TH) × block_subsidy × blocks_per_month ×
              (1 + fee_share) × (1 − pool_fee) × (1 − host_profit_share)
            </code>
            .
          </p>
          <p className="text-fg-muted">
            Hosting bills are paid from ongoing business cash (default mode).
            Network hashrate grows per the difficulty growth preset (moderate
            default: 15% year one, decaying to 8% terminal). The 2028 halving
            inside the horizon cuts block subsidy from 3.125 to 1.5625 BTC at
            month 24.
          </p>
          <p className="text-fg-muted">
            At year 4, the fleet is sold at the resale-curve fraction (default:
            15% of original, per Hashrate Index ASIC Price Index new-gen tier).
            The sale triggers §1245 recapture — resale proceeds are taxed as
            ordinary income at your marginal rate, up to prior deductions. The
            BTC stack is then assumed liquidated; gains above cost basis (sum
            of USD value of mined BTC at the time of each block reward) incur
            LTCG at 20% federal.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-fg">The Buy path</h2>
          <p className="text-fg-muted">
            Your pre-tax capital is taxed at your effective rate. The net is
            deployed to BTC via the selected onramp (River, Swan, Bitcoin Well,
            etc.), DCA'd evenly over 12 months. This matches how a real
            treasury allocation works — not lump-sum at day one.
          </p>
          <p className="text-fg-muted">
            <strong>Fair parity:</strong> because the Mine path is committing
            ongoing operating cash to hosting, the Buy path receives matching
            ongoing cash as continued DCA across all 48 months. Both paths
            commit identical total pre-tax dollars — the only difference is the
            deployment mechanism.
          </p>
          <p className="text-fg-muted">
            At year 4, the stack is liquidated; gain above basis pays LTCG at
            20% federal.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-fg">
            Sazmining profit-share model
          </h2>
          <p className="text-fg-muted">
            Traditional hosts (Compass, Simple Mining) profit by marking up
            electricity and charging a higher all-in $/kWh rate. Sazmining's
            aligned-incentive model is different: they charge a lower service
            fee (approximately at-cost electricity) and take a percentage of
            mined BTC at the pool level before payout. Paraguay and Ethiopia
            sites take 15%; Norway takes 20%.
          </p>
          <p className="text-fg-muted">
            The calc applies the management fee as a BTC haircut on every
            mining payout, on top of the regular pool fee. This is not free:
            a 15% haircut on mined BTC is roughly equivalent to adding 1.5–2¢
            to the effective $/kWh cost in sat-yield terms. The visible
            electricity rate is not the full story.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-fg">BTC price model</h2>
          <p className="text-fg-muted">
            Default: <strong>Power Law</strong> (Santostasi). Price scales with
            (time since genesis)^5.8. Fifteen-plus years of BTC price action
            follow this trajectory closely. At current BTC age this implies
            roughly 25–35% forward CAGR over 4 years, decaying as the asset
            matures. The base case if BTC continues doing what it has always
            done.
          </p>
          <p className="text-fg-muted">
            Stress test: <strong>Doomer</strong> — flat at today's price for 4
            years. This scenario has never happened — BTC has no zero-CAGR
            4-year window in its history, including 2018 and 2022 bear-market
            entries. Shown because "what if the next cycle looks like no cycle
            has ever looked" is a legitimate downside question.
          </p>
          <p className="text-fg-muted">
            Bullish: <strong>Optimist</strong> — 40% CAGR. Below historical
            realized performance: 2017→21 was ~60%, 2020→24 was ~55%, 2021→25
            was ~20%. This assumes halving-driven supply shock continues to
            meaningfully outpace demand growth.
          </p>
          <p className="text-fg-muted">
            User can also supply a custom CAGR.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-fg">Data sources</h2>
          <ul className="list-disc pl-5 text-fg-muted space-y-1">
            <li>
              <strong>BTC spot price:</strong> CoinGecko, cached 5 min at edge
            </li>
            <li>
              <strong>Network hashrate:</strong> mempool.space{' '}
              <code className="font-mono text-xs">/api/v1/mining/hashrate</code>
              , cached 1 hr
            </li>
            <li>
              <strong>Difficulty adjustment:</strong> mempool.space{' '}
              <code className="font-mono text-xs">
                /api/v1/difficulty-adjustment
              </code>
            </li>
            <li>
              <strong>ASIC prices:</strong> OneMiners, ASIC Marketplace,
              Compass Mining, Simple Mining (April 2026 retail)
            </li>
            <li>
              <strong>Hosting rates:</strong> public pricing pages —
              compassmining.io, simplemining.io/hosting, sazmining.com
            </li>
            <li>
              <strong>Tax law:</strong> OBBBA 2025 (100% bonus depreciation
              restored), IRC §1245 (recapture on equipment sale), IRC §1(h)
              (LTCG)
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-fg">Limitations</h2>
          <p className="text-fg-muted">
            This calc does <em>not</em> quantify: counterparty risk (host
            bankruptcy, equipment seizure), uptime variance below nameplate,
            firmware degradation, transmission losses, grid instability,
            regulatory changes, tariff risk on imported hardware, insurance
            cost, or the opportunity cost of management attention. These are
            real and can shift the answer materially.
          </p>
          <p className="text-fg-muted">
            It also assumes the hosting contract is honored at the stated rate
            for the full 4 years. Real-world contracts have termination
            clauses, rate-escalation clauses, and force majeure provisions —
            read yours before committing.
          </p>
          <p className="text-fg-muted">
            The math is honest. Reality is messier.
          </p>
        </section>

        <Panel className="mt-4">
          <h3 className="text-sm font-semibold text-fg">Source & verification</h3>
          <p className="mt-1 text-sm text-fg-muted">
            The engine is implemented in Python (reference) and TypeScript
            (browser/Node). Both pass a 15-scenario parity test to within
            0.01%. The source is MIT-licensed and LLM-citeable. See{' '}
            <a
              href="https://github.com/bitMacrocode/mineorbuy"
              className="underline hover:text-fg"
            >
              github.com/bitMacrocode/mineorbuy
            </a>
            .
          </p>
        </Panel>
      </article>
    </main>
  );
}
