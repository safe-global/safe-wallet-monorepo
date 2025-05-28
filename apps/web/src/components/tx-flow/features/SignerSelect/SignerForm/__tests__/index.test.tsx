import { useNestedSafeOwners } from '@/hooks/useNestedSafeOwners'
import useSafeInfo from '@/hooks/useSafeInfo'
import { render, waitFor } from '@/tests/test-utils'
import { SignerForm } from '..'
import { faker } from '@faker-js/faker'
import { extendedSafeInfoBuilder, addressExBuilder } from '@/tests/builders/safe'
import { generateRandomArray } from '@/tests/builders/utils'
import { type Eip1193Provider } from 'ethers'
import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { type ReactElement, useState } from 'react'
import { WalletContext } from '@/components/common/WalletProvider'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { type SafeSignature, type SafeTransaction } from '@safe-global/types-kit'
import { safeSignatureBuilder, safeTxBuilder } from '@/tests/builders/safeTx'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { useIsNestedSafeOwner } from '@/hooks/useIsNestedSafeOwner'
import { useIsWalletProposer } from '@/hooks/useProposers'

jest.mock('@/hooks/useNestedSafeOwners')
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useIsNestedSafeOwner')
jest.mock('@/hooks/useProposers')

const TestSafeTxProvider = ({
  initialSafeTx,
  children,
}: {
  initialSafeTx: SafeTransaction
  children: ReactElement
}) => {
  const [safeTx, setSafeTx] = useState<SafeTransaction | undefined>(initialSafeTx)
  return (
    <SafeTxContext.Provider value={{ safeTx, setSafeTx } as unknown as SafeTxContextParams}>
      {children}
    </SafeTxContext.Provider>
  )
}

const TestWalletContextProvider = ({
  connectedWallet,
  children,
}: {
  connectedWallet: ConnectedWallet | null
  children: ReactElement
}) => {
  const [signerAddress, setSignerAddress] = useState<string>()

  return (
    <WalletContext.Provider
      value={
        connectedWallet
          ? {
              connectedWallet,
              setSignerAddress,
              signer: {
                address: signerAddress || connectedWallet.address,
                chainId: '1',
                provider: null,
                isSafe: Boolean(signerAddress),
              },
            }
          : null
      }
    >
      {children}
    </WalletContext.Provider>
  )
}

