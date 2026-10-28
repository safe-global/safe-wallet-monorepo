import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import { fakerChecksummedAddress, render, screen } from '@/tests/test-utils'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { txInfoBuilder } from '@/tests/builders/safeTx'
import { chainBuilder } from '@/tests/builders/chains'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as useChains from '@/hooks/useChains'
import { ManageSigners } from '.'

jest.mock('@/features/multichain/hooks/useIsMultichainSafe')

const mockUseIsMultichainSafe = jest.requireMock('@/features/multichain/hooks/useIsMultichainSafe')
  .useIsMultichainSafe as jest.Mock
const safeInterface = Safe__factory.createInterface()

const ownerA = fakerChecksummedAddress()
const ownerB = fakerChecksummedAddress()
const newOwner = fakerChecksummedAddress()
const safe = extendedSafeInfoBuilder()
  .with({ owners: [{ value: ownerA }, { value: ownerB }], threshold: 1 })
  .build()

const networkWarning =
  'Signers are not consistent across networks on this account. Changing signers will only affect the account on Sepolia'

const renderManageSigners = (hexData: string) =>
  render(<ManageSigners txInfo={txInfoBuilder().build()} txData={{ hexData } as TransactionDetails['txData']} />)

describe('ManageSigners', () => {
  beforeEach(() => {
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safeAddress: safe.address.value,
      safe,
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    })
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(chainBuilder().with({ chainName: 'Sepolia' }).build())
  })

  it.each([
    ['a signer is added to', safeInterface.encodeFunctionData('addOwnerWithThreshold', [newOwner, 1])],
    ['a signer is removed from', safeInterface.encodeFunctionData('removeOwner', [ownerA, ownerB, 1])],
    ['a signer is replaced in', safeInterface.encodeFunctionData('swapOwner', [ownerA, ownerB, newOwner])],
    ['the threshold is changed in', safeInterface.encodeFunctionData('changeThreshold', [2])],
  ])('warns that only the Sepolia Safe changes when %s a multichain Safe', async (_, hexData) => {
    mockUseIsMultichainSafe.mockReturnValue(true)

    renderManageSigners(hexData)

    expect(await screen.findByText(networkWarning)).toBeInTheDocument()
  })

  it('shows no network warning for a single-network Safe', async () => {
    mockUseIsMultichainSafe.mockReturnValue(false)

    renderManageSigners(safeInterface.encodeFunctionData('addOwnerWithThreshold', [newOwner, 1]))

    expect((await screen.findAllByText(newOwner)).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Signers are not consistent/)).not.toBeInTheDocument()
  })
})
