// Token Radar dashboard. Reads window.RADAR from data.js beside it.
// No fetch, no network: the whole board is in the page.
(function () {
  var D = window.RADAR;
  if (!D) { document.body.textContent = 'data.js is missing.'; return; }

  function $(id) { return document.getElementById(id); }
  function money(n) {
    if (n == null) return '—';
    var abs = Math.abs(n);
    if (abs >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (abs >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + n.toFixed(0);
  }
  function pct(n) { return n == null ? '—' : (n > 0 ? '+' : '') + n.toFixed(1) + '%'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function age(a) { return a == null ? '—' : a >= 365 ? (a / 365).toFixed(1) + 'y' : a + 'd'; }

  // Header.
  var top = D.rows[0];
  $('lede').textContent = 'Every pre-token protocol in the snapshot, ranked by what its token would be worth if it traded like the protocols in its own category. Snapshot ' + D.as_of + ', ' + D.rows.length + ' ranked rows, top implied value ' + money(top ? top.implied_value_usd : 0) + '.';
  var flagged = D.rows.filter(function (r) { return r.risk_flags.length > 0; }).length;
  $('stats').innerHTML =
    '<div><dt>Watchlist</dt><dd>' + D.watchlist_size + '</dd></div>' +
    '<div><dt>Ranked</dt><dd>' + D.board_size + '</dd></div>' +
    '<div><dt>Early radar</dt><dd>' + D.early_size + '</dd></div>' +
    '<div><dt>Flagged</dt><dd>' + flagged + '</dd></div>' +
    '<div><dt>Set aside</dt><dd>' + D.set_aside_size + '</dd></div>';

  // Top picks.
  var picks = D.rows.slice(0, 5);
  $('picks').innerHTML = '<h2>Top picks</h2><div class="picks">' + picks.map(function (r) {
    return '<article class="pick" data-slug="' + esc(r.slug) + '" tabindex="0">' +
      '<div class="rank">#' + r.rank + ' · ' + esc(r.category || 'Other') + '</div>' +
      '<div class="name">' + esc(r.name) + '</div>' +
      '<div class="val">' + money(r.implied_value_usd) + '</div>' +
      '<div class="sub">TVL ' + money(r.tvl_usd) + ' × ' + r.category_multiple.toFixed(2) + '</div>' +
      (r.risk_flags.length ? '<div>' + r.risk_flags.map(function (f) { return '<span class="flag">' + esc(f) + '</span>'; }).join('') + '</div>' : '') +
      '</article>';
  }).join('') + '</div>';

  // Implied value by category.
  var byCat = {};
  D.rows.forEach(function (r) {
    var c = r.category || 'Other';
    byCat[c] = (byCat[c] || 0) + r.implied_value_usd;
  });
  var cats = Object.keys(byCat).map(function (c) { return { c: c, v: byCat[c] }; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 8);
  var maxCat = cats.length ? cats[0].v : 1;
  $('cats').innerHTML = '<h2>Where the value sits</h2><div class="bars">' + cats.map(function (x) {
    return '<div class="bar-row"><span>' + esc(x.c) + '</span><span class="track"><span class="fill" style="width:' + (x.v / maxCat * 100).toFixed(1) + '%"></span></span><span class="amt">' + money(x.v) + '</span></div>';
  }).join('') + '</div><p class="note">Summed implied value of the ranked rows, by category. The multiple is the median market-cap-per-TVL of the live protocols in that category.</p>';

  // Category filter options.
  var catSet = {};
  D.rows.forEach(function (r) { catSet[r.category || 'Other'] = 1; });
  $('cat').innerHTML = '<option value="">All categories</option>' + Object.keys(catSet).sort().map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('');

  // Board state.
  var state = { tab: 'pre', q: '', cat: '', sort: 'rank', dir: 1 };
  var maxImp = D.rows.length ? D.rows[0].implied_value_usd : 1;

  function visibleRows() {
    var rows;
    if (state.tab === 'live') {
      rows = D.live.map(function (p, i) {
        return { rank: i + 1, slug: p.slug, name: p.name, category: p.category, chains: p.chains, tvl_usd: p.tvl_usd, change_7d: p.change_7d, mcap_usd: p.mcap_usd, age_days: null, implied_value_usd: p.mcap_usd || 0, category_multiple: 0, growth_multiplier: 1, maturity_multiplier: 1, risk_flags: [], farm_steps: [] };
      });
    } else if (state.tab === 'set') {
      rows = D.set_aside.map(function (p, i) {
        return { rank: i + 1, slug: p.slug, name: p.name, category: p.category, chains: p.chains, tvl_usd: p.tvl_usd, change_7d: p.change_7d, mcap_usd: p.mcap_usd, age_days: null, implied_value_usd: 0, category_multiple: 0, growth_multiplier: 1, maturity_multiplier: 1, risk_flags: ['not a launch of its own'], farm_steps: [] };
      });
    } else {
      rows = D.rows.slice();
    }
    if (state.q) {
      var q = state.q.toLowerCase();
      rows = rows.filter(function (r) { return (r.name + ' ' + r.slug).toLowerCase().indexOf(q) >= 0; });
    }
    if (state.cat) rows = rows.filter(function (r) { return (r.category || 'Other') === state.cat; });
    var k = state.sort;
    rows.sort(function (a, b) {
      var av = a[k], bv = b[k];
      if (av == null) return 1;
      if (bv == null) return -1;
      return (av < bv ? -1 : av > bv ? 1 : 0) * state.dir;
    });
    return rows;
  }

  function renderBoard() {
    var rows = visibleRows();
    var head = state.tab === 'pre'
      ? '<tr><th data-k="rank">Rank</th><th data-k="name">Protocol</th><th data-k="category">Category</th><th class="num" data-k="tvl_usd">TVL</th><th class="num" data-k="change_7d">7d</th><th class="num" data-k="age_days">Age</th><th class="num" data-k="implied_value_usd">Implied value</th><th>Risk</th></tr>'
      : state.tab === 'live'
      ? '<tr><th>#</th><th>Protocol</th><th>Category</th><th class="num">TVL</th><th class="num">7d</th><th class="num">Market cap</th><th>Why it is here</th></tr>'
      : '<tr><th>#</th><th>Protocol</th><th>Category</th><th class="num">TVL</th><th class="num">7d</th><th>Why it is set aside</th></tr>';
    var body = rows.map(function (r) {
      if (state.tab === 'live') {
        return '<tr data-slug="' + esc(r.slug) + '"><td>' + r.rank + '</td><td><strong>' + esc(r.name) + '</strong><br><span class="note">' + esc(r.chains.join(', ')) + '</span></td><td>' + esc(r.category || 'Other') + '</td><td class="num">' + money(r.tvl_usd) + '</td><td class="num">' + pct(r.change_7d) + '</td><td class="num">' + money(r.mcap_usd) + '</td><td class="note">Live token — the comparable the multiples come from.</td></tr>';
      }
      if (state.tab === 'set') {
        return '<tr><td>' + r.rank + '</td><td><strong>' + esc(r.name) + '</strong><br><span class="note">' + esc(r.chains.join(', ')) + '</span></td><td>' + esc(r.category || 'Other') + '</td><td class="num">' + money(r.tvl_usd) + '</td><td class="num">' + pct(r.change_7d) + '</td><td><span class="flag">not a launch of its own</span></td></tr>';
      }
      return '<tr data-slug="' + esc(r.slug) + '"><td>' + r.rank + '</td><td><strong>' + esc(r.name) + '</strong><br><span class="note">' + esc(r.chains.join(', ')) + '</span></td><td>' + esc(r.category || 'Other') + '</td><td class="num">' + money(r.tvl_usd) + '</td><td class="num">' + pct(r.change_7d) + '</td><td class="num">' + age(r.age_days) + '</td><td class="num">' + money(r.implied_value_usd) + '<div class="mini-bar"><i style="width:' + Math.max(2, r.implied_value_usd / maxImp * 100).toFixed(1) + '%"></i></div></td><td>' + (r.risk_flags.length ? r.risk_flags.map(function (f) { return '<span class="flag">' + esc(f) + '</span>'; }).join('') : '<span class="flag none">clean</span>') + '</td></tr>';
    }).join('');
    $('board').innerHTML = '<table><thead>' + head + '</thead><tbody>' + body + '</tbody></table>' +
      '<p class="note">' + rows.length + ' rows. Click a row for the model breakdown and the farm plan.</p>';
    $('board').querySelectorAll('th[data-k]').forEach(function (th) {
      th.addEventListener('click', function () {
        var k = th.getAttribute('data-k');
        if (state.sort === k) state.dir = -state.dir; else { state.sort = k; state.dir = k === 'name' || k === 'category' ? 1 : -1; }
        renderBoard();
      });
    });
    $('board').querySelectorAll('tr[data-slug]').forEach(function (tr) {
      tr.addEventListener('click', function () { openDetail(tr.getAttribute('data-slug')); });
    });
  }

  // Detail dialog.
  var dlg = $('detail');
  function openDetail(slug) {
    var r = null;
    for (var i = 0; i < D.rows.length; i++) if (D.rows[i].slug === slug) r = D.rows[i];
    if (!r) return;
    var mult = r.category_multiple, growth = r.growth_multiplier, mat = r.maturity_multiplier;
    var recomputed = Math.max(1, Math.round(r.tvl_usd * mult * growth * mat));
    dlg.innerHTML = '<button class="close" type="button">Close</button>' +
      '<h2>#' + r.rank + ' ' + esc(r.name) + '</h2>' +
      '<p class="note">' + esc(r.category || 'Other') + ' · ' + esc(r.chains.join(', ')) + ' · TVL ' + money(r.tvl_usd) + ' · 7d ' + pct(r.change_7d) + ' · age ' + age(r.age_days) + '</p>' +
      '<dl>' +
      '<dt>Implied value</dt><dd><strong>' + money(r.implied_value_usd) + '</strong> (recomputed in this page: ' + money(recomputed) + ')</dd>' +
      '<dt>Category multiple</dt><dd>×' + mult.toFixed(4) + ' — median market-cap-per-TVL of the live ' + esc(r.category || 'Other') + ' protocols in this snapshot</dd>' +
      '<dt>Growth multiplier</dt><dd>×' + growth.toFixed(4) + ' from the 7-day TVL change</dd>' +
      '<dt>Maturity multiplier</dt><dd>×' + mat.toFixed(4) + ' from the protocol age</dd>' +
      '<dt>Risk</dt><dd>' + (r.risk_flags.length ? r.risk_flags.map(function (f) { return '<span class="flag">' + esc(f) + '</span>'; }).join('') : 'No flags on this snapshot.') + '</dd>' +
      '</dl>' +
      '<h3>Farm plan</h3><ol>' + r.farm_steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
      '<p class="note">A farm plan is a starting point, not a promise. Verify the protocol’s own points page before you put money in, and never pay to claim.</p>';
    dlg.querySelector('.close').addEventListener('click', function () { dlg.close(); });
    dlg.showModal();
  }
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  document.querySelectorAll('.pick').forEach(function (el) {
    el.addEventListener('click', function () { openDetail(el.getAttribute('data-slug')); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter') openDetail(el.getAttribute('data-slug')); });
  });

  // Model panel.
  $('model').innerHTML = '<div class="model"><h2>How the radar works</h2>' +
    '<p>Implied value = TVL × <strong>category multiple</strong> × growth multiplier × maturity multiplier. The category multiple is the median market-cap-per-TVL of the protocols in that category that already trade — a lending protocol is worth what lending protocols trade for, not what a DEX trades for. When a category has fewer than three live comparables, the global median is used and the row says so.</p>' +
    '<p>The watchlist is the floor: every protocol on it is ranked. Below the floor, the early radar adds pre-token protocols by TVL. Exchanges, bridges, wrapped and staked products are never ranked — they are not a launch of their own — and are listed under “Set aside” instead. Every number on this page traces to the snapshot at <code>' + esc(D.source) + '</code> as of ' + esc(D.as_of) + '; nothing is invented.</p>' +
    '<p class="note">Farm plans are derived from each protocol’s own record (category, chains, TVL, age). They cost the capital shown and nothing else — a claim that asks you to pay is a trap.</p></div>';

  // Controls.
  $('q').addEventListener('input', function (e) { state.q = e.target.value; renderBoard(); });
  $('cat').addEventListener('change', function (e) { state.cat = e.target.value; renderBoard(); });
  function setTab(tab) {
    state.tab = tab;
    $('tab-pre').setAttribute('aria-selected', tab === 'pre' ? 'true' : 'false');
    $('tab-live').setAttribute('aria-selected', tab === 'live' ? 'true' : 'false');
    $('tab-set').setAttribute('aria-selected', tab === 'set' ? 'true' : 'false');
    renderBoard();
  }
  $('tab-pre').addEventListener('click', function () { setTab('pre'); });
  $('tab-live').addEventListener('click', function () { setTab('live'); });
  $('tab-set').addEventListener('click', function () { setTab('set'); });

  renderBoard();

  // Deep links: ?detail=<slug> opens a row, ?cat=<category> filters,
  // ?q=<text> searches. Handy for sharing one protocol or one view.
  var params = new URLSearchParams(location.search);
  var q0 = params.get('q');
  var cat0 = params.get('cat');
  var det0 = params.get('detail');
  if (q0) { state.q = q0; $('q').value = q0; }
  if (cat0) { state.cat = cat0; $('cat').value = cat0; }
  if (q0 || cat0) renderBoard();
  if (det0) openDetail(det0);
})();
