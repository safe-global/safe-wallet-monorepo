// Reasons for `skips`: the cases need a service the local stack cannot provide; staging runs keep them.
const securityProviders = 'Blockaid, Hypernative and Tenderly are hosted providers'
const swapWidgetBalances = 'the hosted CoW widget reads balances from real Sepolia, not the fork'

/**
 * Every spec that runs against the isolated backend: `scenario` names a function from scenarios/index.mjs,
 * `chains` the forks besides Sepolia, `skips` maps titles to reasons.
 */
export const isolatedSpecs = {
  'cypress/e2e/regression/batch_tx.cy.js': { scenario: 'prepareBatchScenario' },
  'cypress/e2e/regression/copilot.cy.js': {
    scenario: 'prepareCopilotScenario',
    chains: [137],
    skips: {
      '[Recipient Analyse] Verify that Different setup warning is shown - 4D': securityProviders,
      '[Recipient Analyse] Verify that Missing ownership warning is shown - 4B': securityProviders,
      '[Recipient Analyse] Verify that New recipient is shown for first time interaction - 3A': securityProviders,
      '[Recipient Analyse] Verify that Recurring recipient is shown with interaction count - 3B': securityProviders,
      '[Recipient Analyse] Verify that Unsupported network warning is shown - 4C': securityProviders,
      '[Tenderly Simulation] Verify failed simulation state': securityProviders,
      '[Tenderly Simulation] Verify success simulation state': securityProviders,
      '[Threat Analyse] Verify Malicious Approval detection - 9A': securityProviders,
      '[Threat Analyse] Verify Malicious Native Transfer detection - 9A': securityProviders,
      '[Threat Analyse] Verify Malicious Transfer detection - 9A': securityProviders,
      '[Threat Analyse] Verify Malicious wallet_sendCalls detection - 9A': securityProviders,
      '[Widget General] Verify that Risk detected requires Risk Confirmation checkbox to continue': securityProviders,
    },
  },
  'cypress/e2e/regression/create_tx_2.cy.js': { scenario: 'prepareTransactionCreationScenario' },
  'cypress/e2e/regression/create_tx.cy.js': { scenario: 'prepareTransactionCreationScenario' },
  'cypress/e2e/regression/dashboard.cy.js': { scenario: 'prepareDashboardRegressionScenario' },
  'cypress/e2e/regression/limit_order_history.cy.js': { scenario: 'prepareLimitOrderHistoryScenario' },
  'cypress/e2e/regression/messages_popup.cy.js': { scenario: 'prepareMessagePopupScenario' },
  'cypress/e2e/regression/proposers.cy.js': { scenario: 'prepareProposersScenario' },
  'cypress/e2e/regression/spaces_basicflow.cy.js': { scenario: 'prepareBasicScenario' },
  'cypress/e2e/regression/spaces_dashboard.cy.js': { scenario: 'prepareSpacesDashboardScenario' },
  'cypress/e2e/regression/swaps_history_2.cy.js': { scenario: 'prepareSwapDetailsScenario' },
  'cypress/e2e/regression/swaps_history.cy.js': { scenario: 'prepareSwapHistoryScenario' },
  'cypress/e2e/regression/swaps_tokens.cy.js': { scenario: 'prepareSwapWidgetScenario' },
  // The swap widgets screen recipients against the Chainalysis sanctions oracle on Ethereum.
  'cypress/e2e/regression/swaps.cy.js': { scenario: 'prepareSwapWidgetScenario', chains: [1] },
  'cypress/e2e/regression/twaps_history.cy.js': { scenario: 'prepareTwapHistoryScenario' },
  'cypress/e2e/regression/twaps_integration.cy.js': {
    scenario: 'prepareTwapWidgetScenario',
    chains: [1],
    skips: {
      'Verify "Balances" tag and value is present for selected token': swapWidgetBalances,
      'Verify list of tokens with balances is displayed in the token selector': swapWidgetBalances,
      'Verify that the "Max" button sets the value as the max balance': swapWidgetBalances,
    },
  },
  'cypress/e2e/regression/tx_details_createtx.cy.js': { scenario: 'prepareTransactionDetailsScenario' },
  'cypress/e2e/regression/tx_details_queue.cy.js': { scenario: 'prepareFallbackHandlersScenario' },
  'cypress/e2e/regression/tx_history_2.cy.js': { scenario: 'prepareHistoryScenario' },
  'cypress/e2e/regression/tx_history_5.cy.js': { scenario: 'prepareHistorySummaryScenario' },
  'cypress/e2e/regression/tx_history.cy.js': { scenario: 'prepareHistoryScenario' },
  'cypress/e2e/regression/tx_notes.cy.js': { scenario: 'prepareNotesScenario' },
  'cypress/e2e/regression/tx_queue_reject_btn.cy.js': { scenario: 'prepareRejectionScenario' },
  'cypress/e2e/regression/tx_queue_replace_btn.cy.js': { scenario: 'prepareReplacementScenario' },
  'cypress/e2e/regression/tx_queue.cy.js': { scenario: 'prepareSwapQueueScenario' },
  'cypress/e2e/regression/tx_share_block.cy.js': { scenario: 'prepareSharingScenario' },
  'cypress/e2e/regression/walletconnect_2.cy.js': { scenario: 'prepareBasicScenario' },
  'cypress/e2e/safe-apps/apps_list.cy.js': { scenario: 'prepareSafeAppsHostScenario' },
  'cypress/e2e/safe-apps/drain_account.spec.cy.js': { scenario: 'prepareSafeAppSafesScenario' },
  'cypress/e2e/safe-apps/info_modal.cy.js': { scenario: 'prepareSafeAppsHostScenario' },
  'cypress/e2e/safe-apps/permissions_settings.cy.js': { scenario: 'prepareBasicScenario' },
  'cypress/e2e/safe-apps/preview_drawer.cy.js': { scenario: 'prepareSafeAppsHostScenario' },
  'cypress/e2e/safe-apps/safe_permissions.cy.js': { scenario: 'prepareSafeAppsHostScenario' },
  'cypress/e2e/safe-apps/tx-builder_3.cy.js': { scenario: 'prepareCowFallbackScenario' },
  'cypress/e2e/safe-apps/tx-builder.cy.js': { scenario: 'prepareSafeAppSafesScenario' },
}
