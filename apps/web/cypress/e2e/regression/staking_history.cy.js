import * as constants from '../../support/constants.js'
import * as create_tx from '../pages/create_tx.pages.js'
import * as staking from '../pages/staking.page.js'
import * as staking_data from '../../fixtures/staking_data.json'

const safe = 'eth:0xAD1Cf279D18f34a13c3Bf9b79F4D427D5CD9505B'
const historyData = staking_data.type.history

describe('Staking history tests', { defaultCommandTimeout: 30000 }, () => {
  // Unskip when decoding is fixed on staging
  it.skip('Verify Claim tx shows amount received', () => {
    cy.visit(constants.transactionUrl + safe + staking.stakingTxs.claim)
    staking.checkTxHeaderData([historyData.ETH_3205184, historyData.claim])
    create_tx.verifyExpandedDetails([historyData.ETH_3205184, historyData.received])
    create_tx.clickOnAdvancedDetails()
    create_tx.verifyAdvancedDetails([historyData.call_batchWithdrawCLFee, historyData.StakingContract])
  })

  // Unskip when decoding is fixed on staging
  it.skip('Verify Withdraw request shows amount of validators and Validator status', () => {
    cy.visit(constants.transactionUrl + safe + staking.stakingTxs.withdrawal)
    staking.checkTxHeaderData([historyData.withdrawal, historyData.validator_1])
    staking.verifyValidatorCount(1)
    staking.verifyValidatorStatus(staking.validatorStatusOptions.withdrwal)
    create_tx.clickOnAdvancedDetails()
    create_tx.verifyAdvancedDetails([historyData.call_requestValidatorsExit, historyData.StakingContract])
  })

  // Unskip when decoding is fixed on staging
  it.skip('Verify Stake tx show the amount staked and proper fields', () => {
    cy.visit(constants.transactionUrl + safe + staking.stakingTxs.stake)
    staking.checkTxHeaderData([historyData.ETH32_2, historyData.stake])
    staking.checkDataFields(staking.dataFields.deposit, historyData.ETH_32)
    staking.checkDataFields(staking.dataFields.netRewardRate, staking.getPercentageRegex())
    staking.checkDataFields(staking.dataFields.netAnnualRewards, staking.getRewardRegex())
    staking.checkDataFields(staking.dataFields.netMonthlyRewards, staking.getRewardRegex())
    staking.checkDataFields(staking.dataFields.fee, staking.getPercentageRegex())
    staking.checkDataFields(staking.dataFields.validators, '1')
    staking.checkDataFields(staking.dataFields.activationTime, staking.checkActivationTimeNonEmpty())
    staking.checkDataFields(staking.dataFields.rewards, historyData.rewardsValue)
  })
})
