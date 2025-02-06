import * as main from '../../e2e/pages/main.page'

const onboardv2 = 'onboard-v2'
const pkInput = '[data-testid="private-key-input"]'
const pkConnectBtn = '[data-testid="pk-connect-btn"]'
const connectWalletBtn = '[data-testid="connect-wallet-btn"]'

const privateKeyStr = 'Private key'

export function connectSigner(signer) {
  let retryCount = 0

  const actions = {
    privateKey: () => {
      cy.wait(2000)
      cy.get('body').then(($body) => {
        if ($body.find(onboardv2).length > 0) {
          cy.get(onboardv2)
            .shadow()
            .find('button')
            .contains(privateKeyStr)
            .click()
            .then(() => handlePkConnect())
        }
      })
    },
    retry: () => {
      retryCount++
      if (retryCount > 20) {
        throw new Error('Failed to connect after 20 retries')
      }
      cy.wait(1000).then(enterPrivateKey)
    },
  }

  function handlePkConnect() {
    cy.get('body').then(($body) => {
      if ($body.find(pkInput).length > 0) {
        cy.get(pkInput)
          .find('input')
          .then(($input) => {
            $input.val(signer)
            cy.wrap($input).trigger('input').trigger('change')
          })

        cy.get(pkConnectBtn).click()
      }
    })
  }

  function enterPrivateKey() {
    cy.wait(3000)
    return cy.get('body').then(($body) => {
      if ($body.find(pkInput).length > 0) {
        cy.get(pkInput)
          .find('input')
          .then(($input) => {
            $input.val(signer)
            cy.wrap($input).trigger('input').trigger('change')
          })

        cy.get(pkConnectBtn).click()
      } else if ($body.find(connectWalletBtn).length > 0) {
        cy.get(connectWalletBtn)
          .eq(0)
          .should('be.enabled')
          .click()
          .then(() => {
            const actionKey = $body.find(onboardv2).length > 0 ? 'privateKey' : 'retry'
            actions[actionKey]()
          })
      }
    })
  }

  enterPrivateKey().then(() => {
    main.closeOutreachPopup()
  })
}
