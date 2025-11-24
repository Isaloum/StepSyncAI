module.exports = [
    {
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'commonjs',
            globals: {
                // Node.js globals
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                console: 'readonly',
                exports: 'writable',
                global: 'readonly',
                module: 'readonly',
                process: 'readonly',
                require: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                // Jest globals
                describe: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                jest: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
            'no-console': 'off',
            'semi': ['error', 'always'],
            'quotes': ['warn', 'single', { 'avoidEscape': true }],
            'no-undef': 'error',
            'no-redeclare': 'error',
            'no-constant-condition': 'warn',
            'prefer-const': 'warn'
        }
    },
    {
        ignores: ['__tests__/**', 'node_modules/**', 'coverage/**', 'eslint.config.js']
    }
];
