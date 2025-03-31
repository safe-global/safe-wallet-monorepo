/** @type any */
module.exports = {
  preset: 'ts-jest',
  moduleDirectories: ['node_modules', 'src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'mjs', 'cjs', 'jsx', 'json', 'node', 'mp4'],
  moduleNameMapper: {
    '.+\\.(css|style|less|sass|scss|png|jpg|ttf|woff|woff2|mp4)$': 'jest-transform-stub',
    // Jest by default doesn't support absolute imports out of the box
    '^@safe-global/utils/(.*)$': '<rootDir>/../../packages/utils/src/$1',
    '^@safe-global/store/(.*)$': '<rootDir>/../../packages/store/src/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  modulePathIgnorePatterns: ['<rootDir>/node_modules'],
  testPathIgnorePatterns: ['<rootDir>/node_modules', '<rootDir>/dist', '<rootDir>/e2e'],
  testMatch: ['<rootDir>/**/*.(spec|test).[jt]s?(x)'],
  // setupFilesAfterEnv: ['<rootDir>/../../config/jest-presets/jest/setup.js'],

  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-redux|moti/.*|@safe-global/safe-apps-sdk|ethereum-cryptography|@safe-global/protocol-kit|@safe-global/safe-gateway-typescript-sdk)',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['json', 'lcov', 'html'],
  collectCoverageFrom: ['<rootDir>/packages/**/src/**/*.ts'],
  collectCoverage: false, // turn it on when you want to collect coverage
  clearMocks: true,
}
