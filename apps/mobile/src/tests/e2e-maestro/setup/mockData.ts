import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { SafeInfo } from '@/src/types/address'

// Mocked signer address for pending tx tests
export const mockedPendingTxSignerAddress = '0xC16Db0251654C0a72E91B190d81eAD367d2C6fED'

// Primary onboarded account (used by multiple tests)
export const mockedActiveAccount: SafeInfo = {
  address: '0x2f3e600a3F38b66aDcbe6530B191F2BE55c2Fbb6',
  chainId: '11155111',
}

export const mockedActiveSafeInfo: SafeOverview = {
  address: { value: '0x2f3e600a3F38b66aDcbe6530B191F2BE55c2Fbb6', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: mockedActiveAccount.chainId,
  fiatTotal: '0',
  owners: [
    { value: '0x3336745b7EA628F5134Bd9d08aa68b4979fA3472', name: null, logoUri: null },
    { value: '0x81BdB0a66065363F704A105D67D53d090aD14fec', name: null, logoUri: null },
    { value: '0x4d5CF9E6df9a95F4c1F5398706cA27218add5949', name: null, logoUri: null },
  ],
  queued: 1,
  threshold: 1,
}

// Secondary account for history tests
export const mockedActiveAccount1: SafeInfo = {
  address: '0x9BFCA75a05175503580D593F4330b5505c594596',
  chainId: '11155111',
}

export const mockedActiveSafeInfo1: SafeOverview = {
  address: { value: '0x9BFCA75a05175503580D593F4330b5505c594596', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: mockedActiveAccount1.chainId,
  fiatTotal: '0',
  owners: [
    { value: '0x65F8236309e5A99Ff0d129d04E486EBCE20DC7B0', name: null, logoUri: null },
    { value: '0x0D65139Da4B36a8A39BF1b63e950038D42231b2e', name: null, logoUri: null },
    { value: '0x8aEf2f5c3F17261F6F1C4dA058D022BE92776af8', name: null, logoUri: null },
  ],
  queued: 1,
  threshold: 1,
}

// Swap order account for COW protocol tests
export const mockedSwapOrderAccount: SafeInfo = {
  address: '0x03042B890b99552b60A073F808100517fb148F60',
  chainId: '11155111',
}

export const mockedSwapOrderSafeInfo: SafeOverview = {
  address: { value: '0x03042B890b99552b60A073F808100517fb148F60', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: mockedSwapOrderAccount.chainId,
  fiatTotal: '0',
  owners: [
    { value: '0x65F8236309e5A99Ff0d129d04E486EBCE20DC7B0', name: null, logoUri: null },
    { value: '0x0D65139Da4B36a8A39BF1b63e950038D42231b2e', name: null, logoUri: null },
  ],
  queued: 0,
  threshold: 1,
}

// Assets test data
export const assetsTestData: { safes: Record<string, SafeOverview> } = {
  safes: {
    Safe1: {
      address: { value: '0x2f3e600a3F38b66aDcbe6530B191F2BE55c2Fbb6', name: null, logoUri: null },
      awaitingConfirmation: null,
      chainId: mockedActiveAccount.chainId,
      fiatTotal: '0',
      owners: [
        { value: '0x3336745b7EA628F5134Bd9d08aa68b4979fA3472', name: null, logoUri: null },
        { value: '0x81BdB0a66065363F704A105D67D53d090aD14fec', name: null, logoUri: null },
        { value: '0x4d5CF9E6df9a95F4c1F5398706cA27218add5949', name: null, logoUri: null },
      ],
      queued: 1,
      threshold: 1,
    },
    Safe2: {
      address: { value: '0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415', name: null, logoUri: null },
      awaitingConfirmation: null,
      chainId: mockedActiveAccount.chainId,
      fiatTotal: '0',
      owners: [
        { value: '0x61a0c717d18232711bC788F19C9Cd56a43cc8872', name: null, logoUri: null },
        { value: '0x0D65139Da4B36a8A39BF1b63e950038D42231b2e', name: null, logoUri: null },
      ],
      queued: 1,
      threshold: 1,
    },
  },
}

// Transaction history test account
export const mockedTxHistoryAccount: SafeInfo = {
  address: '0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb',
  chainId: '11155111',
}

export const mockedTxHistorySafeInfo: SafeOverview = {
  address: { value: '0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: mockedTxHistoryAccount.chainId,
  fiatTotal: '0',
  owners: [
    { value: '0x4fe7164d7cA511Ab35520bb14065F1693240dC90', name: null, logoUri: null },
    { value: '0xC16Db0251654C0a72E91B190d81eAD367d2C6fED', name: null, logoUri: null },
    { value: '0x96D4c6fFC338912322813a77655fCC926b9A5aC5', name: null, logoUri: null },
  ],
  queued: 0,
  threshold: 1,
}

// Stake deposit test account
export const mockedStakeDepositAccount: SafeInfo = {
  address: '0xAD1Cf279D18f34a13c3Bf9b79F4D427D5CD9505B',
  chainId: '1',
}

export const mockedStakeDepositSafeInfo: SafeOverview = {
  address: { value: '0xAD1Cf279D18f34a13c3Bf9b79F4D427D5CD9505B', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: mockedStakeDepositAccount.chainId,
  fiatTotal: '0',
  owners: [
    { value: '0x4fe7164d7cA511Ab35520bb14065F1693240dC90', name: null, logoUri: null },
    { value: '0xC16Db0251654C0a72E91B190d81eAD367d2C6fED', name: null, logoUri: null },
    { value: '0x96D4c6fFC338912322813a77655fCC926b9A5aC5', name: null, logoUri: null },
  ],
  queued: 0,
  threshold: 1,
}

// Pending transaction test safes (6 safes for different pending tx scenarios)
export const pendingTxSafe1: SafeInfo = {
  address: '0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415',
  chainId: '11155111',
}

export const pendingTxSafeInfo1: SafeOverview = {
  address: { value: '0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: pendingTxSafe1.chainId,
  fiatTotal: '0',
  owners: [{ value: mockedPendingTxSignerAddress, name: null, logoUri: null }],
  queued: 0,
  threshold: 1,
}

export const pendingTxSafe2: SafeInfo = {
  address: '0xD8b85a669413b25a8BE7D7698f88b7bFA20889d2',
  chainId: '11155111',
}

export const pendingTxSafeInfo2: SafeOverview = {
  address: { value: '0xD8b85a669413b25a8BE7D7698f88b7bFA20889d2', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: pendingTxSafe2.chainId,
  fiatTotal: '0',
  owners: [{ value: mockedPendingTxSignerAddress, name: null, logoUri: null }],
  queued: 0,
  threshold: 1,
}

export const pendingTxSafe3: SafeInfo = {
  address: '0xc36A530ccD728d36a654ccedEB7994473474C018',
  chainId: '11155111',
}

export const pendingTxSafeInfo3: SafeOverview = {
  address: { value: '0xc36A530ccD728d36a654ccedEB7994473474C018', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: pendingTxSafe3.chainId,
  fiatTotal: '0',
  owners: [{ value: mockedPendingTxSignerAddress, name: null, logoUri: null }],
  queued: 0,
  threshold: 1,
}

export const pendingTxSafe4: SafeInfo = {
  address: '0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb',
  chainId: '11155111',
}

export const pendingTxSafeInfo4: SafeOverview = {
  address: { value: '0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: pendingTxSafe4.chainId,
  fiatTotal: '0',
  owners: [{ value: mockedPendingTxSignerAddress, name: null, logoUri: null }],
  queued: 0,
  threshold: 1,
}

export const pendingTxSafe5: SafeInfo = {
  address: '0x4B8A8Ca9F0002a850CB2c81b205a6D7429a22DEe',
  chainId: '11155111',
}

export const pendingTxSafeInfo5: SafeOverview = {
  address: { value: '0x4B8A8Ca9F0002a850CB2c81b205a6D7429a22DEe', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: pendingTxSafe5.chainId,
  fiatTotal: '0',
  owners: [{ value: mockedPendingTxSignerAddress, name: null, logoUri: null }],
  queued: 0,
  threshold: 1,
}

export const pendingTxSafe6: SafeInfo = {
  address: '0xAC456f5422C13b93d4ac819c3E52bA418E401EaA',
  chainId: '11155111',
}

export const pendingTxSafeInfo6: SafeOverview = {
  address: { value: '0xAC456f5422C13b93d4ac819c3E52bA418E401EaA', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: pendingTxSafe6.chainId,
  fiatTotal: '0',
  owners: [{ value: mockedPendingTxSignerAddress, name: null, logoUri: null }],
  queued: 0,
  threshold: 1,
}

// Seed phrase import test account
export const mockedSeedPhraseImportAccount: SafeInfo = {
  address: '0x4c425AceFf91aa4398183FE82e210C96dD9E92F8',
  chainId: '11155111',
}

export const mockedSeedPhraseImportSafeInfo: SafeOverview = {
  address: { value: '0x4c425AceFf91aa4398183FE82e210C96dD9E92F8', name: null, logoUri: null },
  awaitingConfirmation: null,
  chainId: mockedSeedPhraseImportAccount.chainId,
  fiatTotal: '0',
  owners: [{ value: '0xaE03f216A54857b995d79468882AfB07251B1154', name: null, logoUri: null }],
  queued: 0,
  threshold: 1,
}
