import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
    js.configs.recommended,
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            globals: { ...globals.browser, ...globals.es2020 },
            parserOptions: { ecmaFeatures: { jsx: true } },
        },
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            'react/react-in-jsx-scope':    'off',
            'react/prop-types':            'off',
            'react/jsx-uses-react':        'off',
            'react/jsx-uses-vars':         'error',
            'react-hooks/rules-of-hooks':  'error',
            'react-hooks/exhaustive-deps': 'warn',
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-console': 'warn',
        },
        settings: {
            react: { version: 'detect' },
        },
    },
];