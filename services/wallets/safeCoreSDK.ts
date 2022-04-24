import Safe from '@gnosis.pm/safe-core-sdk'
import Web3Adapter from '@gnosis.pm/safe-web3-lib'
import semverSatisfies from 'semver/functions/satisfies'
import chains from '@/config/chains'
import Web3 from 'web3'

const LEGACY_VERSION = '<1.3.0'

// Safe Core SDK
const initSafeSDK = async (
  walletProvider: any,
  signerAddress: string,
  chainId: string,
  safeAddress: string,
  safeVersion: string,
): Promise<Safe> => {
  const ethAdapter = new Web3Adapter({
    signerAddress,
    web3: new Web3(walletProvider),
  })

  let isL1SafeMasterCopy = chainId === chains.eth
  // Legacy Safe contracts
  if (semverSatisfies(safeVersion, LEGACY_VERSION)) {
    isL1SafeMasterCopy = true
  }

  return await Safe.create({
    ethAdapter,
    safeAddress,
    isL1SafeMasterCopy,
  })
}

let safeSDK: Safe
export const getSafeSDK = (): Safe => safeSDK
export const setSafeSDK: typeof initSafeSDK = (...args) => initSafeSDK(...args).then((safe) => (safeSDK = safe))
