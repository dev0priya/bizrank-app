module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  env: {
    node: true,
    es6: true
  },
  rules: {
    'no-unused-vars': 'off', // handled by TS
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-empty': 'warn',
    'prefer-const': 'warn',
    'no-useless-escape': 'warn',
    '@typescript-eslint/no-var-requires': 'warn'
  },
  ignorePatterns: ['dist/', 'node_modules/']
};
