import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as create_tx from '../pages/create_tx.pages.js'
import * as table from '../pages/tables.page.js'
import * as modals from '../pages/modals.page.js'
import * as swaps_data from '../../fixtures/swaps_data.json'

export const inputCurrencyInput = '[id="input-currency-input"]'
export const outputCurrencyInput = '[id="output-currency-input"]'
const tokenList = '[id="tokens-list"]'
export const swapBtn = '[id="swap-button"]'
const exceedFeesChkbox = 'input[id="fees-exceed-checkbox"]'
const settingsBtn = 'button[id="open-settings-dialog-button"]'
const settingsBtnTwap = 'button[id^="menu-button--menu"]'
export const assetsSwapBtn = '[data-testid="swap-btn"]'
export const dashboardSwapBtn = '[data-testid="overview-swap-btn"]'
export const customRecipient = 'div[id="recipient"]'
const recipientToggle = 'button[id="toggle-recipient-mode-button"]'
const twapsAddressToggle = 'button[class*="Toggle__Wrapper"]'
const orderTypeMenuItem = 'div[class*="MenuItem"]'
const explorerBtn = '[data-testid="explorer-btn"]'
const limitPriceFld = '[data-testid="limit-price"]'
const expiryFld = '[data-testid="expiry"]'
const slippageFld = '[data-testid="slippage"]'
const orderIDFld = '[data-testid="order-id"]'
const widgetFeeFld = '[data-testid="widget-fee"]'
const interactWithFld = '[data-testid="interact-wth"]'
const groupedItems = '[data-testid="grouped-items"]'
const inputCurrencyPreview = '[id="input-currency-preview"]'
const outputCurrencyPreview = '[id="output-currency-preview"]'
const outputCurrencyTitle = (title) => `span[title*='${title}']`
const reviewTwapBtn = '[id="do-trade-button"]'
const placeTwapOrderStrBtn = 'Place TWAP order'
const placeLimitOrderStrBtn = 'Place limit order'
export const unlockOrdersBtn = '[id="unlock-advanced-orders-btn"]'
const limitOrderExpiryItem = (item) => `div[data-valuetext="${item}"]`
const tokenBlock = '[data-testid="block-label"]'
const confirmPriceImpactInput = '[id="confirm-modal-input"]'
const confirmPriceImpactBtn = '[id="confirm-modal-button"]'
const tokenBalance = 'div[class*="TokenMetadata"]'
const tokenItem = 'div[class*="TokenItem"]'

const limitStrBtn = 'Limit'
const swapStrBtn = 'Swap'
const twapStrBtn = 'TWAP'
const confirmSwapStr = 'Confirm Swap'
const swapAnywayStrBtn = 'Swap anyway'
const acceptStrBtn = 'Accept'
const maxStrBtn = 'Max'
const numberOfPartsStr = /No\.? of parts/
const sellAmountStr = 'Sell amount'
const buyAmountStr = 'Buy amount'
const filledStr = 'Filled'
const partDuration = 'Part duration'
const totalDurationStr = 'Total duration'
const oneHr = '1 Hour'
const halfHr = '30m'
const sellperPartStr = 'Sell per part'
const sellperPartStr2 = 'Sell amount'
const buyperPartStr = 'Buy per part'
const priceProtectionStr = 'Price protection'
const orderSplit = 'Order will be split in'
const orderDetailsStr = 'Order details'
const unlockTwapOrdersStrBtn = 'Unlock TWAP orders'
const settingsModalTitle = 'Advanced Order Settings'
const customRecipientStr = 'Custom Recipient'
const recipientWarningMsg = 'Order recipient address differs from order owner!'
const selectTokenStr = 'Select a token'

export const quoteResponse = {
  quote1: 'swaps/quoteresponse1.json',
  quote2: 'swaps/quoteresponse2.json',
}
const getInsufficientBalanceStr = (token) => `Insufficient ${token} balance`
const sellAmountIsSmallStr = 'Sell amount too small'

const swapBtnStr = /Confirm Swap|Swap|Confirm (Approve COW and Swap)|Confirm/
const orderSubmittedStr = 'Order Submitted'
const orderIdStr = 'Order ID'
const cowOrdersUrl = 'https://explorer.cow.fi/orders'

export const blockedAddress = '0x8576acc5c05d6ce88f4e49bf65bdf0c62f91353c'
export const blockedAddressStr = 'Blocked address'

