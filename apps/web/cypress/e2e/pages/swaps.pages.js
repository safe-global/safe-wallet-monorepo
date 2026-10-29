import * as create_tx from '../pages/create_tx.pages.js'
import * as table from '../pages/tables.page.js'
import { fixtureGetters } from '../../support/fixture.js'

const numberOfPartsStr = /No\.? of parts/
const sellAmountStr = 'Sell amount'
const buyAmountStr = 'Buy amount'
const filledStr = 'Filled'
const partDuration = 'Part duration'

export const swapTxs = fixtureGetters('swaps', {
  sellQLimitOrder:
    '&id=multisig_0xD8b85a669413b25a8BE7D7698f88b7bFA20889d2_0x4a699a1a0fe8dcf0bb2f1ccd550bd403dad6b93ca9b1f146aeed90f0a6de6c0c',
  sellSwapQLimitOrder:
    '&id=multisig_0xD8b85a669413b25a8BE7D7698f88b7bFA20889d2_0xc2a59a93e1cbaeab5fde7a5d4cc63938e1b1e4597c7e203146a6e6e07b43a92f',
  sellTwapQLimitOrder:
    '&id=multisig_0xD8b85a669413b25a8BE7D7698f88b7bFA20889d2_0x0f9fb46e5d85bdb11f85bdf356078bb2caaf5508504b5ddb8aba2ce5e3aa58ae',
})

export function createRegex(pattern, placeholder) {
  const pattern_ = pattern.replace(placeholder, `\\s*\\d*\\.?\\d*\\s*${placeholder}`)
  return new RegExp(pattern_, 'i')
}

export function getTokenPrice(token) {
  return new RegExp(`\\d+(\\.\\d+)?\\s*${token}`, 'i')
}

export function checkSellAmount(amount) {
  cy.contains(sellAmountStr)
    .parent()
    .parent()
    .within(() => {
      cy.contains(amount).should('exist')
    })
}

export function checkBuyAmount(amount) {
  cy.contains(buyAmountStr)
    .parent()
    .parent()
    .within(() => {
      cy.contains(amount).should('exist')
    })
}

export function checkPartDuration(time) {
  cy.contains(partDuration)
    .parent()
    .parent()
    .within(() => {
      cy.contains(time).should('exist')
    })
}

export function checkPercentageFilled(percentage, str) {
  cy.contains(filledStr)
    .parent()
    .parent()
    .within(() => {
      cy.contains(percentage)
      cy.contains(str).should('exist')
      cy.contains('sold').should('exist')
    })
}

export function checkNumberOfParts(parts) {
  cy.contains(numberOfPartsStr)
    .parent()
    .parent()
    .within(() => {
      cy.get(table.dataRow)
        .invoke('text')
        .then((text) => {
          const partsInt = parseInt(text, 10)
          expect(partsInt).to.eq(parts)
        })
    })
}
