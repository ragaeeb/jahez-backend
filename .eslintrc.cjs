module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: ['prettier', 'airbnb-base', 'eslint-config-prettier', 'plugin:jest/recommended', 'plugin:jest/style'],
    plugins: ['prettier', 'jest', 'unused-imports', 'sort-imports-es6-autofix'],
    parser: 'babel-eslint',
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
    },
    rules: {
        /* 'sort-imports-es6-autofix/sort-imports-es6': [
            'warn',
            {
                ignoreCase: false,
                ignoreMemberSort: false,
                memberSyntaxSortOrder: ['none', 'all', 'single', 'multiple'],
            },
        ], */
        'import/extensions': 0,
        'no-unused-vars': 'off',
        'prettier/prettier': 'error',
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
        'import/order': ['error'],
    },
};