const swapStr = 'Swap'
const limitStr = 'Limit'

const swapsHistory = swaps_data.type.history

export const swapTokens = {
  cow: 'COW',
  dai: 'DAI',
  eth: 'ETH',
}

export const limitOrderExpiryOptions = {
  five_minutes: '5 Minutes',
}

export const swapTokenNames = {
  eth: 'Ether',
  cow: 'CoW Protocol Token',
  daiTest: 'DAI (test)',
  gnoTest: 'GNO (test)',
  uni: 'Uniswap',
  usdcTest: 'USDC (test)',
  usdt: 'Tether USD',
  weth: 'Wrapped Ether',
}

export const orderTypes = {
  swap: 'Swap',
  limit: 'Limit',
}

const swapOrders = '**/api/v1/orders/*'
const surplus = '**/users/*/total_surplus'
const nativePrice = '**/native_price'
const quote = '**/quote/*'

export const limitOrderSafe = 'sep:0x8f4A19C85b39032A37f7a6dCc65234f966F72551'

export const swapTxs = {
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
  swapQueue:
    '&id=multisig_0xD8b85a669413b25a8BE7D7698f88b7bFA20889d2_0xc2a59a93e1cbaeab5fde7a5d4cc63938e1b1e4597c7e203146a6e6e07b43a92f',
}

export const tokenBlockLabels = {
  sell: 'Sell',
  buy: 'Buy exactly',
}

export function verifySwapBtnIsVisible() {
  cy.get(assetsSwapBtn).should('be.visible')
}

export function checkInputCurrencyPreviewValue(value) {
  cy.get(inputCurrencyPreview).should('contain.text', value)
}

export function checkOutputCurrencyPreviewValue(value) {
  cy.get(outputCurrencyPreview).contains(value)
}
//
export function checkTokenBlockValue(index, value) {
  // cy.get(tokenBlock).eq(index).contains(value)
  cy.get(tokenBlock).eq(index).should('contain.text', value)
}

export function unlockTwapOrders(iframeSelector) {
  main.getIframeBody(iframeSelector).then(($iframeBody) => {
    if ($iframeBody.find(unlockOrdersBtn).length > 0) {
      cy.wrap($iframeBody).find(unlockOrdersBtn).click()
      cy.wait(500)
    }
  })
}

export function clickOnAssetSwapBtn(index) {
  cy.get(assetsSwapBtn).eq(index).as('btn')
  cy.get('@btn').click()
}

export function verifyOrderSubmittedConfirmation() {
  cy.get('div').contains(orderSubmittedStr).should('exist')
}

export function clickOnSettingsBtn() {
  cy.get(settingsBtn).click()
}

export function clickOnSettingsBtnTwaps() {
  cy.get(settingsBtnTwap).eq(0).click()
}

export function setExpiry(value) {
  cy.get('div').contains('Swap deadline').parent().next().find('input').clear().type(value)
}

export function setLimitExpiry(value) {
  cy.get('div').contains('Order expires in').parent().find('button').click()
  cy.get(limitOrderExpiryItem(value)).dblclick()
}

export function enterRecipient(address) {
  cy.get(customRecipient).find('input').clear().type(address)
}

export function setSlippage(value) {
  cy.contains('button', 'Auto').next('button').find('input').clear().type(value)
}
export function waitForOrdersCallToComplete() {
  cy.intercept('GET', swapOrders).as('Orders')
  cy.wait('@Orders')
}

export function waitForSurplusCallToComplete() {
  cy.intercept('GET', surplus).as('Surplus')
  cy.wait('@Surplus')
}

export function waitFornativePriceCallToComplete() {
  cy.intercept('GET', nativePrice).as('Price')
  cy.wait('@Price')
}

export function waitForQuoteCallToComplete() {
  cy.intercept('GET', quote).as('Quote')
  cy.wait('@Quote')
}

export function clickOnConfirmSwapBtn() {
  cy.get('button').contains(confirmSwapStr).click()
}

export function clickOnExceeFeeChkbox() {
  cy.wait(1000)
  cy.get(exceedFeesChkbox)
    .should(() => {})
    .then(($button) => {
      if (!$button.length) {
        return
      }
      cy.wrap($button).click()
    })
}

export function clickOnSwapBtn() {
  cy.get('button').contains(swapBtnStr).should('be.enabled').as('swapBtn')
  cy.get('@swapBtn').should('exist').click({ force: true })
}

