import { http, HttpResponse, type HttpHandler } from 'msw'
import { faker } from '@faker-js/faker'
import type { MembersDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { UserWithWallets } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import type { UserSession } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { authSlice, SESSION_LIFETIME_MS, setAuthenticated } from '@/store/authSlice'
import { renderWithScenario } from '@/tests/scenario-utils'
import { screen, waitFor } from '@/tests/test-utils'
import { memberBuilder, memberUserBuilder } from '@/tests/builders/member'
import SpaceMembers from '../index'

const MEMBERS_URL = /\/v1\/spaces\/[^/]+\/members$/

const NON_MEMBER_USER_ID = 99

const signedInUser: UserWithWallets = { id: NON_MEMBER_USER_ID, status: 1, wallets: [] }

const signedInSession: UserSession = {
  id: String(NON_MEMBER_USER_ID),
  authMethod: 'siwe',
  signerAddress: faker.finance.ethereumAddress(),
}

const membersResponse: MembersDto = {
  members: [
    memberBuilder()
      .with({ id: 1, name: 'Charlie', user: memberUserBuilder().with({ id: 11 }).build() })
      .build(),
    memberBuilder()
      .with({ id: 2, name: 'Alice', user: memberUserBuilder().with({ id: 12 }).build() })
      .build(),
    memberBuilder()
      .with({ id: 3, name: 'Bob', user: memberUserBuilder().with({ id: 13 }).build() })
      .build(),
    memberBuilder()
      .with({
        id: 4,
        status: 'INVITED',
        name: 'Dave',
        user: memberUserBuilder().with({ id: 14, status: 'PENDING' }).build(),
      })
      .build(),
  ],
}

const renderMembersPage = (membersHandler: HttpHandler) =>
  renderWithScenario(<SpaceMembers />, 'efSafe', {
    handlers: [
      membersHandler,
      http.get(/\/v1\/users$/, () => HttpResponse.json(signedInUser)),
      http.get(/\/v1\/auth\/me$/, () => HttpResponse.json(signedInSession)),
    ],
    routerProps: { query: { spaceId: faker.string.uuid() } },
    storeOverrides: {
      auth: authSlice.reducer(undefined, setAuthenticated(Date.now() + SESSION_LIFETIME_MS)),
    },
  })

describe('SpaceMembers with the CGW members endpoint', () => {
  it('renders the active members from CGW and counts the pending ones', async () => {
    renderMembersPage(http.get(MEMBERS_URL, () => HttpResponse.json(membersResponse)))

    expect(await screen.findByRole('tab', { name: 'Members (3)' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Pending (1)' })).toBeInTheDocument()

    const nameCells = screen.getAllByTestId('table-cell-name')
    expect(nameCells).toHaveLength(3)
    expect(nameCells[0]).toHaveTextContent('Charlie')
    expect(nameCells[1]).toHaveTextContent('Alice')
    expect(nameCells[2]).toHaveTextContent('Bob')
    expect(screen.queryByText('Dave')).not.toBeInTheDocument()
  })

  it('renders an empty list when CGW refuses access with a 403', async () => {
    let isMembersRequested = false
    renderMembersPage(
      http.get(MEMBERS_URL, () => {
        isMembersRequested = true
        return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
      }),
    )

    await waitFor(() => expect(isMembersRequested).toBe(true))

    expect(screen.getByRole('tab', { name: 'Members (0)' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Pending (0)' })).toBeInTheDocument()
    expect(screen.queryAllByTestId('table-cell-name')).toHaveLength(0)
  })
})
