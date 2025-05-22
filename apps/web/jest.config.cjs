const nextJest = require('next/jest')
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you soon)
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
    '^.+\\.(svg)$': '<rootDir>/mocks/svg.js',
    '^.+/markdown/terms/terms\\.md$': '<rootDir>/mocks/terms.md.js',
    isows: '<rootDir>/node_modules/isows/_cjs/index.js',
    '^@safe-global/utils/(.*)$': '<rootDir>/../../packages/utils/src/$1',
  },
  // https://github.com/mswjs/jest-fixed-jsdom
  // without this environment it is basically impossible to run tests with msw
  testEnvironment: 'jest-fixed-jsdom',

  testEnvironmentOptions: {
    url: 'http://localhost/balances?safe=rin:0xb3b83bf204C458B461de9B0CD2739DB152b4fa5A',
    // https://github.com/mswjs/msw/issues/1786#issuecomment-2426900455
    // without this line 4 tests related to firefox fail
    customExportConditions: ['node'],
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/src/tests/', '/src/types/contracts/'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = async () => ({
  ...(await createJestConfig(customJestConfig)()),
  transformIgnorePatterns: [
    'node_modules/(?!(uint8arrays|multiformats|@web3-onboard/common|@walletconnect/(.*)/uint8arrays)/)',
  ],
})