describe('SignerForm', () => {
  const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
  const mockUseNestedSafeOwners = useNestedSafeOwners as jest.MockedFunction<typeof useNestedSafeOwners>
  const mockUseIsNestedSafeOwner = useIsNestedSafeOwner as jest.MockedFunction<typeof useIsNestedSafeOwner>
  const mockUseIsWalletProposer = useIsWalletProposer as jest.MockedFunction<typeof useIsWalletProposer>

  const safeAddress = faker.finance.ethereumAddress()
  // 2/3 Safe
  const mockSafeInfo = {
    safeAddress,
    safe: extendedSafeInfoBuilder()
      .with({ address: { value: safeAddress } })
      .with({ chainId: '1' })
      .with({ owners: generateRandomArray(() => addressExBuilder().build(), { min: 3, max: 3 }) })
      .with({ threshold: 2 })
      .build(),
    safeLoaded: true,
    safeLoading: false,
  }

  const mockOwners = mockSafeInfo.safe.owners

  beforeEach(() => {
    jest.resetAllMocks()

    mockUseSafeInfo.mockReturnValue(mockSafeInfo)
    mockUseIsNestedSafeOwner.mockReturnValue(true)
  })

  it('should not render anything if no wallet is connected', () => {
    const result = render(
      <TestWalletContextProvider connectedWallet={null}>
        <SignerForm />
      </TestWalletContextProvider>,
    )
    expect(result.queryByText('Sign with')).toBeNull()
  })

  it('should not render if there are no nested Safes', () => {
    mockUseNestedSafeOwners.mockReturnValue([])
    mockUseIsNestedSafeOwner.mockReturnValue(false)

    const result = render(
      <TestWalletContextProvider
        connectedWallet={{
          address: faker.finance.ethereumAddress(),
          chainId: '1',
          label: 'MetaMask',
          provider: {} as Eip1193Provider,
        }}
      >
        <SignerForm />
      </TestWalletContextProvider>,
    )

    expect(result.queryByText('Sign with')).toBeNull()
  })

  it('should render sign form if there are nested Safes', () => {
    mockUseNestedSafeOwners.mockReturnValue([mockOwners[0].value])
    const result = render(
      <TestWalletContextProvider
        connectedWallet={{
          address: faker.finance.ethereumAddress(),
          chainId: '1',
          label: 'MetaMask',
          provider: {} as Eip1193Provider,
        }}
      >
        <SignerForm />
      </TestWalletContextProvider>,
    )
    expect(result.queryByText('Sign with')).toBeVisible()
  })

  it('should render execution form if there are nested Safes', () => {
    mockUseNestedSafeOwners.mockReturnValue([mockOwners[0].value])
    const result = render(
      <TestWalletContextProvider
        connectedWallet={{
          address: faker.finance.ethereumAddress(),
          chainId: '1',
          label: 'MetaMask',
          provider: {} as Eip1193Provider,
        }}
      >
        <SignerForm willExecute />
      </TestWalletContextProvider>,
    )
    expect(result.queryByText('Execute with')).toBeVisible()
  })

  it('should not render if execution and fully signed', () => {
    const mockSignatures = new Map<string, SafeSignature>(
      mockSafeInfo.safe.owners
        .slice(0, 2)
        .map(
          (owner) =>
            [owner.value, safeSignatureBuilder().with({ signer: owner.value }).build()] as [string, SafeSignature],
        ),
    )
    mockUseNestedSafeOwners.mockReturnValue([mockOwners[0].value])
    const result = render(
      <TestSafeTxProvider
        initialSafeTx={safeTxBuilder()
          .with({
            signatures: mockSignatures,
          })
          .build()}
      >
        <TestWalletContextProvider
          connectedWallet={{
            address: faker.finance.ethereumAddress(),
            chainId: '1',
            label: 'MetaMask',
            provider: {} as Eip1193Provider,
          }}
        >
          <SignerForm willExecute />
        </TestWalletContextProvider>
      </TestSafeTxProvider>,
    )
    expect(result.queryByText('Execute with')).toBeNull()
  })

  it('should render if execution and last signer', async () => {
    const mockSignatures = new Map<string, SafeSignature>(
      mockSafeInfo.safe.owners
        .slice(0, 1)
        .map(
          (owner) =>
            [owner.value, safeSignatureBuilder().with({ signer: owner.value }).build()] as [string, SafeSignature],
        ),
    )
    mockUseNestedSafeOwners.mockReturnValue([mockOwners[1].value])
    const result = render(
      <TestSafeTxProvider
        initialSafeTx={safeTxBuilder()
          .with({
            signatures: mockSignatures,
          })
          .build()}
      >
        <TestWalletContextProvider
          connectedWallet={{
            address: faker.finance.ethereumAddress(),
            chainId: '1',
            label: 'MetaMask',
            provider: {} as Eip1193Provider,
          }}
        >
          <SignerForm willExecute />
        </TestWalletContextProvider>
      </TestSafeTxProvider>,
    )
    expect(result.queryByText('Execute with')).toBeVisible()
    await waitFor(() => expect(result.queryByText(shortenAddress(mockSafeInfo.safe.owners[1].value))).toBeVisible())
  })

  it('should correctly pre-select the signer if the connected wallet has already signed', async () => {
    const mockSignatures = new Map<string, SafeSignature>(
      mockSafeInfo.safe.owners
        .slice(0, 1)
        .map(
          (owner) =>
            [owner.value, safeSignatureBuilder().with({ signer: owner.value }).build()] as [string, SafeSignature],
        ),
    )
    mockUseNestedSafeOwners.mockReturnValue([mockOwners[1].value])
    const result = render(
      <TestSafeTxProvider
        initialSafeTx={safeTxBuilder()
          .with({
            signatures: mockSignatures,
          })
          .build()}
      >
        <TestWalletContextProvider
          connectedWallet={{
            address: mockSafeInfo.safe.owners[0].value,
            chainId: '1',
            label: 'MetaMask',
            provider: {} as Eip1193Provider,
          }}
        >
          <SignerForm />
        </TestWalletContextProvider>
      </TestSafeTxProvider>,
    )
    expect(result.queryByText('Sign with')).toBeVisible()
    await waitFor(() => {
      expect(result.queryByText(shortenAddress(mockSafeInfo.safe.owners[1].value))).toBeVisible()
    })
  })

  it('adds the connected wallet to the options when the wallet is the proposer of a new tx', async () => {
    const proposerWallet = faker.finance.ethereumAddress()
    mockUseIsWalletProposer.mockReturnValue(true)
    mockUseNestedSafeOwners.mockReturnValue([mockOwners[0].value])

    const result = render(
      <TestWalletContextProvider
        connectedWallet={{
          address: proposerWallet,
          chainId: '1',
          label: 'MetaMask',
          provider: {} as Eip1193Provider,
        }}
      >
        <SignerForm />
      </TestWalletContextProvider>,
    )

    expect(result.queryByText('Sign with')).toBeVisible()
    await waitFor(() => expect(result.queryByText(shortenAddress(proposerWallet))).toBeVisible())
  })

  it('does not add the proposer wallet when editing an existing tx', async () => {
    const proposerWallet = faker.finance.ethereumAddress()
    mockUseIsWalletProposer.mockReturnValue(true)
    mockUseNestedSafeOwners.mockReturnValue([mockOwners[0].value])

    const result = render(
      <TestSafeTxProvider initialSafeTx={safeTxBuilder().build()}>
        <TestWalletContextProvider
          connectedWallet={{
            address: proposerWallet,
            chainId: '1',
            label: 'MetaMask',
            provider: {} as Eip1193Provider,
          }}
        >
          <SignerForm txId="0x123" />
        </TestWalletContextProvider>
      </TestSafeTxProvider>,
    )

    expect(result.queryByText('Sign with')).toBeVisible()
    expect(result.queryByText(shortenAddress(proposerWallet))).toBeNull()
  })
})
