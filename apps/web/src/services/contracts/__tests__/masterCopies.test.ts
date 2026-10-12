import type { MasterCopy as MasterCopyType } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { Errors, logError } from '@/services/exceptions'
import { MasterCopyDeployer, transformMasterCopies } from '../masterCopies'

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

describe('transformMasterCopies', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('tags Gnosis and Circles deployments', () => {
    expect(
      transformMasterCopies([
        { address: '0x1', version: '1.3.0' },
        { address: '0x2', version: 'circles-1.2.0' },
      ]),
    ).toEqual([
      {
        address: '0x1',
        version: '1.3.0',
        deployer: MasterCopyDeployer.GNOSIS,
        deployerRepoUrl: 'https://github.com/gnosis/safe-contracts/releases',
      },
      {
        address: '0x2',
        version: 'circles',
        deployer: MasterCopyDeployer.CIRCLES,
        deployerRepoUrl: 'https://github.com/CirclesUBI/safe-contracts/releases',
      },
    ])
    expect(logError).not.toHaveBeenCalled()
  })

  it('reports a payload it cannot interpret and returns nothing', () => {
    const malformed = [{ address: '0x1', version: null }] as unknown as MasterCopyType[]

    expect(transformMasterCopies(malformed)).toBeUndefined()
    expect(logError).toHaveBeenCalledWith(Errors._619, expect.any(TypeError))
  })
})
