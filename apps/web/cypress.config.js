import { defineConfig } from 'cypress'
import 'dotenv/config'
import * as fs from 'fs'
import { installPlugin } from '@chromatic-com/cypress'
import { registerArgosTask } from '@argos-ci/cypress/task'
import { version } from './src/markdown/terms/version.js'

// Chromatic needs --remote-debugging-port to archive network resources.
// The port is only set when the cypress action's `chromatic` input is true.
// Without it, register a no-op task so Chromatic's support hooks don't crash.
function setupVisualRegressionPlugins(on, config) {
  if (process.env.ELECTRON_EXTRA_LAUNCH_ARGS?.includes('--remote-debugging-port')) {
    installPlugin(on, config)
  } else {
    on('task', { prepareArchives: () => null })
  }

  registerArgosTask(on, config, {
    uploadToArgos: !!process.env.ARGOS_TOKEN,
    buildName: 'web-e2e',
  })
}

// Headless browsers ignore Cypress viewport settings, so we set window size explicitly.
// See: https://argos-ci.com/docs/cypress
const HEADLESS_WIDTH = 1920 + 16 // +16px to account for the scrollbar gutter
const HEADLESS_HEIGHT = 1080

function setupHeadlessViewport(on) {
  on('before:browser:launch', (browser, launchOptions) => {
    if (browser.name === 'chrome' && browser.isHeadless) {
      launchOptions.args.push(`--window-size=${HEADLESS_WIDTH},${HEADLESS_HEIGHT}`)
      launchOptions.args.push('--force-device-scale-factor=1')
    }
    if (browser.name === 'electron' && browser.isHeadless) {
      launchOptions.preferences.width = HEADLESS_WIDTH
      launchOptions.preferences.height = HEADLESS_HEIGHT
    }
    return launchOptions
  })
}

export default defineConfig({
  projectId: 'exhdra',
  trashAssetsBeforeRuns: true,
  reporter: 'junit',
  reporterOptions: {
    mochaFile: 'reports/junit-[hash].xml',
  },
  retries: {
    runMode: 3,
    openMode: 0,
  },
  e2e: {
    screenshotsFolder: './cypress/snapshots/actual',
    viewportWidth: 1280,
    viewportHeight: 800,
    setupNodeEvents(on, config) {
      config.env.CURRENT_COOKIE_TERMS_VERSION = version

      setupVisualRegressionPlugins(on, config)
      setupHeadlessViewport(on)

      on('task', {
        log(message) {
          console.log(message)
          return null
        },
      })

      on('after:spec', (spec, results) => {
        if (results && results.video) {
          const failures = results.tests.some((test) => test.attempts.some((attempt) => attempt.state === 'failed'))
          if (!failures) {
            fs.unlinkSync(results.video)
          }
        }
      })

      return config
    },
    env: {
      ...process.env,
    },
    baseUrl: 'http://localhost:3000',
    testIsolation: false,
    hideXHR: true,
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 60000,
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 0,
  },

  chromeWebSecurity: false,
})
