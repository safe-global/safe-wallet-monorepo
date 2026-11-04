import { act, fakerChecksummedAddress, fireEvent, render, screen, waitFor, within } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import { CF_TX_GROUP_KEY } from '../../constants'
import { SafeCreationEvent, safeCreationDispatch } from '../../services/safeCreationEvents'
import CounterfactualSuccessScreen from './index'

jest.mock('@/components/common/ChainIndicator', () => {
  const ChainIndicator = ({ chainId }: { chainId: string }) => <span data-testid={`chain-${chainId}`} />
  return ChainIndicator
})

const sepolia = chainBuilder().with({ chainId: '11155111', chainName: 'Sepolia' }).build()
const polygon = chainBuilder().with({ chainId: '137', chainName: 'Polygon' }).build()

const renderAfterMultichainPayLaterCreation = (safeAddress: string) => {
  render(<CounterfactualSuccessScreen />)
  act(() => {
    safeCreationDispatch(SafeCreationEvent.AWAITING_EXECUTION, {
      groupKey: CF_TX_GROUP_KEY,
      safeAddress,
      networks: [sepolia, polygon],
    })
  })
}

describe('CounterfactualSuccessScreen', () => {
  it("shows the new Safe's address on every selected network after a multichain pay-later creation", async () => {
    const safeAddress = fakerChecksummedAddress()

    renderAfterMultichainPayLaterCreation(safeAddress)

    expect(screen.getByTestId('account-success-message')).toHaveTextContent('Your account is almost set!')
    expect(screen.getByText(/Activate the account per network/)).toBeInTheDocument()
    expect(screen.getByText(/receive funds on the selected networks/)).toBeInTheDocument()
    const safeInfo = screen.getByTestId('safe-info')
    expect(safeInfo).toHaveTextContent(safeAddress)
    expect(await within(safeInfo).findByTestId(`chain-${sepolia.chainId}`)).toBeInTheDocument()
    expect(within(safeInfo).getByTestId(`chain-${polygon.chainId}`)).toBeInTheDocument()
  })

  it("closes when the user clicks Let's go", async () => {
    renderAfterMultichainPayLaterCreation(fakerChecksummedAddress())

    fireEvent.click(screen.getByTestId('cf-creation-lets-go-btn'))

    await waitFor(() => expect(screen.queryByTestId('account-success-message')).not.toBeInTheDocument())
  })
})
