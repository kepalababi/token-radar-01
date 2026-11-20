// Dev-only: build a single self-contained HTML of the radar dashboard
// (inline CSS + data + JS) so it can be hosted at one public URL and
// screenshotted. The submission keeps the separate dashboard/ files;
// this file is only a screenshot stand-in and is never submitted.
import { readFileSync, writeFileSync } from 'node:fs';

const dir = process.argv[2] ?? '.';
const outDir = process.argv[3] ?? 'out';
const css = readFileSync(`${dir}/dashboard/app.css`, 'utf8');
const js = readFileSync(`${dir}/dashboard/app.js`, 'utf8');
const data = readFileSync(`${outDir}/data.js`, 'utf8');
let html = readFileSync(`${dir}/dashboard/index.html`, 'utf8');
html = html.replace('<link rel="stylesheet" href="app.css">', `<style>\n${css}\n</style>`);
html = html.replace('<script src="../data.js"></script>', `<script>\n${data}\n</script>`);
html = html.replace('<script src="app.js"></script>', `<script>\n${js}\n</script>`);
writeFileSync(`${dir}/dashboard-single.html`, html);
console.log(`wrote ${dir}/dashboard-single.html (${html.length} bytes)`);
