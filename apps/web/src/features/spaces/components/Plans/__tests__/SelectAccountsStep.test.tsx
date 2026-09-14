import { fireEvent, render, screen } from '@/tests/test-utils'
import type { AccountLine } from '@/features/myAccounts'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import SelectAccountsStep, { initialSelection } from '../SelectAccountsStep'

const safe = (address: string, name: string, chainId = '1') => ({
  chainId,
  address,
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name,
})
const treasury = safe('0xA', 'Treasury')
const payroll = safe('0xB', 'Payroll')
const grants = safe('0xC', 'Grants')
const multi = {
  address: '0xD',
  name: 'Ops',
  isPinned: false,
  lastVisited: 0,
  safes: [safe('0xD', 'Ops'), safe('0xD', 'Ops', '10')],
}
const allSafes = [treasury, payroll, grants]

jest.mock('../../../hooks/useSpaceSafes', () => ({ useSpaceSafes: () => ({ allSafes, isLoading: false }) }))
jest.mock('@/hooks/safes/useSafesSearch', () => ({
  useSafesSearch: (items: unknown[], query: string) =>
    query ? items.filter((item) => (item as { name: string }).name.toLowerCase().includes(query.toLowerCase())) : items,
}))

jest.mock('@/features/myAccounts', () => ({
  SafeAccountsTable: ({
    items,
    selection,
  }: {
    items: Array<{ chainId: string; address: string; name: string }>
    selection: { selectedKeys: Set<string>; onToggle: (line: AccountLine, checked: boolean) => void }
  }) => (
    <>
      {items.map((item) => {
        const key = `${item.chainId}:${item.address}`
        return (
          <input
            key={key}
            type="checkbox"
            aria-label={item.name}
            checked={selection.selectedKeys.has(key)}
            onChange={(e) =>
              selection.onToggle(
                { key, variant: 'single', address: item.address, displayName: item.name, source: item } as AccountLine,
                e.target.checked,
              )
            }
          />
        )
      })}
    </>
  ),
}))

const renderStep = (props: Partial<React.ComponentProps<typeof SelectAccountsStep>> = {}) =>
  render(
    <Dialog open>
      <DialogContent>
        <SelectAccountsStep limit={2} planName="Business" onBack={jest.fn()} onContinue={jest.fn()} {...props} />
      </DialogContent>
    </Dialog>,
  )

describe('SelectAccountsStep', () => {
  it('preselects the first Safes up to the limit and checks a multi-chain group only when whole', () => {
    expect(initialSelection([multi, treasury], 2)).toEqual({ '1:0xD': true, '10:0xD': true, multichain_0xD: true })
    expect(initialSelection([multi, treasury], 1)).toEqual({ '1:0xD': true })
  })

  it('starts full, warns about the Safes left out and reports them on continue', () => {
    const onContinue = jest.fn()
    renderStep({ onContinue })

    expect(screen.getByText(/Business covers 2 Safe accounts/)).toBeInTheDocument()
    expect(screen.getByTestId('selected-count')).toHaveTextContent('2 of 2 selected')
    expect(screen.getByRole('checkbox', { name: 'Treasury' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Grants' })).not.toBeChecked()
    expect(screen.getByText(/1 Safe account will be removed from the Workspace/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Payroll' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Grants' }))
    expect(screen.getByTestId('selected-count')).toHaveTextContent('2 of 2 selected')

    fireEvent.click(screen.getByRole('button', { name: /Continue to checkout/ }))
    expect(onContinue).toHaveBeenCalledWith([{ chainId: '1', address: '0xB' }])
  })

  it('filters the table by the search query without losing the selection', () => {
    renderStep()

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search Safe list' }), { target: { value: 'gra' } })

    expect(screen.queryByRole('checkbox', { name: 'Treasury' })).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Grants' })).toBeInTheDocument()
    expect(screen.getByTestId('selected-count')).toHaveTextContent('2 of 2 selected')
  })

  it('shows the given error and blocks the buttons while submitting', () => {
    const onBack = jest.fn()
    renderStep({ onBack, isSubmitting: true, error: 'Nope' })

    expect(screen.getByText('Nope')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continue to checkout/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()
  })
})
