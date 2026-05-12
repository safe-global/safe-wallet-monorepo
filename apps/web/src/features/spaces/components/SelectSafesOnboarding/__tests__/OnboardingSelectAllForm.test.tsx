import { render, screen, fireEvent } from '@/tests/test-utils'
import { FormProvider, useForm } from 'react-hook-form'
import type { AllSafeItems, MultiChainSafeItem, SafeItem } from '@/hooks/safes'
import SelectAllHeader from '@/features/spaces/components/AddAccounts/SelectAllHeader'
import SelectAllToggle from '@/features/spaces/components/AddAccounts/SelectAllToggle'
import { useSelectAll } from '@/features/spaces/components/AddAccounts/useSelectAll'
import type { AddAccountsFormValues } from '@/features/spaces/components/AddAccounts/types'
import { MULTICHAIN_SAFE_KEY_PREFIX } from '../constants'

jest.mock('../../Sidebar/constants', () => ({
  SAFE_ACCOUNTS_LIMIT: 10,
}))

const makeSafe = (chainId: string, address: string): SafeItem => ({
  chainId,
  address,
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
})

const makeMulti = (address: string, chainIds: string[]): MultiChainSafeItem => ({
  address,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
  safes: chainIds.map((c) => makeSafe(c, address)),
})

/** Mirrors SelectSafesOnboarding wiring: FormProvider + useSelectAll + global/section toggles. */
const getSelectedSafesRef: { current?: () => Record<string, boolean | undefined> } = {}

const OnboardingSelectAllHarness = ({
  trusted,
  owned,
  initialSelected = {},
}: {
  trusted: AllSafeItems
  owned: AllSafeItems
  initialSelected?: Record<string, boolean>
}) => {
  const formMethods = useForm<AddAccountsFormValues>({
    defaultValues: { selectedSafes: initialSelected },
  })
  const { control, setValue, getValues } = formMethods

  getSelectedSafesRef.current = () => getValues('selectedSafes')

  const { globalSelection, trustedSelection, ownedSelection, handleSelectAll, capReached } = useSelectAll({
    visibleTrusted: trusted,
    visibleOwned: owned,
    control,
    setValue,
  })

  return (
    <FormProvider {...formMethods}>
      <SelectAllHeader
        state={globalSelection.state}
        selectedCount={globalSelection.selectedCount}
        total={globalSelection.total}
        onToggle={(check) => handleSelectAll('all', check)}
        capReached={capReached}
      />
      <div className="flex flex-col gap-2">
        <SelectAllToggle
          state={trustedSelection.state}
          count={trustedSelection.selectedCount}
          total={trustedSelection.total}
          onToggle={(check) => handleSelectAll('trusted', check)}
          label="Select all"
          testId="select-all-trusted"
        />
        <SelectAllToggle
          state={ownedSelection.state}
          count={ownedSelection.selectedCount}
          total={ownedSelection.total}
          onToggle={(check) => handleSelectAll('owned', check)}
          label="Select all"
          testId="select-all-owned"
        />
      </div>
    </FormProvider>
  )
}

const globalCountText = () => screen.getByTestId('select-all-global').parentElement?.textContent ?? ''

describe('SelectSafesOnboarding — select-all form behavior (mirrors screen wiring)', () => {
  beforeEach(() => {
    getSelectedSafesRef.current = undefined
  })

  const getSelected = () => getSelectedSafesRef.current?.() ?? {}

  it('global select all: second click clears selection and count returns to (0/total)', () => {
    const trusted = [makeSafe('1', '0xA')] as AllSafeItems
    const owned = [makeSafe('10', '0xB')] as AllSafeItems

    render(<OnboardingSelectAllHarness trusted={trusted} owned={owned} />)

    expect(globalCountText()).toContain('(0/2)')

    fireEvent.click(screen.getByTestId('select-all-global'))
    expect(globalCountText()).toContain('(2/2)')

    fireEvent.click(screen.getByTestId('select-all-global'))
    expect(globalCountText()).toContain('(0/2)')

    const selected = getSelected()
    expect(selected['1:0xA']).toBe(false)
    expect(selected['10:0xB']).toBe(false)
  })

  it('global select all: when everything is already selected, first click clears (same as Add Accounts)', () => {
    const trusted = [makeSafe('1', '0xA')] as AllSafeItems
    const owned = [makeSafe('10', '0xB')] as AllSafeItems
    const initialSelected = { '1:0xA': true, '10:0xB': true }

    render(
      <OnboardingSelectAllHarness
        key="all-selected-two-singles"
        trusted={trusted}
        owned={owned}
        initialSelected={initialSelected}
      />,
    )

    expect(globalCountText()).toContain('(2/2)')

    fireEvent.click(screen.getByTestId('select-all-global'))
    expect(globalCountText()).toContain('(0/2)')

    const selected = getSelected()
    expect(selected['1:0xA']).toBe(false)
    expect(selected['10:0xB']).toBe(false)
  })

  it('trusted section select all: second click clears only trusted; owned keys unchanged', () => {
    const trusted = [makeSafe('1', '0xA')] as AllSafeItems
    const owned = [makeSafe('10', '0xB')] as AllSafeItems

    render(<OnboardingSelectAllHarness trusted={trusted} owned={owned} />)

    fireEvent.click(screen.getByTestId('select-all-trusted'))
    expect(getSelected()['1:0xA']).toBe(true)
    expect(getSelected()['10:0xB']).toBeUndefined()

    fireEvent.click(screen.getByTestId('select-all-trusted'))
    expect(getSelected()['1:0xA']).toBe(false)
    expect(getSelected()['10:0xB']).toBeUndefined()
  })

  it('owned section select all: second click clears only owned; trusted keys unchanged', () => {
    const trusted = [makeSafe('1', '0xA')] as AllSafeItems
    const owned = [makeSafe('10', '0xB')] as AllSafeItems

    render(<OnboardingSelectAllHarness trusted={trusted} owned={owned} />)

    fireEvent.click(screen.getByTestId('select-all-owned'))
    expect(getSelected()['10:0xB']).toBe(true)
    expect(getSelected()['1:0xA']).toBeUndefined()

    fireEvent.click(screen.getByTestId('select-all-owned'))
    expect(getSelected()['10:0xB']).toBe(false)
    expect(getSelected()['1:0xA']).toBeUndefined()
  })

  it('global deselect clears multichain parent and every sub-safe key', () => {
    const trusted = [makeMulti('0xC', ['1', '137'])] as AllSafeItems
    const owned: AllSafeItems = []

    render(
      <OnboardingSelectAllHarness
        key="multichain-preselected"
        trusted={trusted}
        owned={owned}
        initialSelected={{
          [`${MULTICHAIN_SAFE_KEY_PREFIX}0xC`]: true,
          '1:0xC': true,
          '137:0xC': true,
        }}
      />,
    )

    expect(globalCountText()).toContain('(2/2)')

    fireEvent.click(screen.getByTestId('select-all-global'))

    const selected = getSelected()
    expect(selected['1:0xC']).toBe(false)
    expect(selected['137:0xC']).toBe(false)
    expect(selected[`${MULTICHAIN_SAFE_KEY_PREFIX}0xC`]).toBe(false)
  })
})
