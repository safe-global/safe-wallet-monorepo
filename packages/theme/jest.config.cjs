const preset = require('../../config/test/presets/jest-preset')

module.exports = {
  ...preset,
  testEnvironment: 'jest-fixed-jsdom',
}
