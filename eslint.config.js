import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.strict,
    eslintConfigPrettier,
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-dynamic-delete': 'off',
        },
    },
    {
        ignores: ['dist/', 'node_modules/', 'src/modules/v3/'],
    },
);
