import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";
import globals from "globals";

const nextRules = {
  ...nextPlugin.configs.recommended.rules,
  ...nextPlugin.configs["core-web-vitals"].rules,
};

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      ".superpowers/**",
      ".tmp-*",
      "node_modules/**",
      "coverage/**",
      "drizzle/**",
      "next-env.d.ts",
      "eslint.config.mjs",
      "src/shared/config/eslint.config.mjs",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        React: "readonly",
        JSX: "readonly",
      },
    },
    rules: {
      ...nextRules,
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
      "prefer-const": "off",
      "no-useless-assignment": "off",
      "preserve-caught-error": "off",
      "no-case-declarations": "off",
    },
  },
];

export default eslintConfig;
