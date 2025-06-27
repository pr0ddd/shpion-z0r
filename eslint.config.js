// ESLint Flat Config for monorepo (backend + frontend)
// Docs: https://eslint.org/docs/latest/use/configure/

const tsplugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const reactPlugin = require('eslint-plugin-react');
const unusedImports = require('eslint-plugin-unused-imports');

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  // Ignore generated and dependency folders
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
  // Base TypeScript + React config
  {
    files: ['apps/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./apps/backend/tsconfig.json', './apps/frontend/tsconfig.json'],
      },
    },
    plugins: {
      '@typescript-eslint': tsplugin,
      react: reactPlugin,
      'unused-imports': unusedImports,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // Unused imports / variables
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // Additional sensible defaults
      'react/react-in-jsx-scope': 'off', // React 17+
    },
  },
];
