#!/usr/bin/env node
/**
 * Syntax linter for the build-less Renewgen site.
 *
 * The frontend has no build step — `.jsx` files are transpiled in the browser
 * by @babel/standalone, so syntax errors only surface at runtime. This script
 * parses every `.jsx`/`.js` file with @babel/parser (the same grammar Babel
 * uses) to catch those errors ahead of time. PHP backend files are checked with
 * the built-in `php -l` linter when `php` is available.
 *
 * Usage:
 *   node lint.mjs            # lint the whole repo
 *   node lint.mjs <file...>  # lint only the given files (by extension)
 */
import { parse } from '@babel/parser';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO_ROOT = join(import.meta.dirname, '..', '..');
const IGNORE_DIRS = new Set(['node_modules', '.git', 'tools', 'uploads', 'screenshots', 'assets']);
const JS_EXT = new Set(['.js', '.jsx']);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(join(dir, entry.name), out);
    } else {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

function rel(f) {
  return relative(REPO_ROOT, f);
}

function lintJs(files) {
  let failures = 0;
  for (const f of files) {
    try {
      parse(readFileSync(f, 'utf8'), {
        sourceType: 'module',
        plugins: ['jsx'],
      });
    } catch (err) {
      failures++;
      const loc = err.loc ? `:${err.loc.line}:${err.loc.column}` : '';
      console.error(`✗ ${rel(f)}${loc} — ${err.message.split('\n')[0]}`);
    }
  }
  console.log(`JS/JSX: ${files.length - failures}/${files.length} files OK`);
  return failures;
}

function phpAvailable() {
  try {
    execFileSync('php', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function lintPhp(files) {
  if (!files.length) return 0;
  if (!phpAvailable()) {
    console.log('PHP: skipped (php not installed)');
    return 0;
  }
  let failures = 0;
  for (const f of files) {
    try {
      execFileSync('php', ['-l', f], { stdio: 'ignore' });
    } catch {
      failures++;
      try {
        execFileSync('php', ['-l', f], { stdio: 'inherit' });
      } catch { /* output already printed */ }
      console.error(`✗ ${rel(f)} — PHP syntax error`);
    }
  }
  console.log(`PHP: ${files.length - failures}/${files.length} files OK`);
  return failures;
}

const args = process.argv.slice(2);
let candidates;
if (args.length) {
  candidates = args.map((a) => (existsSync(a) ? a : join(REPO_ROOT, a)));
} else {
  candidates = walk(REPO_ROOT);
}

const jsFiles = candidates.filter((f) => JS_EXT.has(extname(f)) && statSync(f).isFile());
const phpFiles = candidates.filter((f) => extname(f) === '.php' && statSync(f).isFile());

console.log(`Linting ${jsFiles.length} JS/JSX + ${phpFiles.length} PHP file(s)…`);
const failures = lintJs(jsFiles) + lintPhp(phpFiles);

if (failures > 0) {
  console.error(`\n${failures} file(s) failed linting.`);
  process.exit(1);
}
console.log('\nAll files passed linting.');
