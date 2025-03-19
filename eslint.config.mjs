// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    stylistic: true,

    formatters: {
      css: true,
      html: true,
      markdown: 'prettier',
    },
  },
  {
    rules: {
      'no-undef': 'warn',
      'eqeqeq': 'error',
      'no-unused-vars': 'warn',
      'vue/no-unused-refs': 'warn',

      'vue/html-indent': ['error', 2],
      'vue/html-self-closing': 'off',
      'vue/html-closing-bracket-newline': 'off',
      // 'vue/script-indent': ['error', 2, { baseIndent: 1 }],
      // 'vue/require-default-prop': 'off',
      // 'vue/require-prop-types': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/block-order': ['error', {
        order: [['script', 'template'], 'style'],
      }],
      'vue/singleline-html-element-content-newline': 'off',
    },
  },
)
