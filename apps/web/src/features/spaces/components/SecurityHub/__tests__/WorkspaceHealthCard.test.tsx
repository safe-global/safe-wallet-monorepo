import { render, screen } from '@testing-library/react'
import WorkspaceHealthCard from '../components/WorkspaceHealthCard/WorkspaceHealthCard'
import { scanKey } from '@/features/security/data/scanners/utils'
import type { ScanResult } from '@/features/security/types'
import type { SpaceSafeEntry } from '../types'

jest.mock('@/features/__core__', () => {
  const securityFeatureImpl = require('@/features/security/feature').default
  return {
    ...jest.requireActual('@/features/__core__'),
    useLoadFeature: () => ({
      ...securityFeatureImpl,
      $isReady: true,
      $isDisabled: false,
      $error: undefined,
    }),
  }
})

const mkResult = (status: ScanResult['status'] = 'clear', severity: ScanResult['severity'] = 'Low'): ScanResult => ({
  status,
  severity,
  score: status === 'clear' ? 100 : 30,
  evidence: [],
  remediation: '',
  lastChecked: new Date().toISOString(),
})

const SAFE_A = '0xA000000000000000000000000000000000000000'
const SAFE_B = '0xB000000000000000000000000000000000000000'

const safe = (address: string): SpaceSafeEntry => ({
  address,
  chainId: '1',
  name: `Safe ${address.slice(0, 6)}`,
  isMultichain: false,
  chainEntries: [{ chainId: '1', isDeployed: true }],
})

const allClear = {
  account_setup: mkResult('clear'),
  contract_version: mkResult('clear'),
  guard: mkResult('clear'),
  fallback_handler: mkResult('clear'),
  pending_tx: mkResult('clear'),
}

const baseProps = {
  activeFilter: null,
  onFilterChange: jest.fn(),
  lastScannedAt: Date.now(),
  onRescan: jest.fn(),
}

describe('WorkspaceHealthCard', () => {
  it('shows the final aggregate score after an initial scan completes', () => {
    render(
      <WorkspaceHealthCard
        {...baseProps}
        safes={[safe(SAFE_A), safe(SAFE_B)]}
        scanResults={{
          [scanKey(SAFE_A, '1')]: allClear,
          [scanKey(SAFE_B, '1')]: allClear,
        }}
        isScanning={false}
      />,
    )
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('streams the aggregate incrementally on the very first scan', () => {
    // No data yet, scan running → skeleton (no score text).
    const { rerender } = render(
      <WorkspaceHealthCard {...baseProps} safes={[safe(SAFE_A), safe(SAFE_B)]} scanResults={{}} isScanning={true} />,
    )
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument()

    // First Safe completes mid-scan — gauge renders incrementally rather than
    // skeleton-until-done so users see progress as the queue advances.
    rerender(
      <WorkspaceHealthCard
        {...baseProps}
        safes={[safe(SAFE_A), safe(SAFE_B)]}
        scanResults={{ [scanKey(SAFE_A, '1')]: allClear }}
        isScanning={true}
      />,
    )
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('resets to skeleton when scan results clear (e.g. switching spaces)', () => {
    const { rerender } = render(
      <WorkspaceHealthCard
        {...baseProps}
        safes={[safe(SAFE_A)]}
        scanResults={{ [scanKey(SAFE_A, '1')]: allClear }}
        isScanning={false}
      />,
    )
    expect(screen.getByText('100')).toBeInTheDocument()

    // Space switch: scan results emptied. Snapshot must drop so the next space
    // doesn't carry over the previous score.
    rerender(<WorkspaceHealthCard {...baseProps} safes={[safe(SAFE_A)]} scanResults={{}} isScanning={false} />)
    expect(screen.queryByText('100')).not.toBeInTheDocument()
  })

  it('surfaces a grade filter chip with the count of accounts at that grade', () => {
    const withIssue = { ...allClear, contract_version: mkResult('issue', 'High') }
    render(
      <WorkspaceHealthCard
        {...baseProps}
        safes={[safe(SAFE_A), safe(SAFE_B)]}
        scanResults={{
          [scanKey(SAFE_A, '1')]: allClear,
          [scanKey(SAFE_B, '1')]: withIssue,
        }}
        isScanning={false}
      />,
    )
    expect(screen.getByText('At risk · 1 account')).toBeInTheDocument()
  })

  it('shows a Healthy filter chip with the all-clear safe count when every account passes', () => {
    render(
      <WorkspaceHealthCard
        {...baseProps}
        safes={[safe(SAFE_A), safe(SAFE_B)]}
        scanResults={{
          [scanKey(SAFE_A, '1')]: allClear,
          [scanKey(SAFE_B, '1')]: allClear,
        }}
        isScanning={false}
      />,
    )
    expect(screen.getByText('Healthy · 2 accounts')).toBeInTheDocument()
  })

  it('renders a Critical filter chip when a Safe has a Critical-severity finding', () => {
    const withCritical = { ...allClear, account_setup: mkResult('issue', 'Critical') }
    render(
      <WorkspaceHealthCard
        {...baseProps}
        safes={[safe(SAFE_A)]}
        scanResults={{ [scanKey(SAFE_A, '1')]: withCritical }}
        isScanning={false}
      />,
    )
    expect(screen.getByText('Critical · 1 account')).toBeInTheDocument()
  })

  it('renders a Needs review filter chip when a Safe has only partial / Medium findings', () => {
    const withPartial = { ...allClear, guard: mkResult('partial', 'Medium') }
    render(
      <WorkspaceHealthCard
        {...baseProps}
        safes={[safe(SAFE_A)]}
        scanResults={{ [scanKey(SAFE_A, '1')]: withPartial }}
        isScanning={false}
      />,
    )
    expect(screen.getByText('Needs review · 1 account')).toBeInTheDocument()
  })

  it('shows an incomplete-scan note when the last scan was partial and not running', () => {
    render(
      <WorkspaceHealthCard
        {...baseProps}
        safes={[safe(SAFE_A)]}
        scanResults={{ [scanKey(SAFE_A, '1')]: allClear }}
        isScanning={false}
        scanIncomplete
      />,
    )
    expect(screen.getByText(/last scan didn't finish/i)).toBeInTheDocument()
  })

  it('hides the incomplete-scan note while a scan is running', () => {
    render(
      <WorkspaceHealthCard
        {...baseProps}
        safes={[safe(SAFE_A)]}
        scanResults={{ [scanKey(SAFE_A, '1')]: allClear }}
        isScanning={true}
        scanIncomplete
      />,
    )
    expect(screen.queryByText(/last scan didn't finish/i)).not.toBeInTheDocument()
  })
})
