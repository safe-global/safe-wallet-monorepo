import { renderHook } from '@/tests/test-utils'
import { useRecipientAnalysisWithPoisoning } from '../useRecipientAnalysisWithPoisoning'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { getAddressPoisoningResult, mapVisibleAnalysisResults } from '@safe-global/utils/features/safe-shield/utils'
import {
  RecipientStatus,
  Severity,
  StatusGroup,
  type RecipientAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'

const mockUseHasFeature = jest.fn()
jest.mock('@/hooks/useChains', () => ({
  useHasFeature: () => mockUseHasFeature(),
}))

// Trusted anchor (Alice) + a both-ends look-alike, a suffix-only look-alike, and a clean address.
const ANCHOR = checksumAddress('0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678')
const BOTH_ENDS = checksumAddress('0xa1b2ffffffffffffffffffffffffffffffff5678')
const SUFFIX_ONLY = checksumAddress('0x9999888877776666555544443333222211115678')
const CLEAN = checksumAddress('0xdeadbeef00000000000000000000000000cafe01')

const CHAIN_ID = '11155111'
const initialReduxState = {
  addressBook: { [CHAIN_ID]: { [ANCHOR]: 'Alice' } },
} as never

const interactionResult = {
  severity: Severity.INFO,
  type: RecipientStatus.NEW_RECIPIENT,
  title: 'New recipient',
  description: 'First interaction.',
} as const

const buildData = (): RecipientAnalysisResults => ({
  [BOTH_ENDS]: { [StatusGroup.RECIPIENT_INTERACTION]: [interactionResult] },
  [CLEAN]: { [StatusGroup.RECIPIENT_INTERACTION]: [interactionResult] },
})

const renderOverlay = (recipient: AsyncResult<RecipientAnalysisResults>) =>
  renderHook(() => useRecipientAnalysisWithPoisoning(recipient), { initialReduxState })

describe('useRecipientAnalysisWithPoisoning', () => {
  beforeEach(() => {
    mockUseHasFeature.mockReturnValue(true)
  })

  it('adds an ADDRESS_POISONING group to a look-alike recipient, resolving the anchor name', () => {
    const data = buildData()
    const { result } = renderOverlay([data, undefined, false])
    const [overlaid] = result.current

    expect(overlaid?.[BOTH_ENDS]?.[StatusGroup.ADDRESS_POISONING]).toEqual([
      getAddressPoisoningResult({
        address: BOTH_ENDS,
        anchor: ANCHOR.toLowerCase(),
        anchorName: 'Alice',
      }),
    ])
    // the CRITICAL poisoning copy is intact
    expect(overlaid?.[BOTH_ENDS]?.[StatusGroup.ADDRESS_POISONING]?.[0].title).toBe('Potential address poisoning')
    // existing groups are preserved
    expect(overlaid?.[BOTH_ENDS]?.[StatusGroup.RECIPIENT_INTERACTION]).toEqual([interactionResult])
  })

  it('leaves clean recipients untouched and never flags the anchor itself', () => {
    const data: RecipientAnalysisResults = {
      ...buildData(),
      [ANCHOR]: { [StatusGroup.RECIPIENT_INTERACTION]: [interactionResult] },
    }
    const { result } = renderOverlay([data, undefined, false])
    const [overlaid] = result.current

    expect(overlaid?.[CLEAN]?.[StatusGroup.ADDRESS_POISONING]).toBeUndefined()
    expect(overlaid?.[ANCHOR]?.[StatusGroup.ADDRESS_POISONING]).toBeUndefined()
  })

  it('returns the same reference when nothing matches', () => {
    const data: RecipientAnalysisResults = { [CLEAN]: { [StatusGroup.RECIPIENT_INTERACTION]: [interactionResult] } }
    const { result } = renderOverlay([data, undefined, false])

    expect(result.current[0]).toBe(data)
  })

  it('is a no-op when the feature flag is off', () => {
    mockUseHasFeature.mockReturnValue(false)
    const data = buildData()
    const { result } = renderOverlay([data, undefined, false])

    expect(result.current[0]).toBe(data)
  })

  it('passes error and loading through untouched', () => {
    const error = new Error('boom')
    const { result } = renderOverlay([undefined, error, true])

    expect(result.current).toEqual([undefined, error, true])
  })

  it('renders the poisoning warning before a lower-severity LOW_ACTIVITY', () => {
    const lowActivity = {
      severity: Severity.WARN,
      type: RecipientStatus.LOW_ACTIVITY,
      title: 'Low activity recipient',
      description: 'This address has few transactions.',
    } as const
    const data: RecipientAnalysisResults = {
      [SUFFIX_ONLY]: {
        [StatusGroup.RECIPIENT_ACTIVITY]: [lowActivity],
        [StatusGroup.RECIPIENT_INTERACTION]: [interactionResult],
      },
    }
    const { result } = renderOverlay([data, undefined, false])
    const [overlaid] = result.current

    // The card colors/titles only the FIRST visible result; the CRITICAL poisoning group is
    // inserted first and outranks the WARN activity group.
    const visible = mapVisibleAnalysisResults(overlaid ?? {})
    expect(visible[0].type).toBe(RecipientStatus.RESEMBLES_TRUSTED_ADDRESS)
    expect(visible[1].type).toBe(RecipientStatus.LOW_ACTIVITY)
  })

  describe('poisoning-only addresses (flows without recipient analysis)', () => {
    it('creates a poisoning-only entry for a matched extra address, even without backend data', () => {
      const { result } = renderHook(
        () => useRecipientAnalysisWithPoisoning([undefined, undefined, false], [BOTH_ENDS]),
        {
          initialReduxState,
        },
      )
      const [overlaid] = result.current

      expect(overlaid?.[BOTH_ENDS]).toEqual({
        [StatusGroup.ADDRESS_POISONING]: [
          getAddressPoisoningResult({
            address: BOTH_ENDS,
            anchor: ANCHOR.toLowerCase(),
            anchorName: 'Alice',
          }),
        ],
      })
    })

    it('ignores partially-typed (invalid) extra addresses', () => {
      const { result } = renderHook(
        () => useRecipientAnalysisWithPoisoning([undefined, undefined, false], ['0xa1b2', BOTH_ENDS.slice(0, 20)]),
        { initialReduxState },
      )

      expect(result.current[0]).toBeUndefined()
    })

    it('stays empty when extra addresses are clean or anchors themselves', () => {
      const { result } = renderHook(
        () => useRecipientAnalysisWithPoisoning([undefined, undefined, false], [CLEAN, ANCHOR]),
        {
          initialReduxState,
        },
      )

      expect(result.current[0]).toBeUndefined()
    })

    it('does not duplicate an entry already covered by the analysis data', () => {
      const data = buildData()
      const { result } = renderHook(() => useRecipientAnalysisWithPoisoning([data, undefined, false], [BOTH_ENDS]), {
        initialReduxState,
      })
      const [overlaid] = result.current

      expect(overlaid?.[BOTH_ENDS]?.[StatusGroup.ADDRESS_POISONING]).toHaveLength(1)
      expect(overlaid?.[BOTH_ENDS]?.[StatusGroup.RECIPIENT_INTERACTION]).toEqual([interactionResult])
    })
  })
})
