"""
Python reference harness. Runs the 15-scenario grid and emits JSON in the
same shape as the TypeScript harness so we can diff them byte-for-byte.

Usage:
  python test/py_reference.py > py_results.json
  python test/compare_results.py py_results.json ts_results.json
"""

import json
import sys
import os

# Engine lives one directory up from test/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, '/home/claude')  # for dev

from mine_or_buy_engine import build_scenario, compare


SCENARIOS = [
    ("1. $29k Compass retail, Power Law, 28%",
     dict(pretax=29_000)),
    ("2. $100k Compass retail, Power Law, 28% [BASELINE]",
     dict()),
    ("3. $100k Compass retail, FLAT, 28%",
     dict(price_model='doomer')),
    ("4. $100k Sazmining PY, Power Law, 28%",
     dict(hosting_key='sazmining_py')),
    ("5. $100k Sazmining PY, FLAT, 28%",
     dict(hosting_key='sazmining_py', price_model='doomer')),
    ("6. $100k Sazmining Ethiopia, Power Law, 28%",
     dict(hosting_key='sazmining_et')),
    ("7. $100k Sazmining Ethiopia, FLAT, 28%",
     dict(hosting_key='sazmining_et', price_model='doomer')),
    ("8. $100k Sazmining Norway, Power Law, 28%",
     dict(hosting_key='sazmining_no')),
    ("9. $100k Simple Mining volume, Power Law, 28%",
     dict(hosting_key='simple_low')),
    ("10. $100k S23 Hydro, Saz ET, Power Law, 28%",
     dict(asic_key='s23_hydro', hosting_key='sazmining_et')),
    ("11. $100k S21 XP Hydro, Saz ET, Power Law, 28%",
     dict(asic_key='s21_xp_hydro', hosting_key='sazmining_et')),
    ("12. $100k Compass, Optimist 40% CAGR, 28%",
     dict(price_model='optimist')),
    ("13. $500k CA passthrough 46%, Saz ET, Power Law",
     dict(pretax=500_000, marginal_fed=0.37, marginal_state=0.093,
          effective=0.35, hosting_key='sazmining_et')),
    ("14. $5M C-corp 27%, Saz ET, Power Law",
     dict(pretax=5_000_000, marginal_fed=0.21, marginal_state=0.06,
          effective=0.25, hosting_key='sazmining_et', entity='c_corp')),
    ("15. Sole prop $200k 37% + SE, Simple Mining, Power Law",
     dict(pretax=200_000, marginal_fed=0.22, marginal_state=0.04,
          effective=0.26, hosting_key='simple_low',
          entity='sole_prop', se_tax=True)),
]


def r6(n):
    return round(n, 6)


def r8(n):
    return round(n, 8)


results = []
for name, kw in SCENARIOS:
    biz, mine, buy, macro = build_scenario(**kw)
    r = compare(biz, mine, buy, macro)
    m = r['mine_detail']
    b = r['buy_detail']
    results.append({
        'name': name,
        'mine_units': r6(m['total_units']),
        'mine_capex_total': r6(m['capex_total']),
        'mine_tax_shield': r6(m['tax_shield']),
        'mine_total_th': r6(m['total_th']),
        'mine_cumulative_opex': r6(m['cumulative_opex_usd']),
        'mine_btc_stack': r8(m['btc_stack']),
        'mine_hardware_resale': r6(m['hardware_resale']),
        'mine_recapture_tax': r6(m['recapture_tax']),
        'mine_terminal_stack_usd': r6(m['terminal_stack_usd']),
        'mine_pretax_terminal': r6(m['pretax_terminal_value']),
        'mine_posttax_terminal': r6(m['posttax_terminal_value']),
        'buy_posttax_capital': r6(b['posttax_capital']),
        'buy_btc_stack': r8(b['btc_stack']),
        'buy_pretax_terminal': r6(b['pretax_terminal_value']),
        'buy_posttax_terminal': r6(b['posttax_terminal_value']),
        'btc_hurdle': r8(r['btc_hurdle']),
        'total_pretax_committed': r6(r['inputs']['total_pretax_committed']),
        'winner_sats': r['winners']['sats_pretax'],
        'winner_usd_posttax': r['winners']['usd_posttax'],
    })

print(json.dumps(results, indent=2))
