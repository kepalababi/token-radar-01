# token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/kepalababi/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/kepalababi/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

A radar for pre-token DeFi protocols, ranked by what each token would be
worth if it traded like the live protocols in its own category. Built for
the [token-radar-01](https://make.fun/bounty/token-radar-01) bounty on
[make.fun](https://make.fun).

The implied value is TVL × the category's median market-cap-per-TVL,
computed from the snapshot's own live protocols (global median as fallback),
times a growth multiplier from the 7-day TVL change and a maturity
multiplier from the protocol's age. Bridges, liquid staking, restaking and
CEX products are set aside — they are not launches. Every row carries the
risk flags the snapshot supports and a farm plan derived from that
protocol's own record (category, chains, TVL, age). No number is invented:
every figure traces back to the frozen DefiLlama snapshot.

## Run it

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts --input /input/snapshot.json
```

Writes `out/board.json`, `out/data.js`, `out/dashboard/`,
`out/screenshots/` and `out/dossier.json`. Exits non-zero if the board
gate fails (a watchlist slug missing, a rank gap, a row without a farm
plan).

---

<sub>Entered on [make.fun](https://make.fun/?ref=h460manj&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
