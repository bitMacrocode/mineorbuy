"""
Compare Python reference output against TypeScript output.
Exits 0 if within tolerance, 1 otherwise.
"""

import json
import sys


TOLERANCE = 1e-4  # 0.01% — accounts for float formatting quirks, not math bugs


def main(py_path, ts_path):
    with open(py_path) as f:
        py_data = json.load(f)
    with open(ts_path) as f:
        ts_data = json.load(f)

    if len(py_data) != len(ts_data):
        print(f"FAIL: scenario count mismatch ({len(py_data)} vs {len(ts_data)})")
        return 1

    failures = 0
    for i, (p, t) in enumerate(zip(py_data, ts_data)):
        if p['name'] != t['name']:
            print(f"FAIL [{i}]: name mismatch: {p['name']!r} vs {t['name']!r}")
            failures += 1
            continue

        for k in p:
            if k in ('name', 'winner_sats', 'winner_usd_posttax'):
                if p[k] != t[k]:
                    print(f"FAIL [{i}] '{p['name']}': {k} {p[k]!r} vs {t[k]!r}")
                    failures += 1
                continue

            pv, tv = p[k], t[k]
            if pv == 0 and tv == 0:
                continue
            denom = max(abs(pv), abs(tv), 1e-9)
            rel = abs(pv - tv) / denom
            if rel > TOLERANCE:
                print(f"FAIL [{i}] '{p['name']}': {k} py={pv:.6f} ts={tv:.6f} rel_err={rel:.2e}")
                failures += 1

    print()
    if failures == 0:
        print(f"PASS — all {len(py_data)} scenarios match within {TOLERANCE*100:.4f}% tolerance")
        return 0
    else:
        print(f"FAIL — {failures} mismatches across {len(py_data)} scenarios")
        return 1


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <py_results.json> <ts_results.json>")
        sys.exit(2)
    sys.exit(main(sys.argv[1], sys.argv[2]))
