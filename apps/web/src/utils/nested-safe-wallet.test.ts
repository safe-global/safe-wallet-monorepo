import type { NextRouter } from 'next/router'
import type Safe from '@safe-global/protocol-kit'
import type { SafeTransaction } from '@safe-global/types-kit'
import { getNestedWallet } from './nested-safe-wallet'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { safeInfoBuilder } from '@/tests/builders/safe'
import { connectedWalletBuilder } from '@/tests/builders/wallet'
import { chainBuilder } from '@/tests/builders/chains'
import { MockEip1193Provider } from '@/tests/mocks/providers'
import * as coreSDK from '@/hooks/coreSDK/safeCoreSDK'
import * as walletUtils from '@/utils/wallets'
import * as sdk from '@/services/tx/tx-sender/sdk'
import * as proposeTxModule from '@/services/tx/proposeTransaction'

// Capture the WalletSDK that getNestedWallet builds and expose its `send` directly, so we can test
// the nested send() logic without driving the full SafeWalletProvider request pipeline.
let capturedSdk: { send: (params: unknown, appInfo: unknown) => Promise<unknown> } | undefined
jest.mock('@/services/safe-wallet-provider', () => ({
  SafeWalletProvider: jest.fn().mockImplementation((_safe, walletSdk) => {
    capturedSdk = walletSdk
    return { request: jest.fn(async () => ({ result: undefined })) }
  }),
}))

// Split signing is gated on GTF only.
const gtfChain = chainBuilder()
  .with({ features: [FEATURES.GTF] })
  .build()
// RELAYING without GTF does NOT trigger the split — it falls back to the legacy EOA-execution flow.
const relayingOnlyChain = chainBuilder()
  .with({ features: [FEATURES.RELAYING] })
  .build()
const noFeatureChain = chainBuilder().with({ features: [] }).build()

describe('getNestedWallet', () => {
  const router = {} as unknown as NextRouter
  const web3ReadOnly = { send: jest.fn() } as never

  it('returns a nested wallet that carries the parent Safe state and flags itself as a Safe', () => {
    const parentSafe = safeInfoBuilder().build()
    const actualWallet = { ...connectedWalletBuilder().build(), provider: MockEip1193Provider }

    const nestedWallet = getNestedWallet(actualWallet, parentSafe, web3ReadOnly, router, gtfChain)

    expect(nestedWallet.isSafe).toBe(true)
    expect(nestedWallet.address).toBe(parentSafe.address.value)
    expect(nestedWallet.chainId).toBe(parentSafe.chainId)
    // The parent's full state is reused without a second query.
    expect(nestedWallet.safeInfo).toBe(parentSafe)
  })

  describe('send (nested provider)', () => {
    const signedTx = { signatures: new Map() } as unknown as SafeTransaction
    const unsignedTx = { signatures: new Map(), data: { to: '0x', value: '0' } } as unknown as SafeTransaction

    const executeTransaction = jest.fn()
    const connectedSdk = {
      createTransaction: jest.fn(() => Promise.resolve(unsignedTx)),
      getTransactionHash: jest.fn(() => Promise.resolve('0xchildhash')),
      executeTransaction,
      approveTransactionHash: jest.fn(() => Promise.resolve({ hash: '0xexec' })),
    } as unknown as Safe

    const sendRequest = async (parentSafe: SafeState, chain = gtfChain) => {
      const actualWallet = { ...connectedWalletBuilder().build(), provider: MockEip1193Provider }
      // Building the nested wallet constructs the SafeWalletProvider, capturing its WalletSDK.
      getNestedWallet(actualWallet, parentSafe, web3ReadOnly, router, chain)

      if (!capturedSdk) throw new Error('WalletSDK was not captured')

      return capturedSdk.send(
        { txs: [{ to: '0x0000000000000000000000000000000000000001', value: '0', data: '0x' }], params: {} },
        {},
      )
    }

    beforeEach(() => {
      jest.clearAllMocks()
      jest
        .spyOn(coreSDK, 'initSafeSDK')
        .mockResolvedValue({ connect: jest.fn(() => Promise.resolve(connectedSdk)) } as unknown as Safe)
      jest.spyOn(sdk, 'tryOffChainTxSigning').mockResolvedValue(signedTx)
      jest.spyOn(proposeTxModule, 'default').mockResolvedValue({} as never)
    })

    it('on a GTF chain, signs off-chain and proposes for an EOA owner, never executing from the EOA (threshold 1)', async () => {
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(false)
      const parentSafe = safeInfoBuilder()
        .with({ threshold: 1, implementation: { value: '0x0000000000000000000000000000000000000041' } })
        .build()

      await sendRequest(parentSafe, gtfChain)

      // GTF provides the sponsored relay path, so signing and execution are split.
      expect(sdk.tryOffChainTxSigning).toHaveBeenCalledWith(unsignedTx, connectedSdk)
      expect(proposeTxModule.default).toHaveBeenCalled()
      expect(executeTransaction).not.toHaveBeenCalled()
    })

    it.each([
      ['a RELAYING-only chain (split is GTF-only)', relayingOnlyChain],
      ['a chain without GTF or relaying', noFeatureChain],
    ])('on %s, keeps the original flow: proposes and executes from the EOA (threshold 1)', async (_label, chain) => {
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(false)
      const parentSafe = safeInfoBuilder()
        .with({ threshold: 1, implementation: { value: '0x0000000000000000000000000000000000000041' } })
        .build()

      await sendRequest(parentSafe, chain)

      // No GTF → unchanged behavior: execute directly from the EOA, no off-chain signing
      expect(proposeTxModule.default).toHaveBeenCalled()
      expect(executeTransaction).toHaveBeenCalledWith(unsignedTx)
      expect(sdk.tryOffChainTxSigning).not.toHaveBeenCalled()
    })

    it('signs off-chain and proposes for an EOA owner (threshold > 1) — unchanged', async () => {
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(false)
      const parentSafe = safeInfoBuilder()
        .with({ threshold: 3, implementation: { value: '0x0000000000000000000000000000000000000041' } })
        .build()

      await sendRequest(parentSafe)

      expect(sdk.tryOffChainTxSigning).toHaveBeenCalledWith(unsignedTx, connectedSdk)
      expect(proposeTxModule.default).toHaveBeenCalled()
      expect(executeTransaction).not.toHaveBeenCalled()
    })

    it('still approves on-chain when the connected wallet is itself a smart contract (Safe-Apps context)', async () => {
      jest.spyOn(walletUtils, 'isSmartContractWallet').mockResolvedValue(true)
      const parentSafe = safeInfoBuilder()
        .with({ threshold: 1, implementation: { value: '0x0000000000000000000000000000000000000041' } })
        .build()

      await sendRequest(parentSafe)

      expect(connectedSdk.approveTransactionHash).toHaveBeenCalledWith('0xchildhash')
      expect(executeTransaction).not.toHaveBeenCalled()
      expect(sdk.tryOffChainTxSigning).not.toHaveBeenCalled()
    })
  })
})
