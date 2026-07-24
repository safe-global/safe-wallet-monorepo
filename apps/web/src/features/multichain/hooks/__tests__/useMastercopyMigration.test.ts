import { renderHook } from '@/tests/test-utils'
import { useMastercopyMigration } from '../useMastercopyMigration'
import { ImplementationVersionState } from '@safe-global/store/gateway/types'
import { MasterCopyDeployer } from '@/hooks/useMasterCopies'
import type { BytecodeComparisonState } from '@/hooks/useBytecodeComparison'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useMasterCopies', () => ({
  ...jest.requireActual('@/hooks/useMasterCopies'),
  useMasterCopies: jest.fn(),
}))
jest.mock('@/hooks/useChains')
jest.mock('@/hooks/useBytecodeComparison')

const mockUseSafeInfo = jest.requireMock('@/hooks/useSafeInfo').default as jest.Mock
const mockUseMasterCopies = jest.requireMock('@/hooks/useMasterCopies').useMasterCopies as jest.Mock
const mockUseCurrentChain = jest.requireMock('@/hooks/useChains').useCurrentChain as jest.Mock
const mockUseBytecodeComparison = jest.requireMock('@/hooks/useBytecodeComparison').useBytecodeComparison as jest.Mock

const OFFICIAL_L1_130 = '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552'
const OFFICIAL_L1_141 = '0x41675C099F32341bf84BFc5382aF534df5C7461a'
const OFFICIAL_L2_130 = '0x3E5c63644E683549055b9Be8653de26E0B4CD36E'
const UNOFFICIAL = '0x000000000000000000000000000000000000dEaD'

const GNOSIS_REPO = 'https://github.com/gnosis/safe-contracts/releases'
const CIRCLES_REPO = 'https://github.com/CirclesUBI/safe-contracts/releases'

const gnosisMasterCopy = (address: string, version: string) => ({
  address,
  version,
  deployer: MasterCopyDeployer.GNOSIS,
  deployerRepoUrl: GNOSIS_REPO,
})

const circlesMasterCopy = (address: string, version: string) => ({
  address,
  version,
  deployer: MasterCopyDeployer.CIRCLES,
  deployerRepoUrl: CIRCLES_REPO,
})

type Safe = {
  implementationVersionState: ImplementationVersionState
  version: string
  chainId: string
  implementation: { value: string }
}

const setup = (
  safe: Safe,
  masterCopies: ReturnType<typeof gnosisMasterCopy>[] = [],
  bytecode: BytecodeComparisonState = { result: undefined, isLoading: false },
) => {
  mockUseSafeInfo.mockReturnValue({ safe })
  mockUseMasterCopies.mockReturnValue([masterCopies, undefined, false])
  mockUseCurrentChain.mockReturnValue({ chainId: safe.chainId, recommendedMasterCopyVersion: '1.4.1' })
  mockUseBytecodeComparison.mockReturnValue(bytecode)
}

describe('useMastercopyMigration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('reports no action for an up-to-date Safe', () => {
    setup(
      {
        implementationVersionState: ImplementationVersionState.UP_TO_DATE,
        version: '1.4.1',
        chainId: '1',
        implementation: { value: OFFICIAL_L1_141 },
      },
      [gnosisMasterCopy(OFFICIAL_L1_141, '1.4.1')],
    )

    const { result } = renderHook(() => useMastercopyMigration())

    expect(result.current).toMatchObject({
      state: ImplementationVersionState.UP_TO_DATE,
      action: 'none',
      isCritical: false,
      isOfficialDeployer: true,
      isSupportedVersion: true,
      latestVersion: '1.4.1',
      changelogUrl: GNOSIS_REPO,
      isBytecodeLoading: false,
    })
  })

  it('reports a critical official update for an outdated Gnosis Safe', () => {
    setup(
      {
        implementationVersionState: ImplementationVersionState.OUTDATED,
        version: '1.1.1',
        chainId: '1',
        implementation: { value: OFFICIAL_L1_130 },
      },
      [gnosisMasterCopy(OFFICIAL_L1_130, '1.1.1')],
    )

    const { result } = renderHook(() => useMastercopyMigration())

    expect(result.current).toMatchObject({
      action: 'update',
      isCritical: true,
      isOfficialDeployer: true,
      isSupportedVersion: true,
    })
  })

  it('reports a non-critical, non-official update for an outdated Circles Safe', () => {
    setup(
      {
        implementationVersionState: ImplementationVersionState.OUTDATED,
        version: '1.3.0',
        chainId: '1',
        implementation: { value: OFFICIAL_L2_130 },
      },
      [circlesMasterCopy(OFFICIAL_L2_130, '1.3.0')],
    )

    const { result } = renderHook(() => useMastercopyMigration())

    expect(result.current).toMatchObject({
      action: 'update',
      isCritical: false,
      isOfficialDeployer: false,
      changelogUrl: CIRCLES_REPO,
    })
  })

  it('reports a non-critical official update for an outdated 1.3.0 Gnosis Safe', () => {
    setup(
      {
        implementationVersionState: ImplementationVersionState.OUTDATED,
        version: '1.3.0',
        chainId: '1',
        implementation: { value: OFFICIAL_L1_130 },
      },
      [gnosisMasterCopy(OFFICIAL_L1_130, '1.3.0')],
    )

    const { result } = renderHook(() => useMastercopyMigration())

    expect(result.current).toMatchObject({
      action: 'update',
      isCritical: false,
      isOfficialDeployer: true,
    })
  })

  it('reports a migrate action for an unknown Safe on an official singleton', () => {
    setup({
      implementationVersionState: ImplementationVersionState.UNKNOWN,
      version: '1.3.0',
      chainId: '1',
      implementation: { value: OFFICIAL_L2_130 },
    })

    const { result } = renderHook(() => useMastercopyMigration())

    expect(result.current).toMatchObject({
      state: ImplementationVersionState.UNKNOWN,
      action: 'migrate',
      isOfficialDeployer: false,
      isSupportedVersion: true,
    })
  })

  it('reports a cli action for an unknown third-party fork', () => {
    setup(
      {
        implementationVersionState: ImplementationVersionState.UNKNOWN,
        version: '1.3.0',
        chainId: '1',
        implementation: { value: UNOFFICIAL },
      },
      [],
      { result: { isMatch: false }, isLoading: false },
    )

    const { result } = renderHook(() => useMastercopyMigration())

    expect(result.current).toMatchObject({
      action: 'cli',
      isOfficialDeployer: false,
    })
  })

  it('never reports bytecode loading for a valid (outdated) mastercopy', () => {
    setup(
      {
        implementationVersionState: ImplementationVersionState.OUTDATED,
        version: '1.1.1',
        chainId: '1',
        implementation: { value: OFFICIAL_L1_130 },
      },
      [gnosisMasterCopy(OFFICIAL_L1_130, '1.1.1')],
      { result: undefined, isLoading: true },
    )

    const { result } = renderHook(() => useMastercopyMigration())

    expect(result.current.isBytecodeLoading).toBe(false)
  })

  it('surfaces the bytecode loading state', () => {
    setup(
      {
        implementationVersionState: ImplementationVersionState.UNKNOWN,
        version: '1.3.0',
        chainId: '1',
        implementation: { value: OFFICIAL_L2_130 },
      },
      [],
      { result: undefined, isLoading: true },
    )

    const { result } = renderHook(() => useMastercopyMigration())

    expect(result.current.isBytecodeLoading).toBe(true)
  })
})
