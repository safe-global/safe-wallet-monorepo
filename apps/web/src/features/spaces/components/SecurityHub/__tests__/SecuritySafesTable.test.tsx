import type { ReactNode } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SecuritySafesTable from '../components/SecuritySafesTable/SecuritySafesTable'
import type { SpaceSafeEntry, SelectedSafe } from '@safe-global/views/features/spaces/components/SecurityHub/types'
import type { ScanResult } from '@/features/security/types'
import { AppRoutes } from '@/config/routes'
// Helper: mirrors security.scanKey exactly (address.toLowerCase() + chainId). Inlined to
// avoid a feature-handle mock setup in tests that don't exercise the security feature directly.
const scanKey = (address: string, chainId: string) => `${address.toLowerCase()}:${chainId}`

// ─── mocks ────────────────────────────────────────────────────────────────────

jest.mock('next/link', () => {
  type Href = string | { pathname: string; query: Record<string, string> }
  const MockLink = ({ children, href, ...rest }: { children: ReactNode; href: Href } & Record<string, unknown>) => (
    <a href={typeof href === 'string' ? href : `${href.pathname}?${new URLSearchParams(href.query)}`} {...rest}>
      {children}
    </a>
  )
  MockLink.displayName = 'MockLink'
  return { __esModule: true, default: MockLink }
})

jest.mock('@/components/common/ChainIndicator', () => {
  const MockCI = ({ chainId }: { chainId: string }) => <span data-testid={`chain-${chainId}`} />
  MockCI.displayName = 'MockChainIndicator'
  return { __esModule: true, default: MockCI }
})

jest.mock('@/features/multichain', () => ({
  NetworkLogosList: ({ networks }: { networks: { chainId: string }[] }) => (
    <span data-testid="network-logos">{networks.length}</span>
  ),
}))

jest.mock('@/components/common/Identicon', () => {
  const MockId = ({ address }: { address: string }) => <span data-testid={`identicon-${address.slice(0, 6)}`} />
  MockId.displayName = 'MockIdenticon'
  return { __esModule: true, default: MockId }
})

// Mock only the query hook, not the entire gateway module (avoids breaking Redux store bootstrap)
jest.mock('@safe-global/store/gateway', () => ({
  ...jest.requireActual('@safe-global/store/gateway'),
  useGetChainsConfigV2Query: () => ({
    data: {
      ids: ['1', '137'],
      entities: {
        '1': { chainId: '1', shortName: 'eth' },
        '137': { chainId: '137', shortName: 'matic' },
      },
    },
  }),
}))

jest.mock('@/store/api/gateway', () => ({
  useGetMultipleSafeOverviewsQuery: () => ({ data: [] }),
}))

jest.mock('@/store', () => ({
  useAppSelector: () => 'usd',
}))

// useLoadFeature needs Redux/chain context; return the resolved feature synchronously.
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

// ─── helpers ──────────────────────────────────────────────────────────────────

const mkResult = (status: ScanResult['status'] = 'clear'): ScanResult => ({
  status,
  severity: status === 'clear' ? 'Low' : 'High',
  score: status === 'clear' ? 100 : 30,
  evidence: [],
  remediation: '',
  lastChecked: new Date().toISOString(),
})

const singleSafe: SpaceSafeEntry = {
  address: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
  chainId: '1',
  name: 'My Vault',
  isMultichain: false,
  chainEntries: [{ chainId: '1', isDeployed: true }],
}

const multiSafe: SpaceSafeEntry = {
  address: '0x1111111111111111111111111111111111111111',
  chainId: '1',
  name: 'Multi Safe',
  isMultichain: true,
  chainEntries: [
    { chainId: '1', isDeployed: true },
    { chainId: '137', isDeployed: true },
  ],
}

