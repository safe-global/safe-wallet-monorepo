import { render, screen, waitFor } from '@/tests/test-utils'
import { CreateSafeOnNewChain } from './index'
import * as spacesModule from '@/features/spaces'
import * as spaceCreationModule from '../../hooks/useSafeCreationData'
import * as chainsModule from '@/hooks/useChains'
import { useCompatibleNetworks } from '@safe-global/utils/features/multichain/hooks/useCompatibleNetworks'
import { chainBuilder } from '@/tests/builders/chains'

jest.mock('@/features/spaces')
jest.mock('../../hooks/useSafeCreationData')
jest.mock('@safe-global/utils/features/multichain/hooks/useCompatibleNetworks')
jest.mock('@/hooks/useChains')
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpaceSafesCreateV1Mutation: jest.fn(() => [jest.fn()]),
  useSpacesGetV1Query: jest.fn(() => ({ currentData: undefined })),
}))

const mockChain = chainBuilder().with({ chainId: '1', chainName: 'Ethereum', shortName: 'eth' }).build()

const mockChain2 = chainBuilder().with({ chainId: '10', chainName: 'Optimism', shortName: 'oeth' }).build()

describe('CreateSafeOnNewChain', () => {
  const mockProps = {
    safeAddress: '0x1234567890123456789012345678901234567890',
    deployedChainIds: ['1'],
    open: true,
    onClose: jest.fn(),
    currentName: 'Test Safe',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(chainsModule.default as jest.Mock).mockReturnValue({
      configs: [mockChain, mockChain2],
    })
  })

  it('should render', () => {
    ;(spacesModule.useCurrentSpaceId as jest.Mock).mockReturnValue(undefined)
    ;(spacesModule.useIsAdmin as jest.Mock).mockReturnValue(false)
    ;(spaceCreationModule.useSafeCreationData as jest.Mock).mockReturnValue([null, null, false])
    ;(useCompatibleNetworks as jest.Mock).mockReturnValue([])

    render(<CreateSafeOnNewChain {...mockProps} />)

    // Dialog should be rendered
    expect(screen.getByText('Add another network')).toBeInTheDocument()
  })
})
