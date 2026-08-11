/**
 * Hand-authored transaction rows for TxSummary.stories.tsx.
 *
 * There are no transaction fixtures under config/test/msw/fixtures, so these are typed directly
 * against the generated gateway types. Every queue row deliberately shares the same nonce block,
 * confirmation count (1 of 3) and status, so the trailing cells are identical across types and any
 * misalignment in a stacked list comes from the type/amount cells alone.
 *
 * Queue timestamps are offsets from `Date.now()`, because the queue renders a relative label — an
 * offset keeps "5 minutes ago" byte-identical on every run. History rows render the wall-clock time
 * of day instead, so those need a fixed absolute instant; a `Date.now()` offset there would print a
 * new time every minute and churn the snapshot and Argos baselines.
 */
import type {
  AddressInfo,
  MultisigTransaction,
  TokenInfo,
  Transaction,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const NOW = Date.now()

/** Fixed instant for the executed rows: 2024-05-14 13:07 UTC. */
const EXECUTED_AT = Date.UTC(2024, 4, 14, 13, 7)

/** Matches the efSafe fixture the stories load: 3-of-5, nonce 28. */
const SAFE_ADDRESS = '0x9fC3dc011b461664c835F2527fffb1169b3C213e'
const NEXT_NONCE = 28
const CONFIRMATIONS_REQUIRED = 3

const SAFE: AddressInfo = { value: SAFE_ADDRESS, name: null, logoUri: null }
const VITALIK: AddressInfo = { value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', name: 'vitalik.eth', logoUri: null }

const TOKEN_LOGO = (address: string) => `https://safe-transaction-assets.safe.global/tokens/logos/${address}.png`

const WETH: TokenInfo = {
  address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  decimals: 18,
  logoUri: TOKEN_LOGO('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  name: 'Wrapped Ether',
  symbol: 'WETH',
  trusted: true,
}

const USDC: TokenInfo = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  decimals: 6,
  logoUri: TOKEN_LOGO('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
  name: 'USD Coin',
  symbol: 'USDC',
  trusted: true,
}

/** Deliberately absurd symbols and an 8-figure amount, to push the swap cell past its track. */
const LONG_NAME_LP: TokenInfo = {
  address: '0x06325440D014e39736583c165C2963BA99fAf14E',
  decimals: 18,
  logoUri: TOKEN_LOGO('0x06325440D014e39736583c165C2963BA99fAf14E'),
  name: 'Curve.fi ETH/stETH Gauge Deposit',
  symbol: 'steCRV-GAUGE-DEPOSIT',
  trusted: true,
}

const LONG_NAME_VAULT: TokenInfo = {
  address: '0x83F20F44975D03b1b09e64809B757c47f942BEeA',
  decimals: 18,
  logoUri: TOKEN_LOGO('0x83F20F44975D03b1b09e64809B757c47f942BEeA'),
  name: 'Savings Dai',
  symbol: 'sDAI-USDC-USDT-3POOL-LP',
  trusted: true,
}

type TxInfo = Transaction['txInfo']

const txId = (suffix: string) => `multisig_${SAFE_ADDRESS}_0x${suffix.padEnd(64, '0')}`

/**
 * A queue row: awaiting confirmations, one of three signatures in, so every row renders the same
 * "1/3" badge and the same Confirm button.
 */
const queueRow = ({
  id,
  nonce,
  txInfo,
  timestamp,
}: {
  id: string
  nonce: number
  txInfo: TxInfo
  timestamp: number
}): MultisigTransaction => ({
  type: 'TRANSACTION',
  transaction: {
    id: txId(id),
    txHash: null,
    timestamp,
    txStatus: 'AWAITING_CONFIRMATIONS',
    txInfo,
    executionInfo: {
      type: 'MULTISIG',
      nonce,
      confirmationsRequired: CONFIRMATIONS_REQUIRED,
      confirmationsSubmitted: 1,
      missingSigners: null,
    },
  },
  conflictType: 'None',
})

/** An executed row: history drops the confirmations and actions cells and renders a status instead. */
const historyRow = ({
  id,
  nonce,
  txInfo,
  timestamp,
}: {
  id: string
  nonce: number
  txInfo: TxInfo
  timestamp: number
}): MultisigTransaction => ({
  type: 'TRANSACTION',
  transaction: {
    id: txId(id),
    txHash: `0x${id.padEnd(64, 'a')}`,
    timestamp,
    txStatus: 'SUCCESS',
    txInfo,
    executionInfo: {
      type: 'MULTISIG',
      nonce,
      confirmationsRequired: CONFIRMATIONS_REQUIRED,
      confirmationsSubmitted: CONFIRMATIONS_REQUIRED,
      missingSigners: null,
    },
  },
  conflictType: 'None',
})

const nativeTransferInfo: TxInfo = {
  type: 'Transfer',
  sender: SAFE,
  recipient: VITALIK,
  direction: 'OUTGOING',
  transferInfo: { type: 'NATIVE_COIN', value: '34500000000000000' },
}

const erc20TransferInfo: TxInfo = {
  type: 'Transfer',
  sender: SAFE,
  recipient: VITALIK,
  direction: 'OUTGOING',
  transferInfo: {
    type: 'ERC20',
    tokenAddress: USDC.address,
    tokenName: USDC.name,
    tokenSymbol: USDC.symbol,
    logoUri: USDC.logoUri,
    decimals: USDC.decimals,
    value: '4018860000',
    trusted: true,
    imitation: false,
  },
}

/**
 * SwapTx renders the two order kinds asymmetrically — the side that carries the limit shows an
 * amount, the other only a token symbol — so both kinds get their own fixture.
 */
const swapOrder = ({
  kind,
  sellToken,
  buyToken,
  sellAmount,
  buyAmount,
  status = 'open',
  validUntil = Math.floor((NOW + 30 * DAY) / 1000),
}: {
  kind: 'sell' | 'buy'
  sellToken: TokenInfo
  buyToken: TokenInfo
  sellAmount: string
  buyAmount: string
  status?: 'open' | 'fulfilled'
  validUntil?: number
}): TxInfo => ({
  type: 'SwapOrder',
  uid: `0x${kind.padEnd(112, 'f')}`,
  status,
  kind,
  orderClass: 'market',
  validUntil,
  sellAmount,
  buyAmount,
  executedSellAmount: status === 'fulfilled' ? sellAmount : '0',
  executedBuyAmount: status === 'fulfilled' ? buyAmount : '0',
  sellToken,
  buyToken,
  explorerUrl: 'https://explorer.cow.fi/orders/0x',
  executedFee: '0',
  executedFeeToken: kind === 'sell' ? buyToken : sellToken,
  receiver: SAFE_ADDRESS,
  owner: SAFE_ADDRESS,
  fullAppData: null,
})

const enableModuleInfo: TxInfo = {
  type: 'SettingsChange',
  dataDecoded: {
    method: 'enableModule',
    parameters: [{ name: 'module', type: 'address', value: '0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134' }],
  },
  settingsInfo: {
    type: 'ENABLE_MODULE',
    module: { value: '0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134', name: 'Spending limit', logoUri: null },
  },
}

const multiSendInfo: TxInfo = {
  type: 'Custom',
  to: { value: '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D', name: 'Safe: MultiSendCallOnly 1.3.0', logoUri: null },
  dataSize: '580',
  value: '0',
  isCancellation: false,
  methodName: 'multiSend',
  actionCount: 4,
}

const customInfo: TxInfo = {
  type: 'Custom',
  to: { value: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', name: null, logoUri: null },
  dataSize: '68',
  value: '0',
  isCancellation: false,
  methodName: 'approve',
}

/** The reference row: everything else should line up with this one. */
export const queueNativeTransfer = queueRow({
  id: 'a1',
  nonce: NEXT_NONCE,
  txInfo: nativeTransferInfo,
  timestamp: NOW - 5 * MINUTE,
})

export const queueErc20Transfer = queueRow({
  id: 'a2',
  nonce: NEXT_NONCE + 1,
  txInfo: erc20TransferInfo,
  timestamp: NOW - 32 * MINUTE,
})

export const queueSwapSellOrder = queueRow({
  id: 'a3',
  nonce: NEXT_NONCE + 2,
  txInfo: swapOrder({
    kind: 'sell',
    sellToken: WETH,
    buyToken: USDC,
    sellAmount: '1500000000000000000',
    buyAmount: '4380000000',
  }),
  timestamp: NOW - 2 * HOUR,
})

export const queueSwapBuyOrder = queueRow({
  id: 'a4',
  nonce: NEXT_NONCE + 3,
  txInfo: swapOrder({
    kind: 'buy',
    sellToken: USDC,
    buyToken: WETH,
    sellAmount: '4380000000',
    buyAmount: '1500000000000000000',
  }),
  timestamp: NOW - 3 * HOUR,
})

export const queueSettingsChange = queueRow({
  id: 'a5',
  nonce: NEXT_NONCE + 4,
  txInfo: enableModuleInfo,
  timestamp: NOW - 5 * HOUR,
})

export const queueMultiSend = queueRow({
  id: 'a6',
  nonce: NEXT_NONCE + 5,
  txInfo: multiSendInfo,
  timestamp: NOW - 20 * HOUR,
})

export const queueCustom = queueRow({
  id: 'a7',
  nonce: NEXT_NONCE + 6,
  txInfo: customInfo,
  timestamp: NOW - 1 * DAY,
})

/** Long symbols on both sides plus an 8-figure amount — the truncation case. */
export const queueLongSwapOrder = queueRow({
  id: 'a8',
  nonce: NEXT_NONCE + 7,
  txInfo: swapOrder({
    kind: 'sell',
    sellToken: LONG_NAME_LP,
    buyToken: LONG_NAME_VAULT,
    sellAmount: '12345678901234567890123456',
    buyAmount: '98765432109876543210987654',
  }),
  timestamp: NOW - 2 * DAY,
})

export const historyNativeTransfer = historyRow({
  id: 'b1',
  nonce: NEXT_NONCE - 1,
  txInfo: nativeTransferInfo,
  timestamp: EXECUTED_AT,
})

export const historyErc20Transfer = historyRow({
  id: 'b2',
  nonce: NEXT_NONCE - 2,
  txInfo: erc20TransferInfo,
  timestamp: EXECUTED_AT - 1 * HOUR,
})

export const historySwapSellOrder = historyRow({
  id: 'b3',
  nonce: NEXT_NONCE - 3,
  txInfo: swapOrder({
    kind: 'sell',
    sellToken: WETH,
    buyToken: USDC,
    sellAmount: '1500000000000000000',
    buyAmount: '4380000000',
    status: 'fulfilled',
    validUntil: Math.floor((EXECUTED_AT - 2 * HOUR) / 1000),
  }),
  timestamp: EXECUTED_AT - 2 * HOUR,
})

export const historyMultiSend = historyRow({
  id: 'b4',
  nonce: NEXT_NONCE - 4,
  txInfo: multiSendInfo,
  timestamp: EXECUTED_AT - 4 * HOUR,
})

export const historySettingsChange = historyRow({
  id: 'b5',
  nonce: NEXT_NONCE - 5,
  txInfo: enableModuleInfo,
  timestamp: EXECUTED_AT - 5 * HOUR,
})

/** Every queue type in list order — the row-to-row alignment check. */
export const queueAllTypes = [
  queueNativeTransfer,
  queueErc20Transfer,
  queueSwapSellOrder,
  queueSwapBuyOrder,
  queueSettingsChange,
  queueMultiSend,
  queueCustom,
  queueLongSwapOrder,
]

export const historyAllTypes = [
  historyNativeTransfer,
  historyErc20Transfer,
  historySwapSellOrder,
  historyMultiSend,
  historySettingsChange,
]
