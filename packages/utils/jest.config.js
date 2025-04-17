const preset = require('../../config/test/presets/jest-preset')

module.exports = {
  ...preset,
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/src/**/*.ts']
}
