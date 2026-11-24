import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { fireEvent, render, screen } from '@/tests/test-utils'
import QueueRowSafeTag from './QueueRowSafeTag'

const mockConfigs = jest.fn(() => [{ chainId: '1', chainName: 'Ethereum', shortName: 'eth', chainLogoUri: null }])
jest.mock('@/hooks/useChains', () => ({ __esModule: true, default: () => ({ configs: mockConfigs() }) }))
jest.mock('@/hooks/useSafeDisplayName', () => ({ useSafeDisplayName: () => 'Treasury' }))
jest.mock('./QueueParty/PartyCard', () => ({ __esModule: true, default: () => <span data-testid="party-card" /> }))

const safeAddress = checksumAddress(faker.finance.ethereumAddress())
const spaceId = faker.string.uuid()

const renderTag = (chainId = '1') => {
  const push = jest.fn(() => Promise.resolve(true))
  render(<QueueRowSafeTag safeAddress={safeAddress} chainId={chainId} />, {
    routerProps: { query: { spaceId }, push },
  })
  return { push, link: screen.queryByRole('link', { name: /Treasury/ }) }
}

describe('QueueRowSafeTag', () => {
  it("links to the Safe's home on its network, keeping the Workspace", () => {
    const { link } = renderTag()

    expect(link).toHaveAttribute('href', `/home?safe=eth:${safeAddress}&spaceId=${spaceId}`)
  })

  it('opens the Safe in place on a click', () => {
    const { push, link } = renderTag()

    fireEvent.click(link!)

    expect(push).toHaveBeenCalledWith(`/home?safe=eth:${safeAddress}&spaceId=${spaceId}`)
  })

  it.each([{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }])(
    'leaves a modified click (%o) to the browser, to open a new tab',
    (modifier) => {
      const { push, link } = renderTag()

      fireEvent.click(link!, modifier)

      expect(push).not.toHaveBeenCalled()
    },
  )

  it('shows no link for a network the app has no config for', () => {
    const { link } = renderTag('424242')

    expect(link).toBeNull()
    expect(screen.getByTestId('queue-safe-tag')).toBeInTheDocument()
  })
})
