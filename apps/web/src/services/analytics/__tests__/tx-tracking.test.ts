import {
  SettingsInfoType,
  type TransactionDetails,
  TransactionInfoType,
  TransactionTokenType,
} from '@safe-global/safe-gateway-typescript-sdk'
import { getTransactionTrackingType } from '../tx-tracking'
import { TX_TYPES } from '../events/transactions'

describe('getTransactionTrackingType', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should return transfer_token for native token transfers', async () => {
    const details = {
      txInfo: {
        type: TransactionInfoType.TRANSFER,
        transferInfo: {
          type: TransactionTokenType.NATIVE_COIN,
        },
      },
    } as TransactionDetails
    const txType = getTransactionTrackingType(details)
    expect(txType).toEqual(TX_TYPES.transfer_token)
  })

  it('should return transfer_token for ERC20 token transfers', async () => {
    const details = {
      txInfo: {
        type: TransactionInfoType.TRANSFER,
        transferInfo: {
          type: TransactionTokenType.ERC20,
        },
      },
    } as unknown as TransactionDetails
    const txType = getTransactionTrackingType(details)
    expect(txType).toEqual(TX_TYPES.transfer_token)
  })

  it('should return transfer_nft for ERC721 token transfers', async () => {
    const details = {
      txInfo: {
        type: TransactionInfoType.TRANSFER,
        transferInfo: {
          type: TransactionTokenType.ERC721,
        },
      },
    } as unknown as TransactionDetails
    const txType = getTransactionTrackingType(details)
    expect(txType).toEqual(TX_TYPES.transfer_nft)
  })

  it('should return owner_add for add owner settings changes', async () => {
    const details = {
      txInfo: {
        type: TransactionInfoType.SETTINGS_CHANGE,
        settingsInfo: {
          type: SettingsInfoType.ADD_OWNER,
        },
      },
    } as unknown as TransactionDetails
    const txType = getTransactionTrackingType(details)
    expect(txType).toEqual(TX_TYPES.owner_add)
  })

  it('should return owner_remove for remove owner settings changes', async () => {
    const details = {
      txInfo: {
        type: TransactionInfoType.SETTINGS_CHANGE,
        settingsInfo: {
          type: SettingsInfoType.REMOVE_OWNER,
        },
      },
    } as unknown as TransactionDetails
    const txType = getTransactionTrackingType(details)
    expect(txType).toEqual(TX_TYPES.owner_remove)
  })

  it('should return owner_swap for swap owner settings changes', async () => {
    const details = {
      txInfo: {
        type: TransactionInfoType.SETTINGS_CHANGE,
        settingsInfo: {
          type: SettingsInfoType.SWAP_OWNER,
        },
      },
    } as unknown as TransactionDetails
    const txType = getTransactionTrackingType(details)
    expect(txType).toEqual(TX_TYPES.owner_swap)
  })

  it('should return owner_threshold_change for change threshold settings changes', async () => {
    const details = {
      txInfo: {
        type: TransactionInfoType.SETTINGS_CHANGE,
        settingsInfo: {
          type: SettingsInfoType.CHANGE_THRESHOLD,
        },
      },
    } as unknown as TransactionDetails
    const txType = getTransactionTrackingType(details)
    expect(txType).toEqual(TX_TYPES.owner_threshold_change)
  })

  it('should return module_remove for disable module settings changes', async () => {
    const details = {
      txInfo: {
        type: TransactionInfoType.SETTINGS_CHANGE,
        settingsInfo: {
          type: SettingsInfoType.DISABLE_MODULE,
        },
      },
    } as unknown as TransactionDetails
    const txType = getTransactionTrackingType(details)
    expect(txType).toEqual(TX_TYPES.module_remove)
  })

  it('should return guard_remove for delete guard settings changes', async () => {
    const details = {
      txInfo: {
        type: TransactionInfoType.SETTINGS_CHANGE,
        settingsInfo: {
          type: SettingsInfoType.DELETE_GUARD,
        },
      },
    } as unknown as TransactionDetails
    const txType = getTransactionTrackingType(details)
    expect(txType).toEqual(TX_TYPES.guard_remove)
  })

  it('should return rejection for rejection transactions', async () => {
    const details = {
      txInfo: {
        type: TransactionInfoType.CUSTOM,
        isCancellation: true,
      },
    } as unknown as TransactionDetails
    const txType = getTransactionTrackingType(details)
    expect(txType).toEqual(TX_TYPES.rejection)
  })

  it('should return walletconnect for transactions w/o safeAppInfo', async () => {
    const details = {
      txInfo: {
        type: TransactionInfoType.CUSTOM,
      },
      safeAppInfo: null,
    } as unknown as TransactionDetails
    const txType = getTransactionTrackingType(details)
    expect(txType).toEqual(TX_TYPES.walletconnect)
  })

  it('should return safeapps for safeapps transactions', async () => {
    const details = {
      txInfo: {
        type: TransactionInfoType.CUSTOM,
      },
      safeAppInfo: {
        url: 'https://gnosis-safe.io/app',
      },
    } as unknown as TransactionDetails
    const txType = getTransactionTrackingType(details)
    expect(txType).toEqual('https://gnosis-safe.io/app')
  })

  it('should return batch for multisend transactions', async () => {
    const details = {
      txInfo: {
        type: TransactionInfoType.CUSTOM,
        methodName: 'multiSend',
        actionCount: 2,
      },
    } as unknown as TransactionDetails
    const txType = getTransactionTrackingType(details)
    expect(txType).toEqual(TX_TYPES.batch)
  })

  it('should return native_bridge for native bridge transactions', () => {
    const details = {
      txInfo: {
        type: TransactionInfoType.CUSTOM,
      },
    } as unknown as TransactionDetails
    const origin = '{"url":"https://iframe.jumper.exchange/bridge","name":"Bridge"}'
    const txType = getTransactionTrackingType(details, origin)
    expect(txType).toEqual(TX_TYPES.native_bridge)
  })

  it('should return native_swap_lifi for native swap lifi transactions', () => {
    const details = {
      txInfo: {
        type: TransactionInfoType.CUSTOM,
      },
    } as unknown as TransactionDetails
    const origin = '{"url":"https://iframe.jumper.exchange/swap","name":"Swap"}'
    const txType = getTransactionTrackingType(details, origin)
    expect(txType).toEqual(TX_TYPES.native_swap_lifi)
  })
})
