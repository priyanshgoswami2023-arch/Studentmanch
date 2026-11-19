import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'app/**/*', 'gradle/**/*']
  },
  firebaseRulesPlugin.configs['flat/recommended']
];
