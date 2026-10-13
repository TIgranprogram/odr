import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

/**
 * ESLint 9 flat config (T-5.1 / апгрейд dev-зависимостей).
 * Правила сохранены эквивалентными прежнему .eslintrc.cjs.
 */
export default tseslint.config(
  // Глобальные игноры — отдельный объект конфига в flat config
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Отключает правила ESLint, конфликтующие с Prettier (должен идти последним)
  prettierConfig,
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
  {
    // Конфиги-обвязки (jest.config.cjs и т.п.) — CommonJS с node-глобалами
    files: ['**/*.cjs', '**/*.js', '**/*.mjs'],
    languageOptions: {
      globals: { ...globals.node },
    },
  }
);
