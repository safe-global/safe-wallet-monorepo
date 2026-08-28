import * as constants from '../../support/constants'
import * as hardwareWallet from '../../support/utils/hardware-wallet'

describe('[LEDGER] Ledger emulator connect tests', { defaultCommandTimeout: 60000 }, () => {
  beforeEach(() => {
    cy.visit(constants.welcomeUrl)
  })

  it('should, when an emulated Ledger is scanned, connect the first derived account', () => {
    hardwareWallet.connectLedgerSigner()

    cy.get('[data-testid="open-account-center"]').should('be.visible')
  })
})
