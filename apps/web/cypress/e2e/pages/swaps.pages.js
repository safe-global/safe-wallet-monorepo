import * as create_tx from '../pages/create_tx.pages.js'
import * as table from '../pages/tables.page.js'
import { fixtureGetters } from '../../support/fixture.js'

const explorerBtn = '[data-testid="explorer-btn"]'
const groupedItems = '[data-testid="grouped-items"]'

const numberOfPartsStr = /No\.? of parts/
const sellAmountStr = 'Sell amount'
const buyAmountStr = 'Buy amount'
const filledStr = 'Filled'
const partDuration = 'Part duration'
const orderIdStr = 'Order ID'
const cowOrdersUrl = 'https://explorer.cow.fi/orders'

export const swapTxs = fixtureGetters('swaps', {
  sell1Action:
    '&id=multisig_0x03042B890b99552b60A073F808100517fb148F60_0xd033466000a40227fba7a7deb1a668371c213fec90bac9f2583096be2e0fd959',
  buy2actions:
    '&id=multisig_0x03042B890b99552b60A073F808100517fb148F60_0x135ff0282653d4c2a62c76cd247764b1abd4c0daa9201a72964feac2acaa7b44',
  sellCancelled:
    '&id=multisig_0x2a73e61bd15b25B6958b4DA3bfc759ca4db249b9_0xbe159adaa7fb0f7e80ad4bab33a2bb341043818478c96916cfa3877303d22a3d',
  sell3Actions:
    '&id=multisig_0x140663Cb76e4c4e97621395fc118912fa674150B_0x9f3d2c9c9879fb7eee7005d57b2b5c9006d7c8b98241aa49a0b9e769411c58ef',
  sellLimitOrder:
    '&id=multisig_0x03042B890b99552b60A073F808100517fb148F60_0xf7093c3e87e3b703a0df4d9360cd38254ed69d0dc4f7ff5399a194bd92e9014c',
  sellQLimitOrder:
    '&id=multisig_0xD8b85a669413b25a8BE7D7698f88b7bFA20889d2_0x4a699a1a0fe8dcf0bb2f1ccd550bd403dad6b93ca9b1f146aeed90f0a6de6c0c',
  sellSwapQLimitOrder:
    '&id=multisig_0xD8b85a669413b25a8BE7D7698f88b7bFA20889d2_0xc2a59a93e1cbaeab5fde7a5d4cc63938e1b1e4597c7e203146a6e6e07b43a92f',
  sellTwapQLimitOrder:
    '&id=multisig_0xD8b85a669413b25a8BE7D7698f88b7bFA20889d2_0x0f9fb46e5d85bdb11f85bdf356078bb2caaf5508504b5ddb8aba2ce5e3aa58ae',
  sellLimitOrderFilled:
    '&id=multisig_0x8f4A19C85b39032A37f7a6dCc65234f966F72551_0xd3d13db9fc438d0674819f81be62fcd9c74a8ed7c101a8249b8895e55ee80d76',
  safeAppSwapOrder:
    '&id=multisig_0x03042B890b99552b60A073F808100517fb148F60_0x5f08e05edb210a8990791e9df2f287a5311a8137815ec85856a2477a36552f1e',
  wrapSwap:
    '&id=multisig_0xF184a243925Bf7fb1D64487339FF4F177Fb75644_0x06d7e5920bb59a38cf46436b146c33e7307d690875f7d64bca32a0b0c3394deb',
})

export function acceptLegalDisclaimer() {
  cy.get('button').contains('Continue').click()
}

export function createRegex(pattern, placeholder) {
  const pattern_ = pattern.replace(placeholder, `\\s*\\d*\\.?\\d*\\s*${placeholder}`)
  return new RegExp(pattern_, 'i')
}

export function getTokenPrice(token) {
  return new RegExp(`\\d+(\\.\\d+)?\\s*${token}`, 'i')
}

export function checkTokenOrder(regexPattern, option) {
  cy.get(create_tx.txRowTitle)
    .filter(`:contains("${option}")`)
    .parent('div')
    .then(($div) => {
      const text = $div.text()
      const regex = new RegExp(regexPattern, 'i')

      cy.wrap($div).should(($div) => {
        expect(text).to.match(regex)
      })
    })
}

export function verifyOrderIDUrl() {
  cy.get(create_tx.txRowTitle)
    .contains(orderIdStr)
    .parent()
    .parent()
    .within(() => {
      cy.get(explorerBtn).should('have.attr', 'href').and('include', cowOrdersUrl)
    })
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

export function checkTwapSettlement(index, sentValue, receivedValue) {
  cy.get(groupedItems)
    .eq(index)
    .within(() => {
      cy.get(create_tx.transactionItem).eq(0).contains(sentValue).should('exist')
      cy.get(create_tx.transactionItem).eq(1).contains(receivedValue).should('exist')
    })
}
