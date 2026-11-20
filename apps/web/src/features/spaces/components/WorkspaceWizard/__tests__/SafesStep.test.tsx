import { faker } from '@faker-js/faker'
import type { AddedSafesState } from '@/store/addedSafesSlice'
import type { AddressBookState } from '@/store/addressBookSlice'
import type { DraftSafe, WorkspaceDraft } from '../../../public/store/workspaceDraftSlice'
import { server } from '@/tests/server'
import { signedInAuthState } from '@/tests/builders/authState'
import { trialPaymentLinkBuilder } from '@/tests/builders/trialPaymentLink'
import { fakeUserId, fakeWorkspaceName, workspaceDraftBuilder } from '@/tests/builders/workspaceDraft'
import { trialPlansHandler, userHandler, workspacesHandler } from '@/tests/msw/workspaceWizard'
import { fakerChecksummedAddress, renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import SafesStep from '../steps/SafesStep'
import WizardReady from '../WizardReady'

let mockIsSafePro = false
jest.mock('@/hooks/useIsSafeProEnabled', () => ({
  useIsSafeProEnabled: () => mockIsSafePro,
  useSafeProFlag: () => mockIsSafePro,
}))
jest.mock('@/hooks/useIsSurveyEnabled', () => ({ __esModule: true, default: () => true }))

const CHAIN_ID = '1'

// jsdom has no IntersectionObserver; the Safe rows only use it to defer their overview fetch.
class NoopIntersectionObserver {
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()
}
Object.defineProperty(window, 'IntersectionObserver', { configurable: true, value: NoopIntersectionObserver })

const draftSafes = (count: number): DraftSafe[] =>
  Array.from({ length: count }, () => ({ chainId: CHAIN_ID, address: fakerChecksummedAddress() }))

const namedInAddressBook = (safes: DraftSafe[]): AddressBookState => {
  const names = faker.helpers.uniqueArray(faker.person.firstName, safes.length)
  return { [CHAIN_ID]: Object.fromEntries(safes.map(({ address }, index) => [address, names[index]])) }
}

const addedToTheApp = (safes: DraftSafe[]): AddedSafesState => ({
  [CHAIN_ID]: Object.fromEntries(safes.map(({ address }) => [address, { owners: [], threshold: 1 }])),
})

type RenderOptions = {
  draft?: Partial<WorkspaceDraft>
  addedSafes?: AddedSafesState
  addressBook?: AddressBookState
}

const renderSafesStep = ({ draft = {}, addedSafes = {}, addressBook = {} }: RenderOptions = {}) => {
  const ownerId = fakeUserId()
  server.use(userHandler(ownerId), workspacesHandler())
  const workspaceDraft = workspaceDraftBuilder()
    .with({ ownerId, name: fakeWorkspaceName(), ...draft })
    .build()
  return renderWithUserEvent(
    <WizardReady>
      <SafesStep />
    </WizardReady>,
    {
      routerProps: { push: jest.fn(() => Promise.resolve(true)) },
      initialReduxState: { auth: signedInAuthState(), workspaceDraft, addedSafes, addressBook },
    },
  )
}

const nextButton = () => screen.getByRole('button', { name: 'Next' })
const skipLink = () => screen.queryByRole('button', { name: 'Skip, add Safe accounts later' })

describe('SafesStep', () => {
  beforeEach(() => {
    localStorage.clear()
    mockIsSafePro = false
  })

  it('asks to remove the Safes above the picked plan’s seats and does not go on', async () => {
    mockIsSafePro = true
    const plan = trialPaymentLinkBuilder({ seats: 1 }).build()
    server.use(trialPlansHandler([plan]))

    renderSafesStep({ draft: { paymentLinkId: plan.id, safes: draftSafes(3) } })

    expect(await screen.findByText('Remove 2 Safe accounts or pick a larger plan')).toBeInTheDocument()
    expect(nextButton()).toBeDisabled()
  })

  it('lets the user pick more Safes without a seat limit when Safe Pro is off', async () => {
    const picked = draftSafes(3)
    const [unpicked] = draftSafes(1)
    const listed = [...picked, unpicked]
    const addressBook = namedInAddressBook(listed)
    const { user } = renderSafesStep({ draft: { safes: picked }, addedSafes: addedToTheApp(listed), addressBook })
    const unpickedName = addressBook[CHAIN_ID][unpicked.address]
    const unpickedCheckbox = await screen.findByRole('checkbox', { name: `Select ${unpickedName}` })

    await user.click(unpickedCheckbox)

    expect(unpickedCheckbox).toBeChecked()
    expect(screen.getByTestId('selected-count')).toHaveTextContent(/^4 selected$/)
    expect(screen.queryByTestId('safes-limit-error')).not.toBeInTheDocument()
    expect(nextButton()).toBeEnabled()
  })

  it('hides the skip link while the user names the picked Safes', async () => {
    const { user } = renderSafesStep({ draft: { safes: draftSafes(1) } })
    await waitFor(() => expect(nextButton()).toBeEnabled())
    expect(skipLink()).toBeInTheDocument()

    await user.click(nextButton())

    expect(await screen.findByText('Name your Safe accounts')).toBeInTheDocument()
    expect(skipLink()).not.toBeInTheDocument()
  })
})
