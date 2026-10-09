import { defineConfig } from 'cypress'
import 'dotenv/config'
import * as fs from 'fs'
import { registerArgosTask } from '@argos-ci/cypress/task'
import { version } from './src/markdown/terms/version.js'
import { cypressEnvironment } from './e2e/environment/cypress.mjs'
import { isolatedSpecs } from './e2e/environment/specs.mjs'

function setupArgosPlugin(on, config) {
  registerArgosTask(on, config, {
    uploadToArgos: !!process.env.ARGOS_TOKEN,
    buildName: 'web-e2e',
  })
}

// Headless browsers ignore Cypress viewport settings, so we set window size explicitly.
// See: https://argos-ci.com/docs/cypress
const HEADLESS_WIDTH = 1920 + 16 // +16px to account for the scrollbar gutter
const HEADLESS_HEIGHT = 1080

function setupHeadlessViewport(on, isolated) {
  on('before:browser:launch', (browser, launchOptions) => {
    if (isolated) {
      if (browser.family !== 'chromium' || browser.name === 'electron') {
        throw new Error('Isolated Cypress currently requires Chrome or Chromium')
      }
      launchOptions.args.push('--host-resolver-rules=MAP *.safe-e2e.test 127.0.0.1')
    }
    if (browser.family === 'chromium' && browser.name !== 'electron' && browser.isHeadless) {
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

// Each spec asks for its data through the prepareSafeScenario task before its own hooks run.
async function registerIsolatedScenarios(on, config) {
  const { createScenarioFixtures } = await import('./e2e/environment/fixtures.mjs')
  const { createOwners } = await import('./e2e/environment/scenarios/safe.mjs')
  const { scenarios } = await import('./e2e/environment/scenarios/index.mjs')
  const scenarioFixtures = await createScenarioFixtures(config.fixturesFolder)
  config.fixturesFolder = scenarioFixtures.directory
  config.hosts = { ...config.hosts, '*.safe-e2e.test': '127.0.0.1' }
  const owners = createOwners()
  config.env.CYPRESS_WALLET_CREDENTIALS = JSON.stringify(owners.credentials)
  config.taskTimeout = 600000
  on('task', {
    async prepareSafeScenario(spec) {
      const prepare = scenarios[isolatedSpecs[spec]?.scenario]
      if (!prepare) throw new Error(`No isolated scenario registered for ${spec}; add it to e2e/environment/specs.mjs`)
      const started = Date.now()
      const { files, ...scenario } = await prepare(config.env, owners)
      await scenarioFixtures.prepare(files)
      console.log(`Prepared the scenario for ${spec} in ${((Date.now() - started) / 1000).toFixed(1)} s`)
      return scenario
    },
  })
  return scenarioFixtures
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
    async setupNodeEvents(on, config) {
      let scenarioFixtures
      config.env.CURRENT_COOKIE_TERMS_VERSION = version

      setupArgosPlugin(on, config)
      setupHeadlessViewport(on, config.env.SAFE_E2E_ISOLATED)

      if (config.env.SAFE_E2E_ISOLATED) {
        scenarioFixtures = await registerIsolatedScenarios(on, config)
      }

      on('task', {
        log(message) {
          console.log(message)
          return null
        },
      })

      on('after:spec', async (spec, results) => {
        await scenarioFixtures?.cleanup()
        if (!config.env.SAFE_E2E_ISOLATED && results && results.video) {
          const failures = results.tests.some((test) => test.attempts.some((attempt) => attempt.state === 'failed'))
          if (!failures) {
            fs.unlinkSync(results.video)
          }
        }
      })

      return config
    },
    env: cypressEnvironment(process.env),
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
