import * as main from './main.page.js'
import * as create_tx from './create_tx.pages.js'

const existStr = 'Exit'
const validatorStatusStr = 'Validator status'

export const dataFields = {
  deposit: 'Deposit',
  netRewardRate: 'Net reward rate',
  netAnnualRewards: 'Net annual rewards',
  netMonthlyRewards: 'Net monthly rewards',
  fee: 'Fee',
  validators: 'Validators',
  activationTime: 'Activation time',
  rewards: 'Rewards',
}

export const validatorStatusOptions = {
  withdrwal: 'Withdrawn',
}

export const stakingTxs = {
  claim:
    '&id=multisig_0xAD1Cf279D18f34a13c3Bf9b79F4D427D5CD9505B_0xa763d9d136df5efc17e9825f4cca58033cd86a078b3e56500ccd1b53a2362e3b',
  withdrawal:
    '&id=multisig_0xAD1Cf279D18f34a13c3Bf9b79F4D427D5CD9505B_0x84f2ec635b73eaaea60ba813b12deaa370f413651ba08861cc0e9f080bffbecc',
  stake:
    '&id=multisig_0xAD1Cf279D18f34a13c3Bf9b79F4D427D5CD9505B_0xd1699838071a472d26963f2b823a4c835e9acd449d0376ca1d468a666903130d',
}

export function getPercentageRegex() {
  return new RegExp('^\\d+(\\.\\d+)?\\s?%$')
}

export function getRewardRegex() {
  return new RegExp('^\\d+(\\.\\d+)? ETH \\(\\$\\s?\\d{1,3}(,\\d{3})*\\)$')
}

export function getActivationTimeRegex() {
  return new RegExp('^\\d+\\s+hour(s)?\\s+\\d+\\s+minute(s)?$')
}

export function checkActivationTimeNonEmpty() {
  return new RegExp('.+')
}

export function checkTxHeaderData(data) {
  main.verifyValuesExist(create_tx.transactionItem, data)
}

export function verifyValidatorCount(count) {
  cy.get(create_tx.txRowTitle).contains(existStr).parent().next().contains(`Validator ${count}`).should('exist')
}

export function verifyValidatorStatus(status) {
  cy.get(create_tx.txRowTitle).contains(validatorStatusStr).parent().next().contains(status).should('exist')
}

export function checkDataFields(field, value) {
  cy.get(create_tx.txRowTitle)
    .contains(field)
    .parent()
    .next()
    .invoke('text')
    .then((text) => {
      const trimmedText = text.trim()
      if (value instanceof RegExp) {
        expect(trimmedText).to.match(value)
      } else {
        expect(trimmedText).to.include(value)
      }
    })
}
