import { test as baseTest } from './base.fixture'

export { connectSigner } from '../helpers/wallet'

export type WalletCredentials = {
  OWNER_1_PRIVATE_KEY: string
  OWNER_1_WALLET_ADDRESS: string
  OWNER_2_PRIVATE_KEY: string
  OWNER_2_WALLET_ADDRESS: string
  OWNER_3_PRIVATE_KEY: string
  OWNER_3_WALLET_ADDRESS: string
  OWNER_4_PRIVATE_KEY: string
  OWNER_4_WALLET_ADDRESS: string
}

function getWalletCredentials(): WalletCredentials {
  const raw = process.env.CYPRESS_WALLET_CREDENTIALS || process.env.WALLET_CREDENTIALS
  if (!raw) {
    throw new Error(
      'Missing WALLET_CREDENTIALS env var. Set it to a JSON blob containing OWNER_1..4_PRIVATE_KEY and OWNER_1..4_WALLET_ADDRESS. ' +
        'Tests that use walletCredentials cannot run without real signer keys.',
    )
  }
  return JSON.parse(raw)
}

export type WalletFixtures = {
  walletCredentials: WalletCredentials
}

export const test = baseTest.extend<WalletFixtures>({
  walletCredentials: async ({}, use) => {
    await use(getWalletCredentials())
  },
})

export { expect } from '@playwright/test'
