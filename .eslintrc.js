module.exports = {
  extends: 'airbnb-base',
  rules: {
    // dæmi verða læsilegri ef þau eru ekki með löngum línum
    'max-len': ['error', { code: 100, ignoreUrls: true }],

    // leyfa i++ í for
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],

    'function-paren-newline': ['error', 'consistent'],

    // viljum hafa operators í t.d. löngum if segðum aftast á línu
    'operator-linebreak': ['error', 'after'],

    'no-console': ['error', { allow: ['info', 'warn', 'error', 'assert'] }],

    'linebreak-style': 0,

    'object-curly-newline': ['error', {
      ExportDeclaration: { multiline: true, minProperties: 4 },
    }],

    'no-underscore-dangle': 0,
  },
};
