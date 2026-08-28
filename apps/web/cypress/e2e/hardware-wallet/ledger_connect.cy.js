import * as constants from '../../support/constants'
import * as hardwareWallet from '../../support/utils/hardware-wallet'

describe('[LEDGER] Ledger emulator connect tests', { defaultCommandTimeout: 60000 }, () => {
  beforeEach(() => {
    cy.visit(constants.welcomeUrl)
  })

  it('Verify that scanning an emulated Ledger connects the first derived account', () => {
    hardwareWallet.connectLedgerSigner()

    hardwareWallet.verifySignerConnected()
  })
})
