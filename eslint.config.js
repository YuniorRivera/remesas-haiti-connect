import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
    overrides: [
      {
        files: ["src/**/*.{ts,tsx}"],
        rules: {
          // Disallow console in UI code except warn/error
          "no-console": ["warn", { allow: ["warn", "error"] }],
        },
      },
      {
        files: ["supabase/functions/**/*.{ts,tsx}"],
        rules: {
          // Allow console in serverless functions for observability
          "no-console": "off",
        },
      },
    ],
  },
);
