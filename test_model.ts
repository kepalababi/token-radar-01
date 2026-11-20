// Dev-only test for lib/model.ts (not part of the submission).
import { readFileSync } from 'node:fs';
import { buildRadar, boardIssue, parseSnapshot, categoryMultiples } from './lib/model.ts';

const snap = parseSnapshot(readFileSync(process.argv[2]!, 'utf8'));
const { board, radar } = buildRadar(snap);
const issue = boardIssue(board, snap);
console.log(`protocols ${snap.protocols.length}, watchlist ${snap.watchlist.length}, board ${board.length} rows, early ${radar.early_size}, live ${radar.live_size}, set-aside ${radar.set_aside_size}`);
console.log('gate:', issue === null ? 'PASS' : `FAIL: ${issue}`);
const mults = categoryMultiples(snap);
console.log('global multiple:', mults.global.toFixed(3));
for (const [c, v] of [...mults.byCategory.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 8)) {
  console.log(`  ${c}: median ${v.multiple.toFixed(2)} (n=${v.count})`);
}
console.log('top 10 by implied value:');
for (const r of board.slice(0, 10)) {
  console.log(`  #${r.rank} ${r.name} (${r.category}) TVL $${(r.tvl_usd / 1e6).toFixed(0)}M x${r.model.category_multiple} -> $${(r.implied_value_usd / 1e6).toFixed(1)}M [${r.risk_flags.join('; ') || 'no flags'}]`);
}
console.log('set aside (not a launch):', radar.set_aside.slice(0, 5).map((p) => p.name).join(', '));
