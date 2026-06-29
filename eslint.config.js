import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import {
  defineConfig,
  globalIgnores,
} from "eslint/config";

const existingProjectWarnings = {
  /*
   * These newer React compiler/performance rules currently report
   * many patterns in the existing application.
   *
   * Keep them visible as warnings while we refactor each feature.
   * Do not make them blocking errors during Phase 1.
   */
  "react-hooks/set-state-in-effect": "warn",
  "react-hooks/purity": "warn",
  "react-hooks/refs": "warn",
  "react-hooks/preserve-manual-memoization": "warn",
  "react-hooks/exhaustive-deps": "warn",

  /*
   * Existing cleanup items remain visible but do not block
   * the production build during the initial hardening phase.
   */
  "no-unused-vars": [
    "warn",
    {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
    },
  ],

  "no-useless-assignment": "warn",
};

export default defineConfig([
  globalIgnores([
    "dist",
    "node_modules",
  ]),

  /*
   * React frontend files:
   * window, document, localStorage and other browser globals.
   */
  {
    files: ["src/**/*.{js,jsx}"],

    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],

    languageOptions: {
      globals: globals.browser,

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    rules: {
      ...existingProjectWarnings,
    },
  },

  /*
   * Vercel backend, scripts and configuration files:
   * process, Buffer and other Node.js globals.
   */
  {
    files: [
      "api/**/*.{js,mjs,cjs}",
      "scripts/**/*.{js,mjs,cjs}",
      "*.{config.js,config.mjs,config.cjs}",
      "eslint.config.js",
    ],

    extends: [
      js.configs.recommended,
    ],

    languageOptions: {
      globals: globals.node,
      sourceType: "module",
    },

    rules: {
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      "no-useless-assignment": "warn",
    },
  },
]);