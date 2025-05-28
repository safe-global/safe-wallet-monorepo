const preset = require('../../config/test/presets/jest-preset')

module.exports = {
  ...preset,
  preset: 'jest-expo',
  collectCoverage: true,
  collectCoverageFrom: [
    './src/**',
    '!./src/**/*.stories.{js,jsx,ts,tsx}',
    '!./src/tests/**',
    '!./src/types/**',
    '!./src/**/*.snap',
  ],
  coverageReporters: ['json-summary', 'html', 'text-summary'],
  setupFilesAfterEnv: ['./src/tests/jest.setup.tsx'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@notifee/react-native|react-redux|moti/.*)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
}
