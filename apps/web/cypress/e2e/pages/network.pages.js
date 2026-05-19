// ChainSelectorBlock / Add Network
const addNetworkBtn = '[data-testid="add-network-btn"]'
const deployedChainBtn = '[data-testid="deployed-chain-btn"]'
const addChainDialog = '[data-testid="add-chain-dialog"]'
const addedNetwork = '[data-testid="added-network"]'
const modalAddNetworkBtn = '[data-testid="modal-add-network-btn"]'
const allNetworksAccordion = '[data-testid="all-networks-accordion"]'
const chainNavigationButton = '[data-testid="space-chain-navigation-button"]'

export const createSafeMsg = (network) => `Successfully added your account on ${network}`

export function clickChainNavigationButton() {
  cy.wait(1000)
  cy.get(chainNavigationButton).should('be.visible').click()
  cy.get(allNetworksAccordion).should('be.visible')
}

export function clickAllNetworksAccordion() {
  cy.get(allNetworksAccordion).should('be.visible').click()
  cy.get(addNetworkBtn).should('be.visible')
}

export function clickAddNetworkBtn(chainName) {
  cy.get(addNetworkBtn).filter(`[aria-label="Add ${chainName}"]`).click()
  cy.get(addChainDialog).should('be.visible')
}

export function clickModalAddNetworkBtn() {
  cy.get(modalAddNetworkBtn).should('be.visible').and('not.be.disabled').click()
}

export function verifyModalAddNetworkBtnDisabled() {
  cy.get(modalAddNetworkBtn).should('be.disabled')
}

export function verifyNetworkNotInAddList(networkName) {
  cy.get(addNetworkBtn).each(($btn) => {
    cy.wrap($btn).should('not.have.attr', 'aria-label', `Add ${networkName}`)
  })
}

export function verifyDeployedChainsInDropdown(chainNames) {
  chainNames.forEach((name) => {
    cy.get(deployedChainBtn).filter(`[aria-label="${name}"]`).should('exist')
  })
}

export function verifyAddedNetworkInDialog(chainName) {
  cy.get(addedNetwork).should('be.visible').and('contain.text', chainName)
}

export function verifyNetworkInputAbsentInDialog() {
  cy.get(addChainDialog).find('[id="network-input"]').should('not.exist')
}

export function verifyAddNetworkBtnListNotEmpty() {
  cy.get(addNetworkBtn).should('have.length.gte', 1)
}

export function verifyAddNetworkBtnExists(chainName) {
  cy.get(addNetworkBtn).filter(`[aria-label="Add ${chainName}"]`).should('exist')
}

export function addNetwork(chainName) {
  clickChainNavigationButton()
  clickAllNetworksAccordion()
  clickAddNetworkBtn(chainName)
  clickModalAddNetworkBtn()
  cy.get(addChainDialog).should('not.exist')
}
