import { render, screen } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { getAddress } from 'ethers'
import Inviter from '../Inviter'

const VALID_ADDRESS = getAddress(faker.finance.ethereumAddress())
const EMAIL = faker.internet.email()

jest.mock('@/components/common/EthHashInfo', () => ({
  __esModule: true,
  default: ({ address }: { address: string }) => <div data-testid="eth-hash-info">{address}</div>,
}))

jest.mock('@/components/common/EmailInfo', () => ({
  __esModule: true,
  default: ({ email }: { email: string }) => <div data-testid="email-info">{email}</div>,
}))

describe('Inviter', () => {
  it.each([undefined, ''])('renders nothing when invitedByName is %p', (invitedByName) => {
    const { container } = render(<Inviter invitedByName={invitedByName} variant="h4" avatarSize={24} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders EthHashInfo when invitedByName is an Ethereum address', () => {
    render(<Inviter invitedByName={VALID_ADDRESS} variant="h4" avatarSize={24} />)
    expect(screen.getByTestId('eth-hash-info')).toHaveTextContent(VALID_ADDRESS)
    expect(screen.queryByTestId('email-info')).not.toBeInTheDocument()
  })

  it('renders EmailInfo when invitedByName is not an Ethereum address', () => {
    render(<Inviter invitedByName={EMAIL} variant="body1" avatarSize={20} />)
    expect(screen.getByTestId('email-info')).toHaveTextContent(EMAIL)
    expect(screen.queryByTestId('eth-hash-info')).not.toBeInTheDocument()
  })

  it('renders the leading " by" prefix when an inviter is present', () => {
    render(<Inviter invitedByName={EMAIL} variant="body1" avatarSize={20} />)
    expect(screen.getByText(/by/)).toBeInTheDocument()
  })
})
