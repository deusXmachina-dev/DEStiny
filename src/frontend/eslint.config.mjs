import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";

export default [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "next-env.d.ts",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
    ],
  },
  js.configs.recommended,
  prettierConfig,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        // React is globally available with automatic JSX runtime (React 19)
        React: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      react,
      "react-hooks": reactHooks,
      "@next/next": nextPlugin,
      "simple-import-sort": simpleImportSort,
    },
    settings: {
      react: {
        version: "detect",
        // Tell ESLint we're using React 19's automatic JSX runtime
        // This means React doesn't need to be in scope for JSX
        jsx: {
          runtime: "automatic",
        },
      },
    },
    rules: {
      // Next.js rules
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,

      // React rules
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/prop-types": "off", // Using TypeScript for prop validation
      "react/react-in-jsx-scope": "off", // Not needed with React 19 automatic JSX runtime

      // TypeScript rules
      "no-unused-vars": "off", // Turn off base rule as it conflicts with @typescript-eslint version
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          // Don't check unused parameters in type definitions (interfaces, type aliases)
          // Parameter names in function types are just documentation
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/no-non-null-assertion": "warn",

      // Import sorting
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",

      // Code quality
      "prefer-const": "error",
      "no-var": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "eqeqeq": ["error", "always", { null: "ignore" }],
      "curly": ["error", "all"],
      "object-curly-spacing": ["error", "always"],

      // Note: Indentation is handled by Prettier (eslint-config-prettier disables the indent rule)
      "prefer-template": "error",
      "no-else-return": ["error", { allowElseIf: false }],
      "prefer-arrow-callback": "error",
      "arrow-body-style": ["error", "as-needed"],
      "object-shorthand": ["error", "always"],
      "prefer-destructuring": [
        "warn",
        {
          array: false,
          object: true,
        },
        {
          enforceForRenamedProperties: false,
        },
      ],

      // React-specific
      "react/jsx-boolean-value": ["error", "never"],
      "react/jsx-curly-brace-presence": [
        "error",
        { props: "never", children: "never" },
      ],
      "react/self-closing-comp": [
        "error",
        {
          component: true,
          html: true,
        },
      ],
      "react/jsx-fragments": ["error", "syntax"],
      "@next/next/no-img-element": "warn",
      // Allow PixiJS properties like 'draw', 'rotation', 'texture', 'anchor'
      "react/no-unknown-property": [
        "error",
        {
          ignore: [
            "draw",
            "rotation",
            "texture",
            "anchor",
            "tint",
            "scale",
            "alpha",
            "visible",
            "position",
          ],
        },
      ],
    },
  },
];
