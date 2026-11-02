import { act, renderHook } from '@testing-library/react'
import type { Policy } from '@safe-global/views/features/spaces/components/Policies/types'
import { asActivePolicy, mockSpendingLimitPolicy } from '../../mocks/policies'
import { mockActiveAllowlist, mockUnenforcedAllowlist } from '../../mocks/allowlistPolicies'
import { useNewAllowlistIds } from '../useNewAllowlistIds'

type Props = { policies: Policy[]; isSettled: boolean }

const TREASURY = mockActiveAllowlist()
const OTHER = mockUnenforcedAllowlist()

const setup = (initialProps: Props) =>
  renderHook(({ policies, isSettled }: Props) => useNewAllowlistIds(policies, isSettled), { initialProps })

describe('useNewAllowlistIds', () => {
  it('treats the allowlists of the first settled list as already there', () => {
    const { result } = setup({ policies: [TREASURY], isSettled: true })

    expect(result.current.newIds.size).toBe(0)
  })

  it('reports an allowlist that turns up in a later list', () => {
    const { result, rerender } = setup({ policies: [TREASURY], isSettled: true })

    rerender({ policies: [TREASURY, OTHER], isSettled: true })

    expect([...result.current.newIds]).toEqual([OTHER.id])
  })

  it('ignores other policy types that turn up', () => {
    const { result, rerender } = setup({ policies: [TREASURY], isSettled: true })

    rerender({ policies: [TREASURY, asActivePolicy(mockSpendingLimitPolicy())], isSettled: true })

    expect(result.current.newIds.size).toBe(0)
  })

  it('reads the first list after a load as already there, so a Space switch reports nothing', () => {
    const { result, rerender } = setup({ policies: [], isSettled: true })

    rerender({ policies: [], isSettled: false })
    rerender({ policies: [TREASURY], isSettled: true })

    expect(result.current.newIds.size).toBe(0)
  })

  it('forgets reported allowlists while the list reloads', () => {
    const { result, rerender } = setup({ policies: [], isSettled: true })
    rerender({ policies: [TREASURY], isSettled: true })

    rerender({ policies: [TREASURY], isSettled: false })

    expect(result.current.newIds.size).toBe(0)
  })

  it('drops an allowlist once dismissed', () => {
    const { result, rerender } = setup({ policies: [], isSettled: true })
    rerender({ policies: [TREASURY, OTHER], isSettled: true })

    act(() => result.current.dismiss(TREASURY.id))

    expect([...result.current.newIds]).toEqual([OTHER.id])
  })
})
