import js from "@eslint/js";
import ts from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";

export default [
  { ignores: ["**/dist/**", "**/node_modules/**", "docs/**", "**/*.html"] },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: { parser, parserOptions: { ecmaVersion: 2022, sourceType: "module" } },
    plugins: { "@typescript-eslint": ts },
    rules: {
      ...ts.configs.recommended.rules,
      "no-console": ["warn", { allow: ["error", "warn"] }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];
