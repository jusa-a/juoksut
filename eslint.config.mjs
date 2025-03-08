// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
// your custom flat configs go here, for example:
  {
    rules: {
      'no-undef': 'error',
      'eqeqeq': 'error',
      'no-unused-vars': 'error',

      'vue/html-indent': ['error', 2],
      'vue/html-self-closing': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/script-indent': ['error', 2, { baseIndent: 1 }],
      'vue/require-default-prop': 'off',
      'vue/require-prop-types': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/no-multiple-template-root': 'off',
    },
  },
)
