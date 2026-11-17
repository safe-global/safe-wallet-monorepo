import { faker } from '@faker-js/faker'
import { fakerChecksummedAddress, render, screen } from '@/tests/test-utils'
import { useCosignerState } from '../../hooks/useCosignerState'
import CosignerShieldRow from './index'

jest.mock('../../hooks/useCosignerState', () => ({ useCosignerState: jest.fn() }))

const mockUseCosignerState = useCosignerState as jest.MockedFunction<typeof useCosignerState>

describe('CosignerShieldRow', () => {
  const cosigner = fakerChecksummedAddress()

  it('renders nothing for a Safe whose guard cannot require a co-signature', () => {
    mockUseCosignerState.mockReturnValue({})

    const { container } = render(<CosignerShieldRow />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows that the signature is available once the co-signer signed', () => {
    mockUseCosignerState.mockReturnValue({
      state: { status: 'ready', context: '0x', onchain: false, signer: cosigner, cosignerName: 'SAFE', cosigner },
    })

    render(<CosignerShieldRow />)

    expect(screen.getByTestId('cosigner-check-status')).toHaveTextContent('Signature available')
  })

  it('shows the rejection and its reason', () => {
    const reason = faker.lorem.sentence()
    mockUseCosignerState.mockReturnValue({
      state: { status: 'rejected', reason, ruleId: null, cosignerName: 'SAFE', cosigner },
    })

    render(<CosignerShieldRow />)

    expect(screen.getByTestId('cosigner-check-status')).toHaveTextContent('Rejected')
    expect(screen.getByTestId('cosigner-check-description')).toHaveTextContent(reason)
  })

  it('shows that the co-signer is still reviewing the transaction', () => {
    mockUseCosignerState.mockReturnValue({ state: { status: 'pending', cosigner } })

    render(<CosignerShieldRow />)

    expect(screen.getByTestId('cosigner-check-status')).toHaveTextContent('Waiting for the co-signer')
  })
})
