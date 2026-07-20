import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import tailwindcss from 'eslint-plugin-tailwindcss'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        },
        sourceType: 'module',
        project: './tsconfig.app.json'
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@typescript-eslint': tseslint.plugin,
      tailwindcss,
      'simple-import-sort': simpleImportSort
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'off',
        { allowConstantExport: true }
      ],
      'react-hooks/rules-of-hooks': 'warn', // TODO: will turn it to error later
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'off',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/no-unescaped-entities': 'warn', // TODO: will remove it later
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': 'warn', // TODO: will turn it to error later
      'no-unused-vars': 'off',
      'tailwindcss/classnames-order': 'warn',
      'tailwindcss/no-custom-classname': 'warn',
      'tailwindcss/no-contradicting-classname': 'error',
      'tailwindcss/enforces-shorthand': 'error',
      'no-nested-ternary': 'warn', // TODO: will turn it to error later
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-else-return': 'error',
      'no-alert': 'error',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'warn', // TODO: turn to off
      '@typescript-eslint/prefer-optional-chain': 'error',
      'no-duplicate-imports': 'error',
      'prefer-const': 'error',
      'prefer-destructuring': 'warn',
      'prefer-spread': 'warn',
      'no-self-compare': 'error',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // `react` first, `next` second, then packages starting with a character
            ['^react$', '^react', '^next', '^[a-zA-Z]'],
            // Packages starting with `@`
            ['^@'],
            // Packages starting with `~`
            ['^~'],
            // Imports starting with `src/`
            ['^src/'],
            // Imports starting with `../`
            ['^src/', '^\\.\\.(?!/?$)', '^\\.\\./?$'],
            // Imports starting with `./`
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            // Style imports
            ['^.+\\.s?css$'],
            // Side effect imports
            ['^\\u0000']
          ]
        }
      ],
      'simple-import-sort/exports': 'error'
    }
  }
)