export function verifyReviewOrderBtnIsVisible() {
  return cy.get(reviewTwapBtn).should('be.visible')
}

export function clickOnReviewOrderBtn() {
  cy.get('button')
    .contains(swapAnywayStrBtn)
    .should(() => {})
    .then(($button) => {
      if (!$button.length) {
        return
      }
      cy.wrap($button).click()
    })
  cy.get(reviewTwapBtn).should('be.enabled').click()
}

export function placeTwapOrder() {
  cy.wait(3000)
  cy.get('button')
    .contains(acceptStrBtn)
    .should(() => {})
    .then(($button) => {
      if (!$button.length) {
        return
      }
      cy.wrap($button).click()
    })
  cy.get('button').contains(placeTwapOrderStrBtn).should('be.enabled').click()
}

export function confirmPriceImpact() {
  cy.wait(3000)
  cy.get('span')
    .contains('Swap anyway')
    .should(() => {})
    .then(($checkbox) => {
      if ($checkbox.length) {
        cy.wrap($checkbox).click()
      }
    })
}

export function placeLimitOrder() {
  cy.contains(placeLimitOrderStrBtn).click()
}

export function checkSwapBtnIsVisible() {
  cy.get('button').contains(swapBtnStr).should('be.visible')
}

export const currencyDirectionOptions = {
  input: 'input',
  output: 'output',
}

export function acceptLegalDisclaimer() {
  cy.get('button').contains('Continue').click()
}

export function checkTokenBalance(safe, tokenSymbol) {
  cy.get(inputCurrencyInput)
    .invoke('text')
    .then((text) => {
      main.getSafeBalance(safe, constants.networkKeys.sepolia).then((response) => {
        const targetToken = response.body.items.find((token) => token.tokenInfo.symbol === tokenSymbol)
        const tokenBalance = targetToken.balance.toString()
        let formattedBalance

        if (tokenBalance.length > 4) {
          formattedBalance = `${tokenBalance[0]},${tokenBalance.slice(1, 4)}`
        } else {
          formattedBalance = tokenBalance
        }

        expect(text).to.include(`${formattedBalance} ${tokenSymbol}`)
      })
    })
}

export function verifySelectedInputCurrancy(option) {
  cy.get(inputCurrencyInput).within(() => {
    cy.get('span').contains(option).should('be.visible')
  })
}

function selectCurrency(inputSelector, option) {
  cy.get(inputSelector).within(() => {
    cy.get('button')
      .eq(0)
      .invoke('text')
      .then(($value) => {
        cy.log('*** Currency value ' + $value)
        if (!$value.includes(option)) {
          cy.log('*** Currency value is different from specified')
          cy.get('button').eq(0).trigger('mouseover').trigger('click')
          cy.wrap(true).as('isAction')
        } else {
          cy.wrap(false).as('isAction')
        }
      })
  })

  cy.get('@isAction').then((isAction) => {
    if (isAction) {
      cy.log('*** Clicking on token option')
      cy.get(tokenList).find('span').contains(option).click()
    }
  })
}

export function selectInputCurrency(option) {
  selectCurrency(inputCurrencyInput, option)
}

export function selectOutputCurrency(option) {
  selectCurrency(outputCurrencyInput, option)
}

export function setInputValue(value) {
  cy.get(inputCurrencyInput).within(() => {
    cy.get('input')
      .should('be.visible')
      .should('not.be.disabled')
      .clear()
      .wait(3000)
      .invoke('val', '')
      .trigger('input')
      .then(($input) => {
        if ($input.val() !== '') {
          cy.wrap($input).clear().invoke('val', '').trigger('input')
        }
      })
      .should('have.value', '')
      .type(value, { force: true })
  })
}

export function setOutputValue(value) {
  cy.get(outputCurrencyInput).within(() => {
    cy.get('input').type(value)
  })
}

export function outputInputIsNotEmpty() {
  cy.get(outputCurrencyInput).find('input').invoke('val').should('not.be.empty')
}

export function enableCustomRecipient(option) {
  if (!option) cy.get(recipientToggle).click()
}

export function enableTwapCustomRecipient(option) {
  main.verifyMinimumElementsCount(twapsAddressToggle, 1)
  if (!option) cy.get(twapsAddressToggle).eq(0).click()
}

