import { render } from '@/tests/test-utils'
import SafeSelectorTriggerContent from '../components/SafeSelectorTriggerContent'
import * as useIsHypernativeGuard from '@/features/hypernative'
import * as coreFeatures from '@/features/__core__'
import { SafeHeaderHnTooltip } from '@/features/hypernative'
import type { SafeItemData } from '../types'

jest.mock('@/features/hypernative/hooks/useIsHypernativeGuard')
jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: jest.fn(),
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
jest.mock('../components/CopyAddressButton', () => ({ __esModule: true, default: () => null }))
jest.mock('../components/ExplorerLinkButton', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/settings/EnvironmentVariables/EnvHintButton', () => ({ __esModule: true, default: () => null }))

const mockUseLoadFeature = coreFeatures.useLoadFeature as jest.Mock

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

    mockUseLoadFeature.mockReturnValue({
      SafeHeaderHnTooltip,
      $isDisabled: false,
      $isReady: true,
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
