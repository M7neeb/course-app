import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COLOR_THEMES, PALETTES, normalizeColorTheme, themeCss, type Palette } from './themes.ts';

const TOKENS: (keyof Palette)[] = [
  'bg',
  'surface',
  'ink',
  'muted',
  'line',
  'accent',
  'accentInk',
  'accentSoft',
  'good',
  'bad',
  'mark',
  'markInk'
];

test('the required themes are present', () => {
  for (const name of ['default', 'ocean', 'forest', 'sunset', 'rose', 'slate']) {
    assert.ok((COLOR_THEMES as readonly string[]).includes(name), `missing theme ${name}`);
  }
});

test('every theme defines a complete light and dark palette', () => {
  for (const name of COLOR_THEMES) {
    const theme = PALETTES[name];
    assert.ok(theme, `${name} has no palette`);
    for (const mode of ['light', 'dark'] as const) {
      for (const token of TOKENS) {
        const value = theme[mode][token];
        assert.equal(typeof value, 'string', `${name}.${mode}.${token} is not a string`);
        assert.ok(value.trim().length > 0, `${name}.${mode}.${token} is empty`);
      }
    }
  }
});

test('the old "mono" theme maps to "slate"', () => {
  assert.equal(normalizeColorTheme('mono'), 'slate');
  assert.equal(normalizeColorTheme('ocean'), 'ocean');
  assert.equal(normalizeColorTheme('neon'), undefined);
});

test('the generated CSS covers every theme in light, dark and system', () => {
  const css = themeCss();
  for (const name of COLOR_THEMES) {
    assert.ok(css.includes(`[data-color-theme='${name}']`), `css missing ${name}`);
  }
  assert.ok(css.includes("prefers-color-scheme: dark"));
  assert.ok(css.includes('--accent-soft:'));
});
