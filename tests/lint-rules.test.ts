/*
 * lint-rules.test.ts — positive + negative harness for the two
 * custom lint rules written at Step 1.
 *
 * DESIGN.md calls these out explicitly:
 *   - Stylelint `no-raw-font-family` (§Typography system, line 113).
 *   - ESLint  `no-forbidden-motion-libraries` (§Global architecture, line 26).
 *
 * A lint rule that exists but never rejects anything is worse than no
 * rule at all, because a reviewer will trust the green CI signal. So
 * we also assert that a contrived violating input DOES fail.
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(process.cwd());

function makeTmpDir(): string {
  return mkdtempSync(join(tmpdir(), 'un-regression-lint-'));
}

function runStylelintOn(file: string): { code: number; out: string } {
  try {
    const out = execSync(
      `npx --no-install stylelint --config "${join(REPO_ROOT, '.stylelintrc.cjs')}" "${file}"`,
      { cwd: REPO_ROOT, stdio: ['ignore', 'pipe', 'pipe'] }
    ).toString();
    return { code: 0, out };
  } catch (err: unknown) {
    const e = err as { status?: number; stdout?: Buffer; stderr?: Buffer };
    return {
      code: e.status ?? 1,
      out: (e.stdout?.toString() ?? '') + (e.stderr?.toString() ?? '')
    };
  }
}

function runEslintOn(file: string): { code: number; out: string } {
  try {
    const out = execSync(
      `npx --no-install eslint --resolve-plugins-relative-to "${REPO_ROOT}" --no-eslintrc --config "${join(REPO_ROOT, '.eslintrc.cjs')}" "${file}"`,
      { cwd: REPO_ROOT, stdio: ['ignore', 'pipe', 'pipe'] }
    ).toString();
    return { code: 0, out };
  } catch (err: unknown) {
    const e = err as { status?: number; stdout?: Buffer; stderr?: Buffer };
    return {
      code: e.status ?? 1,
      out: (e.stdout?.toString() ?? '') + (e.stderr?.toString() ?? '')
    };
  }
}

describe('Stylelint no-raw-font-family', () => {
  it('PASSES a file that only references permitted CSS variables', () => {
    const dir = makeTmpDir();
    const file = join(dir, 'good.css');
    writeFileSync(
      file,
      '.ok { font-family: var(--font-mono); }\n.also-ok { font: var(--type-model); }\n'
    );
    const { code, out } = runStylelintOn(file);
    try {
      expect(code, out).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('REJECTS a file declaring a raw font-family', () => {
    const dir = makeTmpDir();
    const file = join(dir, 'bad.css');
    writeFileSync(file, '.nope { font-family: Comic Sans MS, sans-serif; }\n');
    const { code, out } = runStylelintOn(file);
    try {
      expect(code).not.toBe(0);
      expect(out).toMatch(/no-raw-font-family/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('Stylelint no-keyframes', () => {
  it('PASSES a file that declares no @keyframes', () => {
    const dir = makeTmpDir();
    const file = join(dir, 'good.css');
    writeFileSync(file, '.ok { font-family: var(--font-mono); }\n');
    const { code, out } = runStylelintOn(file);
    try {
      expect(code, out).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('REJECTS a @keyframes declaration in a non-allowlisted file', () => {
    const dir = makeTmpDir();
    const file = join(dir, 'bad.css');
    writeFileSync(
      file,
      '.ok { font-family: var(--font-mono); }\n@keyframes spin { from { opacity: 0; } to { opacity: 1; } }\n'
    );
    const { code, out } = runStylelintOn(file);
    try {
      expect(code).not.toBe(0);
      expect(out).toMatch(/no-keyframes/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('Stylelint no-css-animation-over-200ms', () => {
  it('PASSES a transition-duration of 180ms', () => {
    const dir = makeTmpDir();
    const file = join(dir, 'good.css');
    writeFileSync(
      file,
      '.ok { font-family: var(--font-mono); transition: opacity 180ms ease-out; }\n'
    );
    const { code, out } = runStylelintOn(file);
    try {
      expect(code, out).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('REJECTS a transition-duration of 400ms', () => {
    const dir = makeTmpDir();
    const file = join(dir, 'bad.css');
    writeFileSync(
      file,
      '.nope { font-family: var(--font-mono); transition: opacity 400ms ease-out; }\n'
    );
    const { code, out } = runStylelintOn(file);
    try {
      expect(code).not.toBe(0);
      expect(out).toMatch(/no-css-animation-over-200ms/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('REJECTS a transition-duration of 0.3s (expressed in seconds)', () => {
    const dir = makeTmpDir();
    const file = join(dir, 'bad2.css');
    writeFileSync(
      file,
      '.nope { font-family: var(--font-mono); transition-duration: 0.3s; }\n'
    );
    const { code, out } = runStylelintOn(file);
    try {
      expect(code).not.toBe(0);
      expect(out).toMatch(/no-css-animation-over-200ms/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('Stylelint role-color-stroke-only', () => {
  // DESIGN.md §CC#5 line 295 + §Color & palette line 209:
  //   "Any rule with background-color or color set to a --role-* value,
  //    outside <PiCellLine2Underline>, fails the custom Stylelint rule
  //    role-color-stroke-only."

  it('PASSES a file that only uses --stroke (the indirection)', () => {
    const dir = makeTmpDir();
    const file = join(dir, 'good.css');
    writeFileSync(
      file,
      '.ok { font-family: var(--font-mono); border-bottom: 1px solid var(--stroke); }\n'
    );
    const { code, out } = runStylelintOn(file);
    try {
      expect(code, out).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('REJECTS a file that sets background-color: var(--role-causal)', () => {
    const dir = makeTmpDir();
    const file = join(dir, 'bad.css');
    writeFileSync(
      file,
      '.nope { font-family: var(--font-mono); background-color: var(--role-causal); }\n'
    );
    const { code, out } = runStylelintOn(file);
    try {
      expect(code).not.toBe(0);
      expect(out).toMatch(/role-color-stroke-only/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('REJECTS a file that sets color: var(--role-spurious)', () => {
    const dir = makeTmpDir();
    const file = join(dir, 'bad2.css');
    writeFileSync(
      file,
      '.nope { font-family: var(--font-mono); color: var(--role-spurious); }\n'
    );
    const { code, out } = runStylelintOn(file);
    try {
      expect(code).not.toBe(0);
      expect(out).toMatch(/role-color-stroke-only/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('ESLint no-storage-persistence', () => {
  // DESIGN.md DA #9 line 916:
  //   "No localStorage, no IndexedDB, no cookies ... ESLint rule
  //    no-storage-persistence bans localStorage. and indexedDB
  //    references."

  it('PASSES code that uses sessionStorage (explicitly permitted by DA #9)', () => {
    const dir = makeTmpDir();
    const file = join(dir, 'good.ts');
    writeFileSync(
      file,
      "const t = sessionStorage.getItem('tutorialCompleted');\nconsole.log(t);\n"
    );
    const { code, out } = runEslintOn(file);
    try {
      expect(code, out).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('REJECTS bare localStorage references', () => {
    const dir = makeTmpDir();
    const file = join(dir, 'bad.ts');
    writeFileSync(file, "localStorage.setItem('k', 'v');\n");
    const { code, out } = runEslintOn(file);
    try {
      expect(code).not.toBe(0);
      expect(out).toMatch(/no-storage-persistence|localStorage/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('REJECTS window.localStorage member access', () => {
    const dir = makeTmpDir();
    const file = join(dir, 'bad2.ts');
    writeFileSync(file, "window.localStorage.setItem('k', 'v');\n");
    const { code, out } = runEslintOn(file);
    try {
      expect(code).not.toBe(0);
      expect(out).toMatch(/no-storage-persistence|localStorage/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('REJECTS indexedDB references', () => {
    const dir = makeTmpDir();
    const file = join(dir, 'bad3.ts');
    writeFileSync(file, "const d = indexedDB.open('db');\nconsole.log(d);\n");
    const { code, out } = runEslintOn(file);
    try {
      expect(code).not.toBe(0);
      expect(out).toMatch(/no-storage-persistence|indexedDB/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('REJECTS document.cookie access', () => {
    const dir = makeTmpDir();
    const file = join(dir, 'bad4.ts');
    writeFileSync(file, "const c = document.cookie;\nconsole.log(c);\n");
    const { code, out } = runEslintOn(file);
    try {
      expect(code).not.toBe(0);
      expect(out).toMatch(/no-storage-persistence|cookie/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('ESLint no-forbidden-motion-libraries', () => {
  it('PASSES code that imports only permitted packages', () => {
    const dir = makeTmpDir();
    const file = join(dir, 'good.ts');
    writeFileSync(file, "import { readFileSync } from 'node:fs';\nreadFileSync;\n");
    const { code, out } = runEslintOn(file);
    try {
      expect(code, out).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('REJECTS an import of a forbidden motion library (exact name)', () => {
    const dir = makeTmpDir();
    const file = join(dir, 'bad.ts');
    writeFileSync(file, "import { motion } from 'framer-motion';\nmotion;\n");
    const { code, out } = runEslintOn(file);
    try {
      expect(code).not.toBe(0);
      expect(out).toMatch(/no-forbidden-motion-libraries|framer-motion/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('REJECTS an import whose name matches /animat/i', () => {
    const dir = makeTmpDir();
    const file = join(dir, 'bad2.ts');
    writeFileSync(file, "import x from 'some-animation-kit';\nx;\n");
    const { code, out } = runEslintOn(file);
    try {
      expect(code).not.toBe(0);
      expect(out).toMatch(/no-forbidden-motion-libraries|some-animation-kit/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
