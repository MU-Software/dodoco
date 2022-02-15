module.exports = {
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {
      plugins: [
        '@babel/plugin-transform-react-jsx',
        '@babel/proposal-class-properties',
        '@babel/proposal-private-methods',
      ],
    },
  },
};
