import { render } from '@/tests/test-utils'
import SafeSelectorTriggerContent from '../components/SafeSelectorTriggerContent'
import * as useIsHypernativeGuard from '@/features/hypernative/public/hooks/useIsHypernativeGuard'
import type { SafeItemData } from '@safe-global/views/features/spaces/components/SafeSelectorDropdown/types'

jest.mock('@/features/hypernative/public/hooks/useIsHypernativeGuard')
// Render the real tooltip, not the lazy wrapper
jest.mock('@/features/hypernative/public/components/SafeHeaderHnTooltip', () => ({
  __esModule: true,
  default: jest.requireActual('@/features/hypernative/components/SafeHeaderHnTooltip/SafeHeaderHnTooltip')
    .SafeHeaderHnTooltip,
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [] })),
  useChain: jest.fn(() => undefined),
}))

jest.mock('@/hooks/useSafeDisplayName', () => ({
  useSafeDisplayName: jest.fn(() => ''),
}))

jest.mock('../components/SafeBalanceBlock', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/common/AccountRow/CopyAddressButton', () => ({ __esModule: true, default: () => null }))
jest.mock('@safe-global/views/components/common/AccountRow/ExplorerLinkButton', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('@/components/settings/EnvironmentVariables/EnvHintButton', () => ({ __esModule: true, default: () => null }))

const SELECTED_CHAIN_ID = '1'

const selectedItem: SafeItemData = {
  id: `eth:0x0000000000000000000000000000000000005AFE`,
  name: '',
  address: '0x0000000000000000000000000000000000005AFE',
  threshold: 1,
  owners: 1,
  balance: '100',
  chains: [{ chainId: SELECTED_CHAIN_ID, chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }],
}

describe('SafeSelectorTriggerContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(useIsHypernativeGuard, 'useIsHypernativeGuard').mockReturnValue({
      isHypernativeGuard: false,
      loading: false,
    })
  })

  it('renders the Hypernative shield icon when the active Safe has a Hypernative guard', () => {
    jest.spyOn(useIsHypernativeGuard, 'useIsHypernativeGuard').mockReturnValue({
      isHypernativeGuard: true,
      loading: false,
    })

    const { container } = render(
      <SafeSelectorTriggerContent selectedItem={selectedItem} selectedChainId={SELECTED_CHAIN_ID} />,
    )

    expect(container.querySelector('[class*="shield-lines"]')).not.toBeNull()
  })

  it('does not render the Hypernative shield icon when the active Safe has no Hypernative guard', () => {
    const { container } = render(
      <SafeSelectorTriggerContent selectedItem={selectedItem} selectedChainId={SELECTED_CHAIN_ID} />,
    )

    expect(container.querySelector('[class*="shield-lines"]')).toBeNull()
  })
})
