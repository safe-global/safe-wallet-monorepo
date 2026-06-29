import { addressPoisoningSlice, dismissSimilarAddress, selectIsSimilarAddressDismissed } from '../addressPoisoningSlice'
import type { RootState } from '@/store'

const ACCOUNT = '0xAAaaAAaaAAaaAAaaAAaaAAaaAAaaAAaaAAaaAAaa'
const CANDIDATE = '0xBBbbBBbbBBbbBBbbBBbbBBbbBBbbBBbbBBbbBBbb'
const OTHER = '0xCCccCCccCCccCCccCCccCCccCCccCCccCCccCCcc'

const rootWith = (state: ReturnType<typeof addressPoisoningSlice.reducer>): RootState =>
  ({ [addressPoisoningSlice.name]: state }) as unknown as RootState

describe('addressPoisoningSlice', () => {
  it('records a dismissal scoped to the connected account (lowercased)', () => {
    const state = addressPoisoningSlice.reducer(
      undefined,
      dismissSimilarAddress({ account: ACCOUNT, candidate: CANDIDATE }),
    )
    expect(state.dismissedByAccount[ACCOUNT.toLowerCase()]).toContain(CANDIDATE.toLowerCase())
  })

  it('does not duplicate the same dismissal', () => {
    let state = addressPoisoningSlice.reducer(
      undefined,
      dismissSimilarAddress({ account: ACCOUNT, candidate: CANDIDATE }),
    )
    state = addressPoisoningSlice.reducer(state, dismissSimilarAddress({ account: ACCOUNT, candidate: CANDIDATE }))
    expect(state.dismissedByAccount[ACCOUNT.toLowerCase()]).toHaveLength(1)
  })

  it('reports dismissal via the selector, account-scoped and case-insensitive', () => {
    const state = addressPoisoningSlice.reducer(
      undefined,
      dismissSimilarAddress({ account: ACCOUNT, candidate: CANDIDATE }),
    )
    const root = rootWith(state)
    expect(selectIsSimilarAddressDismissed(root, ACCOUNT.toLowerCase(), CANDIDATE.toUpperCase())).toBe(true)
    // different account must not see another account's dismissals
    expect(selectIsSimilarAddressDismissed(root, OTHER, CANDIDATE)).toBe(false)
    // undismissed candidate
    expect(selectIsSimilarAddressDismissed(root, ACCOUNT, OTHER)).toBe(false)
  })
})
