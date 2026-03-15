const path = require('path')
const fs = require('fs')

// Load .env file (previously handled by nextJest)
const envPath = path.join(__dirname, '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx)
    let value = trimmed.slice(eqIdx + 1)
    // Strip surrounding quotes
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

// Set version/homepage from package.json if not already set
const packageJsonPath = path.join(__dirname, 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
process.env.NEXT_PUBLIC_APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || packageJson.version
process.env.NEXT_PUBLIC_APP_HOMEPAGE = process.env.NEXT_PUBLIC_APP_HOMEPAGE || packageJson.homepage

const shimsDir = '<rootDir>/src/shims/next'

/** @type {import('jest').Config} */
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  moduleNameMapper: {
    // Next.js shims — redirect all next/* imports to our compatibility shims
    '^next/router$': `${shimsDir}/router.ts`,
    '^next/compat/router$': `${shimsDir}/compat-router.ts`,
    '^next/navigation$': `${shimsDir}/navigation.ts`,
    '^next/link$': `${shimsDir}/link.tsx`,
    '^next/head$': `${shimsDir}/head.tsx`,
    '^next/dynamic$': `${shimsDir}/dynamic.tsx`,
    '^next/image$': `${shimsDir}/image.tsx`,
    '^next/script$': `${shimsDir}/script.tsx`,
    '^next/app$': `${shimsDir}/app.ts`,
    '^next/document$': `${shimsDir}/document.tsx`,
    '^next/dist/client/resolve-href$': `${shimsDir}/resolve-href.ts`,
    '^next/dist/client/link$': `${shimsDir}/link.tsx`,
    '^@next/third-parties/google$': `${shimsDir}/third-parties-google.tsx`,
    '^next$': `${shimsDir}/types.ts`,

    // Path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-dom$': '<rootDir>/../../node_modules/react-dom',
    '^react-dom/client$': '<rootDir>/../../node_modules/react-dom/client',
    '^.+\\.(svg)$': '<rootDir>/mocks/svg.js',
    '^.+/markdown/terms/terms\\.md$': '<rootDir>/mocks/terms.md.js',
    isows: '<rootDir>/node_modules/isows/_cjs/index.js',
    '^@safe-global/utils/(.*)$': '<rootDir>/../../packages/utils/src/$1',
    '^@safe-global/store/(.*)$': '<rootDir>/../../packages/store/src/$1',

    // Static asset mocks (previously handled by nextJest)
    '\\.(css|less|scss|sass)$': '<rootDir>/mocks/css.js',
  },

  // https://github.com/mswjs/jest-fixed-jsdom
  testEnvironment: 'jest-fixed-jsdom',

  testEnvironmentOptions: {
    url: 'http://localhost/balances?safe=rin:0xb3b83bf204C458B461de9B0CD2739DB152b4fa5A',
    // https://github.com/mswjs/msw/issues/1786#issuecomment-2426900455
    customExportConditions: ['node'],
  },

  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        // Use ESM interop for better compatibility
        useESM: false,
      },
    ],
    '^.+\\.jsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        useESM: false,
      },
    ],
    '^.+\\.mdx?$': '<rootDir>/mocks/mdx-transform.cjs',
  },

  transformIgnorePatterns: [
    'node_modules/(?!(uint8arrays|multiformats|@web3-onboard/common|@walletconnect/(.*)/uint8arrays|@storybook|storybook)/)',
  ],

  coveragePathIgnorePatterns: ['/node_modules/', '/src/tests/', '/src/types/contracts/'],

  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/out/', '\\.stories\\.test\\.tsx$'],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}
