import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Module boundaries: see src/architecture.test.ts for the matching test.
  {
    files: ["src/**/*.{ts,tsx,mts}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^@/modules/[^/]+/.+",
              message:
                "Import a module only through its public entry point: '@/modules/<name>'.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/modules/**/*.{ts,tsx,mts}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^@/modules/[^/]+/.+",
              message:
                "Import a module only through its public entry point: '@/modules/<name>'.",
            },
            {
              regex: "^\\.\\./",
              message:
                "Inside a module, import only from the same folder or below ('./...'). Use '@/modules/<name>' for other modules.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
