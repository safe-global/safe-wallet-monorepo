import { render, screen, fireEvent } from '@/tests/test-utils'
import { FormProvider, useForm } from 'react-hook-form'
import type { AllSafeItems, MultiChainSafeItem, SafeItem } from '@/hooks/safes'
import SelectAllToggle from '@/features/spaces/components/SelectAllToggle/SelectAllToggle'
import { useSelectAll } from '@/features/spaces/hooks/useSelectAll'
import type { AddAccountsFormValues } from '@/features/spaces/hooks/useSelectAll.types'
import { MULTICHAIN_SAFE_KEY_PREFIX } from '../constants'

jest.mock('@/features/spaces/components/Sidebar/constants', () => ({
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

  const { trustedSelection, ownedSelection, handleSelectAll } = useSelectAll({
    visibleTrusted: trusted,
    visibleOwned: owned,
    control,
    setValue,
  })

  return (
    <FormProvider {...formMethods}>
      <div className="flex flex-col gap-2">
        <SelectAllToggle
          state={trustedSelection.state}
          count={trustedSelection.selectedCount}
          total={trustedSelection.total}
          onToggle={(check) => handleSelectAll('trusted', check)}
          disabled={trustedSelection.disabled}
          label="Select all"
          showCount
          testId="select-all-trusted"
        />
        <SelectAllToggle
          state={ownedSelection.state}
          count={ownedSelection.selectedCount}
          total={ownedSelection.total}
          onToggle={(check) => handleSelectAll('owned', check)}
          disabled={ownedSelection.disabled}
          label="Select all"
          showCount
          testId="select-all-owned"
        />
      </div>
    </FormProvider>
  )
}

const trustedCountText = () => screen.getByTestId('select-all-trusted').parentElement?.textContent ?? ''
const ownedCountText = () => screen.getByTestId('select-all-owned').parentElement?.textContent ?? ''

describe('SelectSafesOnboarding — select-all form behavior (mirrors screen wiring)', () => {
  beforeEach(() => {
    getSelectedSafesRef.current = undefined
  })

  const getSelected = () => getSelectedSafesRef.current?.() ?? {}

  it('select all sections: toggling trusted then owned selects everything, second toggle clears each section', () => {
    const trusted = [makeSafe('1', '0xA')] as AllSafeItems
    const owned = [makeSafe('10', '0xB')] as AllSafeItems

    render(<OnboardingSelectAllHarness trusted={trusted} owned={owned} />)

    expect(trustedCountText()).toContain('(0/1)')
    expect(ownedCountText()).toContain('(0/1)')

    fireEvent.click(screen.getByTestId('select-all-trusted'))
    fireEvent.click(screen.getByTestId('select-all-owned'))
    expect(trustedCountText()).toContain('(1/1)')
    expect(ownedCountText()).toContain('(1/1)')

    fireEvent.click(screen.getByTestId('select-all-trusted'))
    fireEvent.click(screen.getByTestId('select-all-owned'))

    const selected = getSelected()
    expect(selected['1:0xA']).toBe(false)
    expect(selected['10:0xB']).toBe(false)
  })

  it('clearing both sections when everything is pre-selected deselects all', () => {
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

    expect(trustedCountText()).toContain('(1/1)')
    expect(ownedCountText()).toContain('(1/1)')

    fireEvent.click(screen.getByTestId('select-all-trusted'))
    fireEvent.click(screen.getByTestId('select-all-owned'))

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

  it('disables an empty section toggle when the cap is reached via another section', () => {
    const trustedSafes = Array.from({ length: 10 }, (_, i) => makeSafe('1', `0x${i}`))
    const trusted = trustedSafes as AllSafeItems
    const owned = [makeSafe('10', '0xB')] as AllSafeItems
    const initialSelected = Object.fromEntries(trustedSafes.map((s) => [`${s.chainId}:${s.address}`, true]))

    render(<OnboardingSelectAllHarness trusted={trusted} owned={owned} initialSelected={initialSelected} />)

    expect(screen.getByTestId('select-all-owned')).toBeDisabled()
    expect(screen.getByTestId('select-all-trusted')).not.toBeDisabled()

    fireEvent.click(screen.getByTestId('select-all-owned'))
    expect(getSelected()['10:0xB']).toBeUndefined()
  })

  it('owned section over the cap: first click selects up to the limit, second click deselects', () => {
    const owned = Array.from({ length: 12 }, (_, i) => makeSafe('10', `0x${i}`)) as AllSafeItems
    const trusted: AllSafeItems = []

    render(<OnboardingSelectAllHarness trusted={trusted} owned={owned} />)

    fireEvent.click(screen.getByTestId('select-all-owned'))

    const afterSelect = getSelected()
    const selectedCount = Object.values(afterSelect).filter(Boolean).length
    expect(selectedCount).toBe(10)
    expect(ownedCountText()).toContain('(10/12)')

    fireEvent.click(screen.getByTestId('select-all-owned'))

    const afterDeselect = getSelected()
    expect(Object.values(afterDeselect).filter(Boolean)).toHaveLength(0)
  })

  it('owned section at the cap renders the toggle as checked, not indeterminate', () => {
    const owned = Array.from({ length: 12 }, (_, i) => makeSafe('10', `0x${i}`)) as AllSafeItems
    const trusted: AllSafeItems = []

    render(<OnboardingSelectAllHarness trusted={trusted} owned={owned} />)

    fireEvent.click(screen.getByTestId('select-all-owned'))

    expect(screen.getByTestId('select-all-owned')).toHaveAttribute('aria-checked', 'true')
  })

  it('owned section below the cap with one selected: clicking select-all selects up to the cap, does not clear', () => {
    const owned = Array.from({ length: 12 }, (_, i) => makeSafe('10', `0x${i}`)) as AllSafeItems
    const trusted: AllSafeItems = []

    render(
      <OnboardingSelectAllHarness
        key="one-preselected"
        trusted={trusted}
        owned={owned}
        initialSelected={{ '10:0x0': true }}
      />,
    )

    expect(ownedCountText()).toContain('(1/12)')
    expect(screen.getByTestId('select-all-owned')).toHaveAttribute('aria-checked', 'mixed')

    fireEvent.click(screen.getByTestId('select-all-owned'))

    expect(Object.values(getSelected()).filter(Boolean)).toHaveLength(10)
  })

  it('split across sections at the cap: both sections render checked once the global limit is hit', () => {
    const trusted = Array.from({ length: 6 }, (_, i) => makeSafe('1', `0xA${i}`)) as AllSafeItems
    const owned = Array.from({ length: 8 }, (_, i) => makeSafe('10', `0xB${i}`)) as AllSafeItems

    render(<OnboardingSelectAllHarness trusted={trusted} owned={owned} />)

    fireEvent.click(screen.getByTestId('select-all-trusted'))
    fireEvent.click(screen.getByTestId('select-all-owned'))

    expect(Object.values(getSelected()).filter(Boolean)).toHaveLength(10)
    expect(screen.getByTestId('select-all-trusted')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByTestId('select-all-owned')).toHaveAttribute('aria-checked', 'true')
  })

  it('trusted deselect clears multichain parent and every sub-safe key', () => {
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

    expect(trustedCountText()).toContain('(2/2)')

    fireEvent.click(screen.getByTestId('select-all-trusted'))

    const selected = getSelected()
    expect(selected['1:0xC']).toBe(false)
    expect(selected['137:0xC']).toBe(false)
    expect(selected[`${MULTICHAIN_SAFE_KEY_PREFIX}0xC`]).toBe(false)
  })
})
