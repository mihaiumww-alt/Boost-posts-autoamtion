import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Architecture rules for the modular monolith. These run on every test run and in CI,
 * independently of the ESLint rules, so a broken lint config can't hide a violation.
 */

const SRC = fileURLToPath(new URL(".", import.meta.url));
const THIS_FILE = "architecture.test.ts";

const MODULES = [
  "identity",
  "account-catalog",
  "post-resolver",
  "naming",
  "preview",
  "batch",
  "status-sync",
  "meta-gateway",
];

// Built from parts so this file never contains the strings it searches for.
const META_MARKERS = ["graph." + "facebook.com", "facebook-nodejs-" + "business-sdk"];

async function sourceFiles(): Promise<{ rel: string; text: string }[]> {
  const entries = await readdir(SRC, { recursive: true });
  const files = entries
    .map((e) => e.split(path.sep).join("/"))
    .filter((rel) => /\.(ts|tsx|mts)$/.test(rel) && rel !== THIS_FILE);
  return Promise.all(
    files.map(async (rel) => ({ rel, text: await readFile(path.join(SRC, rel), "utf-8") })),
  );
}

function importSpecifiers(text: string): string[] {
  const re = /(?:from|import)\s*\(?\s*["']([^"']+)["']/g;
  return [...text.matchAll(re)].map((m) => m[1]);
}

describe("architecture", () => {
  it("has a public entry point for every module", async () => {
    const files = (await sourceFiles()).map((f) => f.rel);
    for (const m of MODULES) {
      expect(files, `missing src/modules/${m}/index.ts`).toContain(`modules/${m}/index.ts`);
    }
  });

  it("lets only the Meta Gateway reference Meta's API", async () => {
    const offenders = (await sourceFiles())
      .filter((f) => !f.rel.startsWith("modules/meta-gateway/"))
      .filter((f) => META_MARKERS.some((marker) => f.text.includes(marker)))
      .map((f) => f.rel);
    expect(offenders).toEqual([]);
  });

  it("never imports another module's internal files", async () => {
    const offenders = (await sourceFiles()).flatMap((f) =>
      importSpecifiers(f.text)
        .filter((spec) => /^@\/modules\/[^/]+\/.+/.test(spec))
        .map((spec) => `${f.rel} -> ${spec}`),
    );
    expect(offenders).toEqual([]);
  });

  it("keeps imports inside a module within its own folder", async () => {
    const offenders = (await sourceFiles())
      .filter((f) => f.rel.startsWith("modules/"))
      .flatMap((f) =>
        importSpecifiers(f.text)
          .filter((spec) => spec.startsWith("../"))
          .map((spec) => `${f.rel} -> ${spec}`),
      );
    expect(offenders).toEqual([]);
  });
});
