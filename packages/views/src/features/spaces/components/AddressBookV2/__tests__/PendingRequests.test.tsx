import { faker } from '@faker-js/faker'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PendingRequests from '../PendingRequests'
import { CHAINS } from '../mocks/fixtures'
import type { PendingRequest } from '../types'

const mockIsMobile = jest.fn(() => false)
jest.mock('@safe-global/views/hooks/use-mobile', () => ({ useIsMobile: () => mockIsMobile() }))

const buildRequest = (fields: Partial<PendingRequest> = {}): PendingRequest => ({
  id: faker.number.int(),
  address: faker.finance.ethereumAddress(),
  name: faker.person.fullName(),
  chains: [CHAINS.ethereum],
  requestedBy: faker.person.fullName(),
  isInWorkspace: false,
  ...fields,
})

const columnHeaders = () => screen.getAllByRole('columnheader').map((header) => header.textContent)

describe('PendingRequests', () => {
  beforeEach(() => mockIsMobile.mockReturnValue(false))

  it('shows Contact, Chains and Requested by', () => {
    render(<PendingRequests requests={[buildRequest()]} canReview />)

    expect(columnHeaders()).toEqual(['Contact', 'Chains', 'Requested by', ''])
  })

  it('shows who asked for the contact', () => {
    const request = buildRequest({ requestedBy: 'Lena Fischer' })

    render(<PendingRequests requests={[request]} canReview />)

    expect(within(screen.getByTestId('table-row')).getByText('Lena Fischer')).toBeInTheDocument()
  })

  it('tells an admin where member requests appear when there are none', () => {
    render(<PendingRequests requests={[]} canReview />)

    expect(screen.getByTestId('pending-requests-empty')).toHaveTextContent(
      'When members ask to add a contact to the Workspace, their requests show up here.',
    )
  })

  it('tells a member their requests wait for an admin when there are none', () => {
    render(<PendingRequests requests={[]} canReview={false} />)

    expect(screen.getByTestId('pending-requests-empty')).toHaveTextContent(
      'Contacts you ask to add to the Workspace wait here until an admin reviews them.',
    )
  })

  it('marks a request whose address the Workspace already has', () => {
    const [existing, fresh] = [buildRequest({ isInWorkspace: true }), buildRequest()]

    render(<PendingRequests requests={[existing, fresh]} canReview />)

    const [existingRow, freshRow] = screen.getAllByTestId('table-row')
    expect(within(existingRow).getByText('Already in Workspace')).toBeInTheDocument()
    expect(within(freshRow).queryByText('Already in Workspace')).not.toBeInTheDocument()
  })

  it('accepts the request of the row an admin clicks', async () => {
    const [first, second] = [buildRequest(), buildRequest()]
    const onApprove = jest.fn()
    render(<PendingRequests requests={[first, second]} canReview onApprove={onApprove} />)

    const [, secondRow] = screen.getAllByTestId('table-row')
    await userEvent.click(within(secondRow).getByRole('button', { name: 'Accept' }))

    expect(onApprove).toHaveBeenCalledWith(second.id)
  })

  it('declines the request of the row an admin clicks', async () => {
    const request = buildRequest()
    const onReject = jest.fn()
    render(<PendingRequests requests={[request]} canReview onReject={onReject} />)

    await userEvent.click(screen.getByRole('button', { name: 'Decline' }))

    expect(onReject).toHaveBeenCalledWith(request.id)
  })

  it('replaces the buttons of the request under review with a spinner', () => {
    const [reviewing, waiting] = [buildRequest(), buildRequest()]

    render(<PendingRequests requests={[reviewing, waiting]} canReview reviewingId={reviewing.id} />)

    const [reviewingRow, waitingRow] = screen.getAllByTestId('table-row')
    expect(within(reviewingRow).getByRole('status', { name: 'Loading' })).toBeInTheDocument()
    expect(within(reviewingRow).queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument()
    expect(within(reviewingRow).queryByRole('button', { name: 'Decline' })).not.toBeInTheDocument()
    expect(within(waitingRow).getByRole('button', { name: 'Accept' })).toBeInTheDocument()
  })

  it('shows a member their request as pending, without Accept or Decline', () => {
    render(<PendingRequests requests={[buildRequest()]} canReview={false} />)

    const row = screen.getByTestId('table-row')
    expect(within(row).getByText('Pending')).toBeInTheDocument()
    expect(within(row).queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument()
    expect(within(row).queryByRole('button', { name: 'Decline' })).not.toBeInTheDocument()
  })

  it('folds Chains and Requested by into the compact row detail', async () => {
    mockIsMobile.mockReturnValue(true)
    const request = buildRequest({ requestedBy: 'Jonas Weber' })
    render(<PendingRequests requests={[request]} canReview />)

    await userEvent.click(screen.getByRole('button', { name: 'Show details' }))

    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual(['Chains', 'Requested by'])
    const [chains, requestedBy] = screen.getAllByRole('definition')
    expect(within(chains).getByTestId('chain-logos')).toBeInTheDocument()
    expect(requestedBy).toHaveTextContent('Jonas Weber')
  })
})
