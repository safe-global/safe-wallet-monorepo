import { render } from '@testing-library/react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import SecurityHubContent from '../SecurityHubContent'
import type { SpaceSafeEntry } from '../types'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

jest.mock('@/features/__core__', () => ({
  useLoadFeature: () => ({ $isReady: true, scanKey: (address: string, chainId: string) => `${chainId}:${address}` }),
}))
jest.mock('@/features/security', () => ({ SecurityFeature: 'security' }))

const reconciledSafes = { isLoadingSpacesSafes: false, isLoadingOverviews: false, safes: [] as SpaceSafeEntry[] }
jest.mock('../hooks/useReconciledSpaceSafes', () => ({
  __esModule: true,
  default: () => ({ ...reconciledSafes, deployedEntries: [], balanceMap: {}, overviewMap: {} }),
}))
jest.mock('../hooks/useScanResultsState', () => ({
  __esModule: true,
  default: () => ({ allScanResults: {}, scanTimestamps: {}, lastScannedAt: null, handleScanComplete: jest.fn() }),
}))
jest.mock('../hooks/useAutoScanOrchestrator', () => ({
  __esModule: true,
  default: () => ({ scanningKeys: [], isRunning: false, scanIncomplete: false, startScan: jest.fn() }),
}))
jest.mock('../hooks/useReportDrawer', () => ({
  __esModule: true,
  default: () => ({
    selectedSafe: null,
    selectedEntry: undefined,
    scanContext: null,
    openReport: jest.fn(),
    closeReport: jest.fn(),
  }),
}))

jest.mock('../components/WorkspaceHealthCard/WorkspaceHealthCard', () => () => null)
jest.mock('../components/SecuritySafesTable/SecuritySafesTable', () => () => null)
jest.mock('../components/SecurityReportDrawer/SecurityReportDrawer', () => () => null)
jest.mock('../components/SecurityEmptyState/SecurityEmptyState', () => () => null)

const safeEntry = (chainId: string): SpaceSafeEntry => ({
  address: `0x${chainId}`,
  chainId,
  isMultichain: false,
  chainEntries: [{ chainId, isDeployed: true }],
})

describe('SecurityHubContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    reconciledSafes.isLoadingSpacesSafes = false
    reconciledSafes.safes = []
  })

  it('tracks the view with the number of accounts', () => {
    reconciledSafes.safes = [safeEntry('1'), safeEntry('11155111')]

    render(<SecurityHubContent />)

    expect(trackEvent).toHaveBeenCalledWith(SPACE_EVENTS.SECURITY_HUB_VIEWED, { 'Account Count': 2 })
  })

  it('does not track the view until the accounts have loaded', () => {
    reconciledSafes.isLoadingSpacesSafes = true

    const { rerender } = render(<SecurityHubContent />)
    expect(trackEvent).not.toHaveBeenCalled()

    reconciledSafes.isLoadingSpacesSafes = false
    reconciledSafes.safes = [safeEntry('1')]
    rerender(<SecurityHubContent />)

    expect(trackEvent).toHaveBeenCalledTimes(1)
    expect(trackEvent).toHaveBeenCalledWith(SPACE_EVENTS.SECURITY_HUB_VIEWED, { 'Account Count': 1 })
  })

  it('tracks the view once per mount', () => {
    reconciledSafes.safes = [safeEntry('1')]

    const { rerender } = render(<SecurityHubContent />)
    rerender(<SecurityHubContent />)
    rerender(<SecurityHubContent />)

    expect(trackEvent).toHaveBeenCalledTimes(1)
  })

  it('tracks an empty workspace as a view with no accounts', () => {
    render(<SecurityHubContent />)

    expect(trackEvent).toHaveBeenCalledWith(SPACE_EVENTS.SECURITY_HUB_VIEWED, { 'Account Count': 0 })
  })
})
