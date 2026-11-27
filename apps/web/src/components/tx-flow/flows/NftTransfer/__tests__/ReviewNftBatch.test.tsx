import type { ReactNode } from 'react'
import { Interface } from 'ethers'
import type { MetaTransactionData, SafeTransaction } from '@safe-global/types-kit'
import { render, screen, waitFor } from '@/tests/test-utils'
import { collectibleBuilder } from '@/tests/builders/collectibles'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import type { Collectible } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import type { NftTransferParams } from '..'
import ReviewNftBatch from '../ReviewNftBatch'

const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111'
const RECIPIENT = '0x2222222222222222222222222222222222222222'

jest.mock('@/hooks/useSafeAddress', () => ({ __esModule: true, default: () => SAFE_ADDRESS }))
jest.mock('@/services/tx/tx-sender', () => ({
  createTx: jest.fn(),
  createMultiSendCallOnlyTx: jest.fn(),
}))
jest.mock('@/components/tx/ReviewTransactionV2', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

const mockCreateTx = createTx as jest.MockedFunction<typeof createTx>
const mockCreateMultiSendCallOnlyTx = createMultiSendCallOnlyTx as jest.MockedFunction<typeof createMultiSendCallOnlyTx>
const erc721 = new Interface(['function safeTransferFrom(address from, address to, uint256 tokenId)'])
const builtTx = {} as SafeTransaction

const decode = (call: MetaTransactionData) => {
  const [from, to, tokenId] = erc721.decodeFunctionData('safeTransferFrom', call.data)
  return { contract: call.to, from, to, tokenId: tokenId.toString() }
}

const renderReview = (tokens: Collectible[]) => {
  const setSafeTx = jest.fn()
  const txFlow: TxFlowContextType<NftTransferParams> = {
    ...initialContext,
    data: { recipient: RECIPIENT, tokens },
  }
  render(
    <SafeTxContext.Provider value={{ setSafeTx, setSafeTxError: jest.fn() } as unknown as SafeTxContextParams}>
      <TxFlowContext.Provider value={txFlow as TxFlowContextType}>
        <ReviewNftBatch onSubmit={jest.fn()} />
      </TxFlowContext.Provider>
    </SafeTxContext.Provider>,
  )
  return { setSafeTx }
}

describe('ReviewNftBatch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateTx.mockResolvedValue(builtTx)
    mockCreateMultiSendCallOnlyTx.mockResolvedValue(builtTx)
  })

  it('sends a single NFT as a direct safeTransferFrom without a MultiSend', async () => {
    const nft = collectibleBuilder().with({ id: '7' }).build()
    const { setSafeTx } = renderReview([nft])

    await waitFor(() => expect(setSafeTx).toHaveBeenCalledWith(builtTx))
    expect(mockCreateMultiSendCallOnlyTx).not.toHaveBeenCalled()
    expect(decode(mockCreateTx.mock.calls[0][0])).toEqual({
      contract: nft.address,
      from: SAFE_ADDRESS,
      to: RECIPIENT,
      tokenId: '7',
    })
  })

  it('batches several NFTs into one MultiSend with a transfer for each', async () => {
    const nfts = [collectibleBuilder().with({ id: '1' }).build(), collectibleBuilder().with({ id: '2' }).build()]
    const { setSafeTx } = renderReview(nfts)

    await waitFor(() => expect(setSafeTx).toHaveBeenCalledWith(builtTx))
    expect(mockCreateTx).not.toHaveBeenCalled()
    expect(mockCreateMultiSendCallOnlyTx.mock.calls[0][0].map(decode)).toEqual([
      { contract: nfts[0].address, from: SAFE_ADDRESS, to: RECIPIENT, tokenId: '1' },
      { contract: nfts[1].address, from: SAFE_ADDRESS, to: RECIPIENT, tokenId: '2' },
    ])
  })

  it('shows the recipient and each NFT', async () => {
    const nfts = [
      collectibleBuilder().with({ id: '1', tokenName: 'CatFactory', name: 'Tom' }).build(),
      collectibleBuilder().with({ id: '2', tokenName: 'CatFactory', name: 'Felix' }).build(),
    ]
    renderReview(nfts)

    expect(screen.getByText(RECIPIENT)).toBeInTheDocument()
    expect(screen.getByText('NFTs')).toBeInTheDocument()
    expect(screen.getByText('CatFactory #1')).toBeInTheDocument()
    expect(screen.getByText('Token ID: 2 - Felix')).toBeInTheDocument()
    await waitFor(() => expect(mockCreateMultiSendCallOnlyTx).toHaveBeenCalled())
  })
})