export function disableCustomRecipient(option) {
  if (option) cy.get(recipientToggle).click()
}

export function isInputGreaterZero(inputSelector) {
  return cy
    .get(inputSelector)
    .find('input')
    .invoke('val')
    .then((val) => {
      const n = parseFloat(val)
      return n > 0
    })
}

export function selectOrderType(type) {
  cy.get('a').contains(swapStr).click()
  cy.get(orderTypeMenuItem).contains(type).click()
}

export function createRegex(pattern, placeholder) {
  const pattern_ = pattern.replace(placeholder, `\\s*\\d*\\.?\\d*\\s*${placeholder}`)
  return new RegExp(pattern_, 'i')
}

export function getTokenPrice(token) {
  return new RegExp(`\\d+(\\.\\d+)?\\s*${token}`, 'i')
}

export function getOrderID() {
  return new RegExp(`[a-fA-F0-9]{8}`, 'i')
}

export function getWidgetFee() {
  return new RegExp(`\\s*\\d*\\.?\\d+\\s*%\\s*`, 'i')
}

export function getTokenValue() {
  return new RegExp(`\\$\\d+`, 'i')
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

export function verifyOrderDetails(limitPrice, slippage, interactWith, oderID, widgetFee) {
  cy.contains(limitPrice)
  cy.contains(slippage)
  cy.contains(oderID)
  cy.contains(widgetFee)
  cy.contains(interactWith)
}

export function verifyRecipientAlertIsDisplayed() {
  cy.contains(recipientWarningMsg)
}

export function closeIntroTwapModal() {
  cy.get('button')
    .contains(unlockTwapOrdersStrBtn)
    .should(() => {})
    .then(($button) => {
      if (!$button.length) {
        return
      }
      cy.wrap($button).click()
      cy.contains(unlockTwapOrdersStrBtn).should('not.exist')
      cy.wait(500)
    })
}

export function switchToTwap() {
  cy.get('button').contains(selectTokenStr).should('be.visible')
  cy.get('div').contains(swapStrBtn).should('be.visible').click()
  cy.wait(1000)
  cy.get('div').contains(twapStrBtn).should('be.visible').click()
  cy.wait(1000)
  closeIntroTwapModal()
}

export function switchToLimit() {
  cy.get('button').contains(selectTokenStr).should('be.visible')
  cy.get('a').contains(swapStrBtn).click()
  cy.wait(1000)
  cy.get('a').contains(limitStrBtn).click()
  cy.wait(1000)
  closeIntroTwapModal()
}

export function checkTokenBalanceAndValue(tokenDirection, balance, value) {
  let direction = inputCurrencyInput
  if (tokenDirection === 'output') direction = outputCurrencyInput
  cy.get(direction).within(() => {
    cy.contains(balance).should('be.visible')
    cy.contains(value).should('be.visible')
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

export function clickOnTokenSelctor(direction) {
  let selector = inputCurrencyInput
  if (direction === 'output') selector = outputCurrencyInput
  cy.get(selector).find('button').eq(0).click()
}

export function checkTokenList(tokens) {
  cy.get(tokenList).within(() => {
    tokens.forEach(({ name, balance }) => {
      cy.get(tokenItem).contains(name).should('exist')
      cy.get(tokenBalance).contains(balance).should('exist')
    })
  })
}

export function clickOnMaxBtn() {
  cy.get('button').contains(maxStrBtn).click()
}

export function checkInputValue(direction, value) {
  let selector = inputCurrencyInput
  if (direction === 'output') selector = outputCurrencyInput
  cy.get(selector).find('input').invoke('val').should('eq', value)
}

export function checkInsufficientBalanceMessageDisplayed(token) {
  const text = getInsufficientBalanceStr(token)
  cy.get('button').contains(text).should('be.disabled')
}

export function checkSmallSellAmountMessageDisplayed() {
  cy.get('button').contains(sellAmountIsSmallStr).should('be.disabled')
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

export function getTwapInitialData() {
  cy.wait(1000)
  let formData = {}

  return cy
    .wrap(null)
    .then(() => {
      cy.get(inputCurrencyInput).within(() => {
        cy.get('input', { timeout: 10000 })
          .should(($input) => {
            const value = parseFloat($input.val())
            expect(value).to.be.greaterThan(0)
          })
          .invoke('val')
          .should('not.be.empty')
          .then((value) => {
            formData.inputToken = value
          })
      })

      cy.get(outputCurrencyInput).within(() => {
        cy.get('input', { timeout: 10000 })
          .should(($input) => {
            const value = parseFloat($input.val())
            expect(value).to.be.greaterThan(0)
          })
          .invoke('val')
          .should('not.be.empty')
          .then((value) => {
            formData.outputToken = value
          })
      })

      cy.get(inputCurrencyInput).within(() => {
        cy.get('button')
          .find('span')
          .filter((index, button) => Cypress.$(button).text().trim().length > 0)
          .invoke('text')
          .should('not.be.empty')
          .then((text) => {
            formData.inputTokenName = text
          })
      })

      cy.get(outputCurrencyInput).within(() => {
        cy.get('button')
          .filter((index, button) => Cypress.$(button).text().trim().length > 0)
          .invoke('text')
          .should('not.be.empty')
          .then((text) => {
            formData.outputTokenName = text
          })
      })

      cy.get('span')
        .contains(totalDurationStr)
        .next()
        .invoke('text')
        .should('not.be.empty')
        .then((value) => {
          formData.totalDuration = value
            .toLowerCase()
            .replace(/\bhours?\b/, 'hour')
            .trim()
        })

      cy.get('span')
        .contains(partDuration)
        .next()
        .invoke('text')
        .should('not.be.empty')
        .then((value) => {
          formData.partDuration = value
            .toLowerCase()
            .replace(/(\d+)m\b/, '$1 minutes')
            .trim()
        })

      cy.get(outputCurrencyInput).within(() => {
        cy.get('input', { timeout: 10000 })
          .should(($input) => {
            const value = parseFloat($input.val())
            expect(value).to.be.greaterThan(0)
          })
          .invoke('val')
          .should('not.be.empty')
          .then((value) => {
            formData.outputToken = value
          })
      })

      cy.get('span')
        .contains(sellperPartStr)
        .next()
        .invoke('text')
        .should('not.be.empty')
        .then((value) => {
          formData.sellPart = value
        })

      cy.get('span')
        .contains(numberOfPartsStr)
        .next()
        .find('input')
        .invoke('val')
        .should('not.be.empty')
        .then((value) => {
          formData.numberOfParts = value
        })
    })
    .then(() => {
      console.log('****************** Collected FormData:', formData)
      return cy.wrap(formData)
    })
}

export function checkTwapValuesInReviewScreen(formData) {
  main.verifyValuesExist(modals.cardContent, [
    orderDetailsStr,
    formData.inputToken,
    formData.inputTokenName,
    formData.outputTokenName,
    formData.sellPart,
    swapsHistory.interactWith,
    swapsHistory.widget_fee,
    swapsHistory.slippage,
    swapsHistory.expiry,
    swapsHistory.limitPrice,
  ])

  cy.get(create_tx.txRowTitle)
    .contains(totalDurationStr)
    .parent()
    .next()
    .invoke('text')
    .then((displayedValue) => {
      const normalizedDisplayedValue = displayedValue
        .toLowerCase()
        .replace(/\bhours?\b/, 'hour')
        .trim()
      expect(normalizedDisplayedValue).to.eq(formData.totalDuration)
    })

  cy.get(create_tx.txRowTitle)
    .contains(partDuration)
    .parent()
    .next()
    .invoke('text')
    .then((displayedValue) => {
      const normalizedDisplayedValue = displayedValue
        .toLowerCase()
        .replace(/\b(m|minutes?)\b/, 'minutes')
        .trim()
      expect(normalizedDisplayedValue).to.eq(formData.partDuration)
    })

  cy.get(create_tx.txRowTitle).contains(sellperPartStr2).parent().next().should('contain', formData.sellPart)

  cy.get('p')
    .contains(orderSplit)
    .invoke('text')
    .then((text) => {
      expect(text).to.include(formData.numberOfParts)
    })
}

export function getMockQuoteResponse(response) {
  cy.fixture(response).then((mockQuote) => {
    const validTo = Math.floor(Date.now() / 1000) + 60 * 60 * 24
    const expiration = new Date(validTo * 1000).toISOString()
    mockQuote.quote.validTo = validTo
    mockQuote.expiration = expiration

    cy.intercept('POST', '**/quote', {
      statusCode: 200,
      body: mockQuote,
    }).as('mockedQuote')
  })
}
