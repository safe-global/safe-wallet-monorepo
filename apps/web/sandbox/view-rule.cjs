const path = require('path')

/** Bundler rule that sends every view module under storybook/src through the view loader. */
module.exports = {
  test: /\.tsx?$/,
  include: [path.resolve(__dirname, '../../../storybook/src')],
  exclude: /\.(test|stories|spec)\.tsx?$|__tests__|__mocks__/,
  enforce: 'pre',
  use: [{ loader: path.resolve(__dirname, 'view-loader.cjs') }],
}
