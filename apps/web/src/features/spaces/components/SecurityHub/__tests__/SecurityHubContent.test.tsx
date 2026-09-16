import { render } from '@testing-library/react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import SecurityHubContent from '../SecurityHubContent'
import type { SelectedSafe, SpaceSafeEntry } from '../types'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

jest.mock('@/features/__core__', () => ({
  useLoadFeature: () => ({
    $isReady: true,
    scanKey: (address: string, chainId: string) => `${chainId}:${address}`,
    getSafeGrade: (results: { grade: string }) => results.grade,
  }),
}))
jest.mock('@/features/security', () => ({ SecurityFeature: 'security' }))

const reconciledSafes = { isLoadingSpacesSafes: false, isLoadingOverviews: false, safes: [] as SpaceSafeEntry[] }
jest.mock('../hooks/useReconciledSpaceSafes', () => ({
  __esModule: true,
  default: () => ({ ...reconciledSafes, deployedEntries: [], balanceMap: {}, overviewMap: {} }),
}))
const scanState = { allScanResults: {} as Record<string, { grade: string }> }
jest.mock('../hooks/useScanResultsState', () => ({
  __esModule: true,
  default: () => ({
    allScanResults: scanState.allScanResults,
    scanTimestamps: {},
    lastScannedAt: null,
    handleScanComplete: jest.fn(),
  }),
}))
jest.mock('../hooks/useAutoScanOrchestrator', () => ({
  __esModule: true,
  default: () => ({ scanningKeys: [], isRunning: false, scanIncomplete: false, startScan: jest.fn() }),
}))
const drawerState = { selectedSafe: null as SelectedSafe | null }
const mockOpenReport = jest.fn()
jest.mock('../hooks/useReportDrawer', () => ({
  __esModule: true,
  default: () => ({
    selectedSafe: drawerState.selectedSafe,
    selectedEntry: undefined,
    scanContext: null,
    openReport: mockOpenReport,
    closeReport: jest.fn(),
  }),
}))

jest.mock('../components/WorkspaceHealthCard/WorkspaceHealthCard', () => () => null)
let viewReport: (address: string, chainId: string) => void
jest.mock(
  '../components/SecuritySafesTable/SecuritySafesTable',
  () => (props: { onViewReport: (address: string, chainId: string) => void }) => {
    viewReport = props.onViewReport
    return null
  },
)
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
    drawerState.selectedSafe = null
    scanState.allScanResults = {}
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

  describe('report drawer', () => {
    const SAFE = { address: '0xabc', chainId: '1' }

    beforeEach(() => {
      reconciledSafes.safes = [safeEntry('1')]
    })

    it('tracks opening a report with its chain, address and grade', () => {
      scanState.allScanResults = { '1:0xabc': { grade: 'at_risk' } }
      render(<SecurityHubContent />)
      ;(trackEvent as jest.Mock).mockClear()

      viewReport(SAFE.address, SAFE.chainId)

      expect(trackEvent).toHaveBeenCalledWith(SPACE_EVENTS.SECURITY_REPORT_OPENED, {
        'Chain ID': '1',
        'Safe Address': '0xabc',
        Result: 'at_risk',
      })
      expect(mockOpenReport).toHaveBeenCalledWith('0xabc', '1')
    })

    it('does not track when the open report is toggled closed', () => {
      drawerState.selectedSafe = SAFE
      render(<SecurityHubContent />)
      ;(trackEvent as jest.Mock).mockClear()

      viewReport(SAFE.address, SAFE.chainId)

      expect(trackEvent).not.toHaveBeenCalled()
      expect(mockOpenReport).toHaveBeenCalledWith('0xabc', '1')
    })

    it('tracks switching from one open report to another', () => {
      drawerState.selectedSafe = { address: '0xother', chainId: '1' }
      render(<SecurityHubContent />)
      ;(trackEvent as jest.Mock).mockClear()

      viewReport(SAFE.address, SAFE.chainId)

      expect(trackEvent).toHaveBeenCalledWith(
        SPACE_EVENTS.SECURITY_REPORT_OPENED,
        expect.objectContaining({ 'Safe Address': '0xabc' }),
      )
    })

    it('tracks an unscanned safe with no grade', () => {
      render(<SecurityHubContent />)
      ;(trackEvent as jest.Mock).mockClear()

      viewReport(SAFE.address, SAFE.chainId)

      expect(trackEvent).toHaveBeenCalledWith(
        SPACE_EVENTS.SECURITY_REPORT_OPENED,
        expect.objectContaining({ Result: undefined }),
      )
    })
  })
})
