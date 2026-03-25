import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      'react/react-in-jsx-scope':    'off',
      'react/prop-types':            'off',
      'react-hooks/rules-of-hooks':  'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars':              ['warn', { argsIgnorePattern: '^_' }],
      'no-console':                  'warn',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
];