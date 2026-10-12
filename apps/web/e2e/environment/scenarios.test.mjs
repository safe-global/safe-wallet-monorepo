import assert from 'node:assert/strict'
import { test } from 'node:test'
import { transactionServiceCheck } from './scenarios/indexing.mjs'

const SAFE = '0x5cB12ca69FD636349521c76c2D50331eDBB29176'
const CGW = 'http://localhost:8000/cgw/v1/chains'
const TXS = 'http://localhost:8000/txs/api'
const env = {
  SAFE_TXS_BASE_URL: TXS,
  SAFE_E2E_CHAINS: { 137: { transactionServiceUrl: 'http://localhost:8000/txs-polygon/api' } },
}

test('waits until TXS knows a Safe before asking CGW about it or its sub-resources', () => {
  assert.deepEqual(transactionServiceCheck(env, `${CGW}/11155111/safes/${SAFE}`), {
    url: `${TXS}/v1/safes/${SAFE}/`,
    samePredicate: false,
  })
  assert.deepEqual(transactionServiceCheck(env, `${CGW}/137/safes/${SAFE}/balances/usd?trusted=false`), {
    url: `http://localhost:8000/txs-polygon/api/v1/safes/${SAFE}/`,
    samePredicate: false,
  })
})

test('checks creation and owner lists against TXS with the scenario condition', () => {
  assert.deepEqual(transactionServiceCheck(env, `${CGW}/11155111/safes/${SAFE}/transactions/creation`), {
    url: `${TXS}/v1/safes/${SAFE}/creation/`,
    samePredicate: true,
  })
  assert.deepEqual(transactionServiceCheck(env, `${CGW}/11155111/owners/${SAFE}/safes`), {
    url: `${TXS}/v1/owners/${SAFE}/safes/`,
    samePredicate: true,
  })
})

test('waits until TXS knows a multisig transaction before asking CGW for its details', () => {
  const hash = `0x${'ab'.repeat(32)}`
  assert.deepEqual(transactionServiceCheck(env, `${CGW}/11155111/transactions/multisig_${SAFE}_${hash}`), {
    url: `${TXS}/v1/multisig-transactions/${hash}/`,
    samePredicate: false,
  })
  assert.equal(transactionServiceCheck(env, `${CGW}/11155111/transactions/multisig_${SAFE}_0x12`), undefined)
})

test('leaves contracts to CGW, which reads them from the decoder service', () => {
  assert.equal(transactionServiceCheck(env, `${CGW}/11155111/contracts/${SAFE}`), undefined)
})

test('skips the Transaction Service wait when the run does not know it', () => {
  assert.equal(transactionServiceCheck(env, `${CGW}/1/safes/${SAFE}`), undefined)
  assert.equal(transactionServiceCheck({}, `${CGW}/11155111/safes/${SAFE}`), undefined)
})

test('ignores URLs that name no Safe or owner', () => {
  assert.equal(transactionServiceCheck(env, `${CGW}/11155111/about/indexing`), undefined)
  assert.equal(transactionServiceCheck(env, `${CGW}/11155111/safes/0x1234`), undefined)
})
