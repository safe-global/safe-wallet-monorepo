import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { memberBuilder, memberUserBuilder } from '@/tests/builders/member'
import RenewInviteButton from './RenewInviteButton'

const mockSpaceId = '11111111-1111-1111-1111-111111111111'
const mockRenew = jest.fn()
const mockDispatch = jest.fn()
let mockIsLoading = false

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useMembersRenewInviteV1Mutation: () => [mockRenew, { isLoading: mockIsLoading }],
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => mockSpaceId,
}))

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: unknown) => ({ type: 'notifications/showNotification', payload }),
}))

jest.mock('@/components/common/Track', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

describe('RenewInviteButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsLoading = false
  })

  const invitedMember = memberBuilder()
    .with({ status: 'INVITED', name: 'Bob', user: memberUserBuilder().with({ id: 42 }).build() })
    .build()

  const emailInvitedMember = memberBuilder()
    .with({
      status: 'INVITED',
      name: 'Bob',
      user: memberUserBuilder().with({ id: 42, email: 'bob@example.com' }).build(),
    })
    .build()

  it('renews the invitation and shows a success toast', async () => {
    mockRenew.mockResolvedValue({ data: {} })

    render(<RenewInviteButton member={invitedMember} />)

    await userEvent.click(screen.getByRole('button'))

    expect(mockRenew).toHaveBeenCalledWith({ spaceId: mockSpaceId, userId: 42 })
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ message: 'Invitation renewed for Bob', variant: 'success' }),
      }),
    )
  })

  it('shows an error toast when the renew fails', async () => {
    mockRenew.mockResolvedValue({ error: { status: 409, data: { message: 'Cannot renew' } } })

    render(<RenewInviteButton member={invitedMember} />)

    await userEvent.click(screen.getByRole('button'))

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ message: 'Cannot renew', variant: 'error' }),
      }),
    )
  })

  it('disables the button while the renew request is in flight', () => {
    mockIsLoading = true

    render(<RenewInviteButton member={invitedMember} />)

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows an email-specific tooltip when the invite has an email', async () => {
    render(<RenewInviteButton member={emailInvitedMember} />)

    await userEvent.hover(screen.getByRole('button'))

    expect(await screen.findByRole('tooltip', { name: 'Renew invitation and resend the email' })).toBeInTheDocument()
  })

  it('shows the default tooltip when the invite has no email', async () => {
    render(<RenewInviteButton member={invitedMember} />)

    await userEvent.hover(screen.getByRole('button'))

    expect(await screen.findByRole('tooltip', { name: 'Renew invitation' })).toBeInTheDocument()
  })
})
