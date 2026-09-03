import { fireEvent, render, screen } from '@/tests/test-utils'
import type { AccountLine } from '@/features/myAccounts'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import SelectAccountsStep from '../SelectAccountsStep'

const safe = { chainId: '1', address: '0xA', isReadOnly: false, isPinned: true, lastVisited: 0, name: 'Treasury' }
const line = { key: '1:0xA', variant: 'single', address: '0xA', displayName: 'Treasury', source: safe } as AccountLine

jest.mock('../../SelectSafesOnboarding/hooks/useOnboardingSafes', () => ({
  __esModule: true,
  default: () => ({
    trustedSafes: [safe],
    ownedSafes: [],
    flaggedAddresses: new Set<string>(),
    trustedSimilarityGroups: new Map(),
    ownedSimilarityGroups: new Map(),
    similarWarnings: new Map(),
    handleSearch: jest.fn(),
    hasNoSafes: false,
  }),
}))

jest.mock('@/features/myAccounts', () => ({
  SafeAccountsTable: ({
    selection,
  }: {
    selection: { selectedKeys: Set<string>; onToggle: (line: AccountLine, checked: boolean) => void }
  }) => (
    <input
      type="checkbox"
      aria-label="Treasury"
      checked={selection.selectedKeys.has(line.key)}
      onChange={(e) => selection.onToggle(line, e.target.checked)}
    />
  ),
}))

describe('SelectAccountsStep', () => {
  it('counts against the plan limit and reports the selected safes', () => {
    const onContinue = jest.fn()
    render(
      <Dialog open>
        <DialogContent>
          <SelectAccountsStep limit={2} onBack={jest.fn()} onContinue={onContinue} />
        </DialogContent>
      </Dialog>,
    )

    expect(screen.getByText(/You can add up to 2 accounts/)).toBeInTheDocument()
    expect(screen.getByTestId('selected-count')).toHaveTextContent('0 of 2 selected')
    expect(screen.getByRole('button', { name: /Continue to checkout/ })).toBeDisabled()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Treasury' }))
    expect(screen.getByTestId('selected-count')).toHaveTextContent('1 of 2 selected')

    fireEvent.click(screen.getByRole('button', { name: /Continue to checkout/ }))
    expect(onContinue).toHaveBeenCalledWith(['1:0xA'])
  })
})
