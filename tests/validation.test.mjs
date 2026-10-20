import assert from 'node:assert/strict';
import { lstatSync, readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const json = (path) => JSON.parse(read(path));
const marketplace = json('.claude-plugin/marketplace.json');
const codexMarketplace = json('.agents/plugins/marketplace.json');
const architectureSkill = 'plugins/clean-architecture/skills/clean-architecture/SKILL.md';
const kentSkill = 'plugins/kent-beck-style/skills/kent-beck-style/SKILL.md';

function exampleClass(skill, signature, name) {
  const code = [...read(skill).matchAll(/^```typescript\r?\n([\s\S]*?)^```/gm)]
    .map((match) => match[1]).find((block) => block.includes(signature));
  assert.ok(code, `Missing example: ${signature}`);
  return new Function(`${stripTypeScriptTypes(code, { mode: 'transform' })}\nreturn ${name};`)();
}

test('marketplace catalogs expose the same unique plugins', () => {
  assert.equal(marketplace.name, codexMarketplace.name);
  assert.match(marketplace.metadata.version, /^\d+\.\d+\.\d+$/);
  const names = (catalog) => catalog.plugins.map((plugin) => plugin.name).sort();
  assert.deepEqual(names(marketplace), ['clean-architecture', 'kent-beck-style']);
  assert.deepEqual(names(marketplace), names(codexMarketplace));
  assert.equal(new Set(names(marketplace)).size, marketplace.plugins.length);
});

for (const plugin of marketplace.plugins) {
  test(`${plugin.name} ships matching regular manifests and a discoverable skill`, () => {
    const folder = plugin.source.slice(2);
    const claudePath = `${folder}/.claude-plugin/plugin.json`;
    const codexPath = `${folder}/.codex-plugin/plugin.json`;
    assert.ok(lstatSync(new URL(claudePath, root)).isFile(), 'Claude manifest must not be a symlink');
    assert.ok(lstatSync(new URL(codexPath, root)).isFile(), 'Codex manifest must not be a symlink');
    const manifest = json(codexPath);
    assert.deepEqual(json(claudePath), manifest);
    assert.equal(manifest.name, plugin.name);
    assert.equal(manifest.version, plugin.version);
    assert.equal(manifest.description, plugin.description);
    assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
    const entry = codexMarketplace.plugins.find((item) => item.name === plugin.name);
    assert.equal(entry.source.source, 'local');
    assert.equal(entry.source.path, plugin.source);
    const skill = read(`${folder}/${manifest.skills}${plugin.name}/SKILL.md`);
    const frontmatter = skill.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1];
    assert.equal(frontmatter.match(/^name: (.+)$/m)[1].trim(), plugin.name);
    const description = frontmatter.match(/^description: (.+)$/m)[1].trim();
    assert.ok(description.length > 0 && description.length <= 1024);
  });
}

test('DTO example awaits repository results and preserves lookup errors', async () => {
  const GetUserUseCase = exampleClass(architectureSkill, 'async execute(', 'GetUserUseCase');
  const useCase = new GetUserUseCase({
    async findById(id) { return { id, name: 'Alice', passwordHash: 'private' }; },
  });
  assert.deepEqual(await useCase.execute('u-1'), { id: 'u-1', name: 'Alice' });
  const failing = new GetUserUseCase({ async findById() { throw new Error('Database unavailable'); } });
  await assert.rejects(failing.execute('u-1'), /Database unavailable/);
});

test('premium access example preserves true and false results', () => {
  const User = exampleClass(kentSkill, 'class User {', 'User');
  assert.equal(new User(null).hasPremiumAccess(), false);
  const future = new Date('2999-01-01');
  assert.equal(new User({ endDate: future, tier: 'premium' }).hasPremiumAccess(), true);
  assert.equal(new User({ endDate: future, tier: 'basic' }).hasPremiumAccess(), false);
  assert.equal(new User({ endDate: new Date(0), tier: 'premium' }).hasPremiumAccess(), false);
});

test('discount example accepts its boundaries and rejects non-finite or out-of-range values', () => {
  const DiscountPercent = exampleClass(kentSkill, 'class DiscountPercent {', 'DiscountPercent');
  for (const value of [0, 50, 100]) assert.doesNotThrow(() => new DiscountPercent(value));
  for (const value of [NaN, Infinity, -Infinity, -1, 101]) {
    assert.throws(() => new DiscountPercent(value), RangeError);
  }
});

test('date range example rejects invalid and reversed dates', () => {
  const DateRange = exampleClass(kentSkill, 'class DateRange {', 'DateRange');
  const start = new Date('2026-01-01');
  const end = new Date('2026-01-02');
  assert.doesNotThrow(() => new DateRange(start, end));
  assert.doesNotThrow(() => new DateRange(start, start));
  assert.throws(() => new DateRange(end, start), RangeError);
  assert.throws(() => new DateRange(new Date(NaN), end), RangeError);
  assert.throws(() => new DateRange(start, new Date(NaN)), RangeError);
});
