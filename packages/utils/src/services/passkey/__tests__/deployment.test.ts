import { awaitDeployment } from '../deployment'
import { IdentityDeploymentError } from '../types'
import { RelayStatus, RelayTxWatcher, TIMEOUT_ERROR_CODE } from '../../RelayTxWatcher'

describe('awaitDeployment', () => {
  let watchSpy: jest.SpyInstance

  afterEach(() => {
    watchSpy?.mockRestore()
  })

  it('resolves with the transaction hash when relay task is Included', async () => {
    watchSpy = jest.spyOn(RelayTxWatcher.prototype, 'watchTaskId').mockResolvedValue({
      status: RelayStatus.Included,
      receipt: { transactionHash: '0xabc' },
    })

    const result = await awaitDeployment({ cgwBaseUrl: 'http://x', chainId: '1', taskId: 't' })
    expect(result).toEqual({ transactionHash: '0xabc' })
  })

  it('throws IdentityDeploymentError when watcher rejects on revert', async () => {
    watchSpy = jest
      .spyOn(RelayTxWatcher.prototype, 'watchTaskId')
      .mockRejectedValue(new Error('Relay transaction reverted on-chain'))

    await expect(awaitDeployment({ cgwBaseUrl: 'http://x', chainId: '1', taskId: 't' })).rejects.toBeInstanceOf(
      IdentityDeploymentError,
    )
  })

  it('annotates timeouts in the error message', async () => {
    watchSpy = jest
      .spyOn(RelayTxWatcher.prototype, 'watchTaskId')
      .mockRejectedValue(new Error('Relay transaction timeout', { cause: TIMEOUT_ERROR_CODE }))

    await expect(awaitDeployment({ cgwBaseUrl: 'http://x', chainId: '1', taskId: 't' })).rejects.toMatchObject({
      name: 'IdentityDeploymentError',
      message: expect.stringContaining('timed out'),
    })
  })

  it('throws IdentityDeploymentError when receipt is missing despite Included status', async () => {
    watchSpy = jest.spyOn(RelayTxWatcher.prototype, 'watchTaskId').mockResolvedValue({
      status: RelayStatus.Included,
    })

    await expect(awaitDeployment({ cgwBaseUrl: 'http://x', chainId: '1', taskId: 't' })).rejects.toMatchObject({
      name: 'IdentityDeploymentError',
      status: RelayStatus.Included,
    })
  })
})
