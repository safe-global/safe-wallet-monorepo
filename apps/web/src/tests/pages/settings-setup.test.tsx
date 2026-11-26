import { faker } from '@faker-js/faker'
import { AddressBookSourceProvider, useAddressBookSource } from '@/components/common/AddressBookSourceProvider'
import Setup from '@/pages/settings/setup'
import { render, screen } from '@/tests/test-utils'

const SourceProbe = ({ testId }: { testId: string }) => <span data-testid={testId}>{useAddressBookSource()}</span>

jest.mock('@/components/settings/owner/OwnerList', () => ({
  OwnerList: () => <SourceProbe testId="signers-source" />,
}))
jest.mock('@/components/settings/ProposersList', () => ({
  __esModule: true,
  default: () => <SourceProbe testId="proposers-source" />,
}))
jest.mock('@/components/settings/SettingsHeader', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/settings/ContractVersion', () => ({ ContractVersion: () => null }))
jest.mock('@/components/settings/RequiredConfirmations', () => ({ RequiredConfirmation: () => null }))
jest.mock('@/components/settings/NestedSafesList', () => ({ NestedSafesList: () => null }))
jest.mock('@/components/settings/FeeTokenPreference', () => ({ FeeTokenPreference: () => null }))
jest.mock('@/features/spending-limits/public/components/SpendingLimitsSettings', () => ({
  __esModule: true,
  default: () => null,
}))

// The app root derives the source from the URL, as in _app
const renderSetup = (query: { spaceId?: string }) =>
  render(
    <AddressBookSourceProvider>
      <Setup />
    </AddressBookSourceProvider>,
    { routerProps: { query } },
  )

describe('Settings Setup page', () => {
  it.each([
    { url: 'opened from a Workspace', query: { spaceId: faker.string.uuid() } },
    { url: 'opened directly', query: {} },
  ])('names signers and proposers from Workspace then local contacts when $url', ({ query }) => {
    renderSetup(query)

    expect(screen.getByTestId('signers-source')).toHaveTextContent('merged')
    expect(screen.getByTestId('proposers-source')).toHaveTextContent('merged')
  })
})
