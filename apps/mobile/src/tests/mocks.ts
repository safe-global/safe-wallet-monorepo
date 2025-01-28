import {
  PendingTransactionItems,
  DetailedExecutionInfoType,
  TransactionTokenType,
  TransactionStatus,
  TransactionInfoType,
  TransferDirection,
  ConflictType,
  TransactionListItemType,
  HistoryTransactionItems,
} from '@safe-global/store/gateway/types'
import {
  TransferTransactionInfo,
  SwapTransferTransactionInfo,
  DateLabel,
  TransactionQueuedItem,
  LabelQueuedItem,
  ConflictHeaderQueuedItem,
  AddressInfo,
  Transaction,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

export const mockBalanceData = {
  items: [
    {
      tokenInfo: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        logoUri: 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png',
      },
      balance: '1000000000000000000',
      fiatBalance: '2000',
    },
  ],
}

export const mockNFTData = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: '1',
      address: '0x123',
      tokenName: 'Cool NFT',
      tokenSymbol: 'CNFT',
      logoUri: 'https://example.com/nft1.png',
      name: 'NFT #1',
      description: 'A cool NFT',
      tokenId: '1',
      uri: 'https://example.com/nft1.json',
      imageUri: 'https://example.com/nft1.png',
    },
    {
      id: '2',
      address: '0x456',
      tokenName: 'Another NFT',
      tokenSymbol: 'ANFT',
      logoUri: 'https://example.com/nft2.png',
      name: 'NFT #2',
      description: 'Another cool NFT',
      tokenId: '2',
      uri: 'https://example.com/nft2.json',
      imageUri: 'https://example.com/nft2.png',
    },
  ],
}
export const fakeToken = {
  address: '0x1111111111',
  decimals: 18,
  name: 'Ether',
  logoUri: 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png',
  symbol: 'ETH',
  trusted: false,
}
export const fakeToken2 = {
  address: '0x1111111111',
  decimals: 18,
  name: 'SafeToken',
  logoUri: 'https://safe-transaction-assets.safe.global/tokens/logos/0x5aFE3855358E112B5647B952709E6165e1c1eEEe.png',
  symbol: 'SAFE',
  trusted: false,
}
export const mockERC20Transfer: TransferTransactionInfo = {
  type: TransactionInfoType.TRANSFER,
  sender: {
    value: '0x000000',
    name: 'something',
  },
  recipient: {
    value: '0x0ab',
    name: 'something',
  },
  transferInfo: {
    type: TransactionTokenType.ERC20,
    tokenAddress: '0x000000',
    value: '50000000000000000',
    tokenName: 'Nevinha',
    logoUri: 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png',
    tokenSymbol: 'NEV',
    trusted: false,
    decimals: 18,
    imitation: true,
  },
  direction: TransferDirection.INCOMING,
  humanDescription: 'a simple incoming transaction',
}
export const mockNFTTransfer: TransferTransactionInfo = {
  type: TransactionInfoType.TRANSFER,
  sender: {
    value: '0x000000',
    name: 'something',
  },
  recipient: {
    value: '0x0ab',
    name: 'something',
  },
  transferInfo: {
    tokenId: '1',
    type: TransactionTokenType.ERC721,
    tokenAddress: '0x000000',
    tokenName: 'My NFT',
    tokenSymbol: 'NEV',
  },
  direction: TransferDirection.OUTGOING,
  humanDescription: 'a simple incoming transaction',
}
export const mockSwapTransfer: SwapTransferTransactionInfo = {
  type: TransactionInfoType.SWAP_TRANSFER,
  sender: {
    value: '0x000000',
    name: 'something',
  },
  direction: TransferDirection.INCOMING,
  recipient: {
    value: '0x0ab',
    name: 'something',
  },
  transferInfo: {
    type: TransactionTokenType.ERC20,
    tokenAddress: '0x000000',
    value: '50000000000000000',
    trusted: false,
    imitation: true,
  },
  uid: '231',
  humanDescription: 'here a human description',
  status: 'fulfilled',
  kind: 'buy',
  orderClass: 'limit',
  validUntil: 11902381293,
  sellAmount: '50000000000000000',
  buyAmount: '50000000000000000',
  executedSellAmount: '50000000000000000',
  executedBuyAmount: '50000000000000000',
  executedFee: '1000000000000000',
  executedFeeToken: fakeToken,
  sellToken: fakeToken2,
  buyToken: fakeToken,
  explorerUrl: 'http://google.com',
  executedSurplusFee: '',
  receiver: '0xbob',
  owner: '0xalice',
}

interface mockTransferWithInfoArgs {
  type?: TransactionInfoType
  direction?: TransferDirection
  methodName?: string
  actionCount?: number
  isCancellation?: boolean
  to?: AddressInfo
  creator?: AddressInfo
}

export const mockTransferWithInfo = ({
  type = TransactionInfoType.TRANSFER,
  direction = TransferDirection.INCOMING,
  methodName,
  actionCount,
  isCancellation,
  to,
  creator,
}: mockTransferWithInfoArgs): Transaction['txInfo'] =>
  ({
    type,
    sender: {
      value: '0x000000',
      name: 'something',
    },
    to,
    creator,
    methodName,
    actionCount,
    recipient: {
      value: '0x0ab',
      name: 'something',
    },
    transferInfo: {
      type: TransactionTokenType.ERC20,
      tokenAddress: '0x000000',
      value: '100000',
      trusted: false,
      imitation: true,
    },
    dataDecoded: {
      method: 'mockMethod',
    },
    isCancellation,
    direction,
    humanDescription: 'a simple incoming transaction',
  }) as Transaction['txInfo']

export const mockTransactionSummary: Transaction = {
  id: 'id',
  timestamp: 123123,
  txStatus: TransactionStatus.SUCCESS,
  txInfo: mockTransferWithInfo({ type: TransactionInfoType.TRANSFER }),
  txHash: '0x0000000',
  executionInfo: {
    type: DetailedExecutionInfoType.MODULE,
    address: {
      value: '0x000000',
      name: 'something',
    },
  },
}

export const mockHistoryPageItem = (type: 'TRANSACTION'): HistoryTransactionItems => {
  return {
    type,
    transaction: mockTransactionSummary,
    conflictType: ConflictType.NONE,
  }
}

export const mockListItemByType = (type: TransactionListItemType): PendingTransactionItems | DateLabel => {
  if (type === TransactionListItemType.DATE_LABEL) {
    return {
      type: TransactionListItemType.DATE_LABEL,
      timestamp: 123123,
    } as DateLabel
  }

  if (type === TransactionListItemType.LABEL) {
    return {
      type: TransactionListItemType.LABEL,
      label: 'label',
    } as LabelQueuedItem
  }

  if (type === TransactionListItemType.CONFLICT_HEADER) {
    return {
      type: TransactionListItemType.CONFLICT_HEADER,
      nonce: 123,
    } as ConflictHeaderQueuedItem
  }

  return {
    type: TransactionListItemType.TRANSACTION,
    transaction: mockTransactionSummary,
    conflictType: ConflictType.NONE,
  } as TransactionQueuedItem
}