const buildScanResults = (
  entries: { address: string; chainId: string }[],
  resultOverrides: Record<string, Partial<ScanResult>> = {},
) => {
  const all: Record<string, Record<string, ScanResult>> = {}
  for (const e of entries) {
    const key = scanKey(e.address, e.chainId)
    all[key] = {
      account_setup: mkResult(),
      contract_version: mkResult(),
      recovery: mkResult(),
      factory_validation: mkResult(),
      guard: mkResult(),
      fallback_handler: mkResult(),
      modules: mkResult(),
      pending_tx: mkResult(),
      transaction_scanning: mkResult(),
      multichain_setup: mkResult('not_applicable'),
      ...resultOverrides,
    }
  }
  return all
}

type Props = React.ComponentProps<typeof SecuritySafesTable>
const renderTable = (overrides: Partial<Props> = {}) => {
  const defaults: Props = {
    safes: [singleSafe],
    onViewReport: jest.fn(),
    selectedSafe: null,
    scanResults: buildScanResults([{ address: singleSafe.address, chainId: singleSafe.chainId }]),
    balanceMap: {},
  }
  return render(<SecuritySafesTable {...defaults} {...overrides} />)
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('SecuritySafesTable', () => {
  it('renders a single-chain safe row with name and network icon', () => {
    renderTable()
    expect(screen.getByText('My Vault')).toBeInTheDocument()
    expect(screen.getByTestId('chain-1')).toBeInTheDocument()
  })

  it('renders a copy-address button on the safe row', () => {
    renderTable()
    expect(screen.getByRole('button', { name: 'Copy address' })).toBeInTheDocument()
  })

  it('copying the address does not trigger the row click', () => {
    const writeText = jest.fn()
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const onViewReport = jest.fn()
    renderTable({ onViewReport })

    fireEvent.click(screen.getByRole('button', { name: 'Copy address' }))

    expect(writeText).toHaveBeenCalledWith(singleSafe.address)
    expect(onViewReport).not.toHaveBeenCalled()
  })

  it('calls onViewReport when a deployed row is clicked', () => {
    const onViewReport = jest.fn()
    renderTable({ onViewReport })
    fireEvent.click(screen.getByText('My Vault').closest('[data-testid="security-safe-row"]')!)
    expect(onViewReport).toHaveBeenCalledWith(singleSafe.address, singleSafe.chainId)
  })

  it('does not fire onViewReport for an undeployed safe', () => {
    const onViewReport = jest.fn()
    const undeployed: SpaceSafeEntry = {
      ...singleSafe,
      chainEntries: [{ chainId: '1', isDeployed: false }],
    }
    renderTable({ safes: [undeployed], onViewReport, scanResults: {} })
    fireEvent.click(screen.getByText('My Vault').closest('[data-testid="security-safe-row"]')!)
    expect(onViewReport).not.toHaveBeenCalled()
    expect(screen.getByText('Not deployed')).toBeInTheDocument()
  })

  it('shows a dash when no scan results are available', () => {
    renderTable({ scanResults: {} })
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
  })

  it('shows a spinner for a safe that is currently scanning', () => {
    const key = scanKey(singleSafe.address, singleSafe.chainId)
    const { container } = renderTable({
      scanningKeys: new Set([key]),
      scanResults: {},
    })
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThanOrEqual(1)
  })

  it('renders scan data even when the key is still in scanningKeys', () => {
    // Regression: the drawer (or a parallel consumer) can populate scanResults for a Safe
    // before useAutoScan's sequential queue reaches it. Cells must prefer data over the
    // scanning flag so the row shows real values immediately instead of stale skeletons.
    const key = scanKey(singleSafe.address, singleSafe.chainId)
    const scanResults = buildScanResults([{ address: singleSafe.address, chainId: singleSafe.chainId }])
    const { container } = renderTable({
      scanningKeys: new Set([key]),
      scanResults,
      balanceMap: { [key]: '1000' },
    })
    // Balance resolves to real data ($1.0K) rather than a skeleton.
    expect(screen.getByText('$1.0K')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBe(0)
  })

  it('shows total non-passing checks in the status column, regardless of status/severity', () => {
    const scanResults = buildScanResults([{ address: singleSafe.address, chainId: singleSafe.chainId }], {
      account_setup: mkResult('issue'),
      recovery: mkResult('partial'),
      guard: mkResult('partial'),
    })
    renderTable({ scanResults })
    // 1 issue + 2 partial = 3 non-passing; chip color is at_risk (issue → at_risk), text leads
    // with the grade word so the column matches the panel header and sidebar group chips.
    expect(screen.getByText('At risk · 3 issues found')).toBeInTheDocument()
  })

  it('renders just "Healthy" with no count when every check passes', () => {
    // Default scan results in renderTable are all clear → grade=passing → chip is the bare "Healthy" label.
    renderTable()
    expect(screen.getByText('Healthy')).toBeInTheDocument()
    expect(screen.queryByText(/0 issues found/i)).not.toBeInTheDocument()
  })

  describe('contract update available', () => {
    const upgradeAvailable: Partial<ScanResult> = { ...mkResult(), upgradeAvailable: true }

    it('shows an Update link to Settings → Setup next to the Healthy chip', () => {
      renderTable({
        scanResults: buildScanResults([{ address: singleSafe.address, chainId: '1' }], {
          contract_version: upgradeAvailable,
        }),
      })
      expect(screen.getByText('Healthy')).toBeInTheDocument()
      const link = screen.getByRole('link', { name: 'Update contracts' })
      expect(link).toHaveAttribute('href', expect.stringContaining(AppRoutes.settings.setup))
      expect(link).toHaveAttribute('href', expect.stringContaining(encodeURIComponent(`eth:${singleSafe.address}`)))
    })

    it('puts the Update link in its own column, not in the Status cell', () => {
      const { container } = renderTable({
        scanResults: buildScanResults([{ address: singleSafe.address, chainId: '1' }], {
          contract_version: upgradeAvailable,
        }),
      })
      const link = screen.getByRole('link', { name: 'Update contracts' })
      expect(screen.getByLabelText('Healthy').parentElement).not.toContainElement(link)

      const row = screen.getByText('My Vault').closest('[data-testid="security-safe-row"]')!
      const header = container.querySelector('.min-w-\\[960px\\]')!.firstElementChild!
      expect(row.children).toHaveLength(header.children.length)
    })

    it('does not open the side card when the Update link is clicked', () => {
      const onViewReport = jest.fn()
      renderTable({
        onViewReport,
        scanResults: buildScanResults([{ address: singleSafe.address, chainId: '1' }], {
          contract_version: upgradeAvailable,
        }),
      })
      fireEvent.click(screen.getByRole('link', { name: 'Update contracts' }))
      expect(onViewReport).not.toHaveBeenCalled()
    })

    it('shows the Update link next to a non-passing chip too', () => {
      renderTable({
        scanResults: buildScanResults([{ address: singleSafe.address, chainId: '1' }], {
          contract_version: { ...mkResult('partial'), severity: 'Medium', upgradeAvailable: true },
        }),
      })
      expect(screen.getByText('Needs review · 1 issue found')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Update contracts' })).toBeInTheDocument()
    })

    it('shows no Update link when the contract version is current', () => {
      renderTable()
      expect(screen.queryByRole('link', { name: 'Update contracts' })).not.toBeInTheDocument()
    })

    it('links each network that needs an update, not the collapsed multichain row', () => {
      const chains = [
        { address: multiSafe.address, chainId: '1' },
        { address: multiSafe.address, chainId: '137' },
      ]
      renderTable({
        safes: [multiSafe],
        scanResults: buildScanResults(chains, { contract_version: upgradeAvailable }),
      })

      expect(screen.queryByRole('link', { name: 'Update contracts' })).not.toBeInTheDocument()

      fireEvent.click(screen.getAllByText('Multi Safe')[0].closest('[data-testid="security-safe-row"]')!)
      const links = screen.getAllByRole('link', { name: 'Update contracts' })
      expect(links).toHaveLength(2)
      expect(screen.getByTestId('chain-1').closest('[data-testid="security-safe-row"]')).toContainElement(links[0])
      expect(links[0]).toHaveAttribute('href', expect.stringContaining(encodeURIComponent(`eth:${multiSafe.address}`)))
      expect(screen.getByTestId('chain-137').closest('[data-testid="security-safe-row"]')).toContainElement(links[1])
      expect(links[1]).toHaveAttribute(
        'href',
        expect.stringContaining(encodeURIComponent(`matic:${multiSafe.address}`)),
      )
    })

    it('shows no link on a network row whose contract version is current', () => {
      const scanResults = {
        ...buildScanResults([{ address: multiSafe.address, chainId: '1' }]),
        ...buildScanResults([{ address: multiSafe.address, chainId: '137' }], { contract_version: upgradeAvailable }),
      }
      renderTable({ safes: [multiSafe], scanResults })

      fireEvent.click(screen.getAllByText('Multi Safe')[0].closest('[data-testid="security-safe-row"]')!)
      const links = screen.getAllByRole('link', { name: 'Update contracts' })
      expect(links).toHaveLength(1)
      expect(screen.getByTestId('chain-137').closest('[data-testid="security-safe-row"]')).toContainElement(links[0])
    })
  })

  describe('multichain safes', () => {
    const scanResults = buildScanResults([
      { address: multiSafe.address, chainId: '1' },
      { address: multiSafe.address, chainId: '137' },
    ])

    it('renders a parent row with network logos and an expand caret', () => {
      renderTable({ safes: [multiSafe], scanResults })
      // Parent + child rows both contain the name; assert at least one exists.
      expect(screen.getAllByText('Multi Safe').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByTestId('network-logos')).toBeInTheDocument()
      expect(screen.getByTestId('expand-networks')).toBeInTheDocument()
    })

    it('reveals per-chain child rows when the parent is expanded', () => {
      const onViewReport = jest.fn()
      renderTable({ safes: [multiSafe], scanResults, onViewReport })
      // Expand the multichain row — click the parent (first match)
      const parentRow = screen.getAllByText('Multi Safe')[0].closest('[data-testid="security-safe-row"]')!
      fireEvent.click(parentRow)
      // After expand, child chain rows become visible — each has a chain indicator
      expect(screen.getByTestId('chain-1')).toBeInTheDocument()
      expect(screen.getByTestId('chain-137')).toBeInTheDocument()
      // Click a child row — should fire onViewReport with that chain
      fireEvent.click(screen.getByTestId('chain-137').closest('[data-testid="security-safe-row"]')!)
      expect(onViewReport).toHaveBeenCalledWith(multiSafe.address, '137')
    })

    it('shows multichain warning icon when multichain_setup scanner reports a problem', () => {
      const warnResults = buildScanResults(
        [
          { address: multiSafe.address, chainId: '1' },
          { address: multiSafe.address, chainId: '137' },
        ],
        { multichain_setup: { status: 'partial', severity: 'Medium' } as ScanResult },
      )
      renderTable({ safes: [multiSafe], scanResults: warnResults })
      expect(screen.getByLabelText('Signer setup differs across networks')).toBeInTheDocument()
    })
  })

  it('renders skeleton rows instead of safe rows while overviews load', () => {
    renderTable({ isLoading: true, safes: [singleSafe, multiSafe] })
    // The skeleton stands in for the rows — no real safe row or name is painted yet,
    // so optimistic deployment flags/balances never flip on screen.
    expect(screen.getByTestId('security-safes-table-skeleton')).toBeInTheDocument()
    expect(screen.queryByText('My Vault')).not.toBeInTheDocument()
    expect(screen.queryByTestId('security-safe-row')).not.toBeInTheDocument()
  })

  it('renders real rows once overviews have loaded', () => {
    renderTable({ isLoading: false })
    expect(screen.queryByTestId('security-safes-table-skeleton')).not.toBeInTheDocument()
    expect(screen.getByText('My Vault')).toBeInTheDocument()
  })

  it('highlights the selected safe row', () => {
    const selected: SelectedSafe = { address: singleSafe.address, chainId: '1' }
    renderTable({ selectedSafe: selected })
    const row = screen.getByText('My Vault').closest('[data-testid="security-safe-row"]')!
    expect(row).toHaveAttribute('data-selected', 'true')
  })
})
