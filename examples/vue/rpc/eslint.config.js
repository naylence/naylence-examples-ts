import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'coverage'] },
  {
    files: ['**/*.{ts,vue}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, ...vue.configs['flat/essential']],
    languageOptions: {
      parserOptions: { sourceType: 'module', ecmaVersion: 2020 },
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
);
