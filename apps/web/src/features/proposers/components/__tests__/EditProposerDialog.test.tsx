import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import type { Delegate } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import { render, screen, waitFor, fireEvent, fakerChecksummedAddress } from '@/tests/test-utils'
import { mockChainId } from '@/tests/mocks/hooks'
import { server } from '@/tests/server'
import { getStoreInstance } from '@/store'
import EditProposerDialog from '../EditProposerDialog'

jest.mock('@/hooks/useChainId')

const CHAIN_ID = '1'

const proposerBuilder = (overrides: Partial<Delegate> = {}): Delegate => ({
  delegate: fakerChecksummedAddress(),
  delegator: fakerChecksummedAddress(),
  label: 'Proposer',
  ...overrides,
})

const recordDelegateRequests = () => {
  const requests: string[] = []
  server.use(
    http.all(/\/v\d\/chains\/\d+\/delegates/, ({ request }) => {
      requests.push(`${request.method} ${request.url}`)
      return HttpResponse.json({})
    }),
  )
  return requests
}

const getNameInput = () => screen.getByLabelText(/^Name/)

describe('EditProposerDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockChainId(CHAIN_ID)
  })

  it('opens the address book entry prefilled with the local name of the proposer', async () => {
    const proposer = proposerBuilder()
    const name = faker.person.firstName()

    render(<EditProposerDialog proposer={proposer} />, {
      initialReduxState: { addressBook: { [CHAIN_ID]: { [proposer.delegate]: name } } },
    })
    fireEvent.click(screen.getByTestId('edit-proposer-btn'))

    expect(await screen.findByTestId('entry-dialog')).toBeInTheDocument()
    expect(getNameInput()).toHaveValue(name)
  })

  it('saves the new name to the local address book without calling the delegate API', async () => {
    const requests = recordDelegateRequests()
    const proposer = proposerBuilder()

    render(<EditProposerDialog proposer={proposer} />, {
      initialReduxState: { addressBook: { [CHAIN_ID]: { [proposer.delegate]: 'Old name' } } },
    })
    fireEvent.click(screen.getByTestId('edit-proposer-btn'))
    fireEvent.change(getNameInput(), { target: { value: 'Treasury bot' } })
    await waitFor(() => expect(screen.getByTestId('save-btn')).toBeEnabled())
    fireEvent.click(screen.getByTestId('save-btn'))

    await waitFor(() => expect(screen.queryByTestId('entry-dialog')).not.toBeInTheDocument())
    expect(getStoreInstance().getState().addressBook[CHAIN_ID][proposer.delegate]).toBe('Treasury bot')
    expect(requests).toEqual([])
  })
})
