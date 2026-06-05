import { renderHook, waitFor } from '@/tests/test-utils'
import { useVulnerableSafe } from '../useVulnerableModules'
import * as service from '../../services/vulnerableModules'

const mockUseSafeInfo = jest.fn()
jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => mockUseSafeInfo(),
}))

const SAFE = '0x1111111111111111111111111111111111111111'
const MODULE = '0x2222222222222222222222222222222222222222'

const setSafe = ({ modules = [], deployed = true }: { modules?: Array<{ value: string }>; deployed?: boolean } = {}) =>
  mockUseSafeInfo.mockReturnValue({
    safe: { chainId: '1', modules, deployed },
    safeAddress: SAFE,
  })

beforeEach(() => {
  jest.restoreAllMocks()
})

describe('useVulnerableSafe', () => {
  it('returns true when the security check reports the Safe as affected', async () => {
    setSafe({ modules: [{ value: MODULE }] })
    const spy = jest.spyOn(service, 'isSafeAffectedByZodiacVulnerability').mockResolvedValue(true)

    const { result } = renderHook(() => useVulnerableSafe())

    await waitFor(() => expect(result.current).toBe(true))
    expect(spy).toHaveBeenCalledWith('1', SAFE)
  })

  it('still checks a Safe with no modules (it may be a member/signer of another Safe)', async () => {
    setSafe({ modules: [] })
    const spy = jest.spyOn(service, 'isSafeAffectedByZodiacVulnerability').mockResolvedValue(true)

    const { result } = renderHook(() => useVulnerableSafe())

    await waitFor(() => expect(result.current).toBe(true))
    expect(spy).toHaveBeenCalledWith('1', SAFE)
  })

  it('does not check an undeployed (counterfactual) Safe', async () => {
    setSafe({ deployed: false })
    const spy = jest.spyOn(service, 'isSafeAffectedByZodiacVulnerability')

    const { result } = renderHook(() => useVulnerableSafe())

    expect(result.current).toBe(false)
    expect(spy).not.toHaveBeenCalled()
  })

  it('returns false when the security check reports the Safe as safe', async () => {
    setSafe({ modules: [{ value: MODULE }] })
    jest.spyOn(service, 'isSafeAffectedByZodiacVulnerability').mockResolvedValue(false)

    const { result } = renderHook(() => useVulnerableSafe())

    await waitFor(() => expect(result.current).toBe(false))
  })

  it('returns false when the security check rejects', async () => {
    setSafe({ modules: [{ value: MODULE }] })
    jest.spyOn(service, 'isSafeAffectedByZodiacVulnerability').mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useVulnerableSafe())

    await waitFor(() => expect(result.current).toBe(false))
  })
})
