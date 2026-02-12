import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

/**
 * ESLint Configuration
 *
 * Key Rules:
 * - @typescript-eslint/unbound-method: Prevents 'this' context issues when class methods
 *   are passed as callbacks without proper binding. Ensures developers use arrow function
 *   properties for methods that might be used as callbacks (e.g., in OAuth flows).
 *   Disabled for test files and Zustand stores (function-based, not class-based).
 */

export default [
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.eslint.json',
      },
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      import: importPlugin,
    },
    rules: {
      // Base recommended rules
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,

      // Disable rules that conflict with TypeScript
      'no-undef': 'off', // TypeScript handles this better

      // TypeScript specific rules
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Prevent 'this' context issues - warns when class methods are passed without binding
      '@typescript-eslint/unbound-method': [
        'error',
        {
          ignoreStatic: true,
        },
      ],

      // React specific rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // General rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'warn',

      // Import rules - enforce path aliases (@/) over relative parent imports (../)
      // Checks the literal import string, not the resolved path
      // This prevents imports like `from '../utils/foo'` and requires `from '@/utils/foo'`
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*', '../../*', '../../../*'],
              message:
                'Relative parent imports are not allowed. Use path alias imports instead (e.g., @/utils/foo instead of ../utils/foo)',
            },
          ],
        },
      ],

      // Import ordering and grouping
      'import/order': [
        'warn',
        {
          groups: [
            'builtin', // Node.js built-in modules
            'external', // External packages (react, @mui, etc.)
            'internal', // Internal packages using @ alias
            ['parent', 'sibling'], // Relative imports
            'index', // Index imports
            'type', // Type imports
          ],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'never',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
    settings: {
      react: {
        version: 'detect',
      },
      // Configure import resolver to understand TypeScript path mappings
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
  },
  // Disable unbound-method for Zustand stores and tests (they use functions, not classes)
  {
    files: ['src/stores/**/*.ts', 'src/**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  prettierConfig,
];

