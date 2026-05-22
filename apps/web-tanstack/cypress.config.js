const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3001',
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
    supportFile: false,
    video: false,
    screenshotOnRunFailure: false,
    defaultCommandTimeout: 10000,
  },
})
