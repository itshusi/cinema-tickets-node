import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  // Ignore build output and dependencies
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'eslint.config.ts'],
  },

  // JavaScript files
  {
    ...js.configs.recommended,
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ...(js.configs.recommended.languageOptions ?? {}),
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...(js.configs.recommended.languageOptions?.globals ?? {}),
        ...globals.node,
      },
    },
    plugins: { ...(js.configs.recommended.plugins ?? {}), prettier },
    rules: {
      ...(js.configs.recommended.rules ?? {}),
      'prettier/prettier': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // TypeScript files (flat config from typescript-eslint)
  // Untyped TypeScript rules (safe without type information)
  ...tseslint.configs.recommended.map(cfg => ({
    ...cfg,
    files: ['**/*.{ts,mts,cts}'],
    languageOptions: {
      ...(cfg.languageOptions ?? {}),
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...(cfg.languageOptions?.globals ?? {}), ...globals.node },
    },
    plugins: { ...(cfg.plugins ?? {}), prettier },
    rules: {
      ...(cfg.rules ?? {}),
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  })),

  // Typed TypeScript rules (require type information)
  ...tseslint.configs.recommendedTypeChecked.map(cfg => ({
    ...cfg,
    files: ['**/*.{ts,mts,cts}'],
    languageOptions: {
      ...(cfg.languageOptions ?? {}),
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...(cfg.languageOptions?.globals ?? {}), ...globals.node },
      // Enable type-aware linting via the project service
      parserOptions: {
        ...(cfg.languageOptions?.parserOptions ?? {}),
        // Use the TS Project Service so we don't have to list every project
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { ...(cfg.plugins ?? {}), prettier },
    rules: {
      ...(cfg.rules ?? {}),
      'prettier/prettier': 'error',
      // Enable rules that require type information
      '@typescript-eslint/prefer-readonly': 'error',
    },
  })),

  // Tests (Jest)
  {
    files: ['test/**/*.{ts,js}', '**/*.test.{ts,js}', '**/*.spec.{ts,js}'],
    languageOptions: {
      globals: { ...globals.jest, ...globals.node },
    },
  },
]);
