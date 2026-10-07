import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const docsRoot = path.join(root, 'content/docs');
const sourceRoot = path.dirname(root.replace(/\/$/, ''));
const checkSources = process.argv.includes('--sources');
const allowedRepos = new Set(['my-map', 'map-infra', 'neofyis-geopulse']);
const errors = [];
const sourceFiles = new Set();
const check = (condition, message) => { if (!condition) errors.push(message); };

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(filename) : [filename];
  });
}

const files = walk(docsRoot).filter((filename) => /\.mdx?$/.test(filename));
const routes = new Set(files.map((filename) => {
  const id = path.relative(docsRoot, filename).replace(/\.mdx?$/, '');
  return id === 'index' ? '/' : `/${id.replace(/\/index$/, '')}`;
}));
const pageIds = new Set(files.map((filename) => path.relative(docsRoot, filename).replace(/\.mdx?$/, '')));

for (const filename of files) {
  const id = path.relative(docsRoot, filename).replace(/\.mdx?$/, '');
  const text = readFileSync(filename, 'utf8');
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---\n/);
  check(frontmatter, `${id}: missing frontmatter`);
  if (!frontmatter) continue;
  const metadata = frontmatter[1];
  check(/^title: .+/m.test(metadata), `${id}: missing title`);
  check(/^description: .+/m.test(metadata), `${id}: missing description`);
  const sources = metadata.match(/^source_files:\n((?:  - .+\n?)+)/m);
  check(sources, `${id}: missing source_files`);

  for (const line of sources?.[1].trim().split('\n') ?? []) {
    const source = line.trim().replace(/^- /, '');
    const repo = source.split('/')[0];
    const safe = allowedRepos.has(repo) && !source.split('/').includes('..') &&
      !/(^|\/)(\.env(?:\..*)?|\.git|node_modules)(\/|$)/.test(source);
    check(safe, `${id}: out-of-scope source ${source}`);
    if (!safe) continue;
    sourceFiles.add(source);
    if (checkSources) {
      const target = path.join(sourceRoot, source);
      check(existsSync(target), `${id}: missing source file ${source}`);
      if (existsSync(target)) check(realpathSync(target).startsWith(`${path.join(sourceRoot, repo)}/`),
        `${id}: source symlink leaves allowed repository: ${source}`);
    }
  }

  const body = text.slice(frontmatter[0].length);
  check((body.match(/^```/gm) ?? []).length % 2 === 0, `${id}: unclosed code fence`);
  const prose = body.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
  for (const match of prose.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const href = match[1].split(/\s+"/)[0];
    if (/^(https?:\/\/|mailto:)/.test(href) || href.startsWith('#')) continue;
    check(href.startsWith('/'), `${id}: doc links must use site routes: ${href}`);
    const route = href.split('#')[0].replace(/\/$/, '') || '/';
    check(routes.has(route), `${id}: broken local route ${href}`);
  }
}

const listed = new Set();
function inspectTree(directory, file = path.join(directory, 'meta.json')) {
  const metadata = JSON.parse(readFileSync(file, 'utf8'));
  for (const item of metadata.pages ?? []) {
    if (item.startsWith('---') || item.startsWith('[')) continue;
    const candidate = path.join(directory, item.replace(/^\.\//, ''));
    if (existsSync(`${candidate}.md`) || existsSync(`${candidate}.mdx`)) {
      const id = path.relative(docsRoot, candidate);
      check(!listed.has(id), `Duplicate page tree entry: ${id}`);
      listed.add(id);
    } else if (existsSync(path.join(candidate, 'meta.json'))) {
      inspectTree(candidate);
    } else {
      check(false, `Page tree entry is missing: ${path.relative(docsRoot, candidate)}`);
    }
  }
}
inspectTree(docsRoot);
for (const id of pageIds) check(listed.has(id), `Page is absent from page tree: ${id}`);
for (const id of listed) check(pageIds.has(id), `Page tree refers to missing page: ${id}`);
check(existsSync(path.join(root, 'public/robots.txt')), 'Missing robots.txt');

if (errors.length) {
  errors.forEach((error) => console.error(`FAIL: ${error}`));
  process.exitCode = 1;
} else {
  assert.ok(files.length > 0);
  console.log(`Checked ${files.length} docs, Fumadocs page tree, local routes, and ${sourceFiles.size} source references.`);
  console.log(checkSources ? 'All source files exist in the three allowed repositories.' : 'Run check:sources to verify sibling source files.');
}
