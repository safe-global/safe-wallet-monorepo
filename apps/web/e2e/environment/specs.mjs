/**
 * Every spec that runs against the isolated backend: `scenario` names a function from scenarios/index.mjs,
 * `chains` the forks besides Sepolia.
 */
export const isolatedSpecs = {
  'cypress/e2e/regression/spaces_basicflow.cy.js': { scenario: 'prepareBasicScenario' },
  'cypress/e2e/regression/spaces_dashboard.cy.js': { scenario: 'prepareSpacesDashboardScenario' },
  'cypress/e2e/regression/tx_details_queue.cy.js': { scenario: 'prepareFallbackHandlersScenario' },
  'cypress/e2e/regression/tx_queue.cy.js': { scenario: 'prepareSwapQueueScenario' },
  'cypress/e2e/safe-apps/apps_list.cy.js': { scenario: 'prepareSafeAppsHostScenario' },
  'cypress/e2e/safe-apps/drain_account.spec.cy.js': { scenario: 'prepareSafeAppSafesScenario' },
  'cypress/e2e/safe-apps/info_modal.cy.js': { scenario: 'prepareSafeAppsHostScenario' },
  'cypress/e2e/safe-apps/permissions_settings.cy.js': { scenario: 'prepareBasicScenario' },
  'cypress/e2e/safe-apps/preview_drawer.cy.js': { scenario: 'prepareSafeAppsHostScenario' },
  'cypress/e2e/safe-apps/safe_permissions.cy.js': { scenario: 'prepareSafeAppsHostScenario' },
  'cypress/e2e/safe-apps/tx-builder_3.cy.js': { scenario: 'prepareCowFallbackScenario' },
  'cypress/e2e/safe-apps/tx-builder.cy.js': { scenario: 'prepareSafeAppSafesScenario' },
}
