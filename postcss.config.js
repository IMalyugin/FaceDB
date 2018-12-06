module.exports = () => ({
  plugins: {
    'postcss-import': {
      addModulesDirectories: ['node_modueles', 'src'],
    },
    'postcss-mixins': { },
    'postcss-url': { url: 'inline' },
    'postcss-cssnext': {
      browsers: ['last 2 versions', 'ie >= 9', 'ios >= 8'],
    },
    'postcss-nested': {},
  },
});
