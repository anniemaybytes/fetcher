const js = require('@eslint/js');
const globals = require('globals');
const eslintConfigPrettier = require('eslint-config-prettier');
const tsEslintPlugin = require('@typescript-eslint/eslint-plugin');
const tsEslintParser = require('@typescript-eslint/parser');

module.exports = [
  {
    rules: {
      // external
      ...js.configs.recommended.rules,
      ...eslintConfigPrettier.rules,

      // overrides
      'max-len': ['error', { code: 200 }],
    },
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      // external
      ...tsEslintPlugin.configs.recommended.rules,

      // overrides
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
    plugins: { '@typescript-eslint': tsEslintPlugin },
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: tsEslintParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },
  {
    files: ['src/**/*.js'],
    rules: {
      'no-console': 'error',
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jquery,
      },
    },
  },
  {
    files: ['src/**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    },
    languageOptions: {
      globals: {
        ...globals.mocha,
      },
    },
  },
  {
    files: ['*.config.{cjs,mjs}'],
    rules: {
      'no-console': 'off',
    },
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
