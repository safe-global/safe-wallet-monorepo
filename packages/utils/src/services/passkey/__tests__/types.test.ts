import { IdentityDeploymentError, UnsupportedChainError } from '../types'

describe('passkey errors', () => {
  describe('UnsupportedChainError', () => {
    it('captures chainId and cause', () => {
      const cause = new Error('missing deployment')
      const err = new UnsupportedChainError('999', cause)
      expect(err.name).toBe('UnsupportedChainError')
      expect(err.chainId).toBe('999')
      expect(err.message).toContain('999')
      expect((err as { cause?: unknown }).cause).toBe(cause)
    })

    it('works without a cause', () => {
      const err = new UnsupportedChainError('42')
      expect(err.chainId).toBe('42')
      expect((err as { cause?: unknown }).cause).toBeUndefined()
    })
  })

  describe('IdentityDeploymentError', () => {
    it('captures chainId, taskId, status, and message', () => {
      const err = new IdentityDeploymentError({
        chainId: '11155111',
        taskId: 'task-123',
        status: 500,
        message: 'reverted on-chain',
      })
      expect(err.name).toBe('IdentityDeploymentError')
      expect(err.chainId).toBe('11155111')
      expect(err.taskId).toBe('task-123')
      expect(err.status).toBe(500)
      expect(err.message).toBe('reverted on-chain')
    })

    it('omits status when not provided (timeout case)', () => {
      const err = new IdentityDeploymentError({
        chainId: '1',
        taskId: 't',
        message: 'timed out',
      })
      expect(err.status).toBeUndefined()
    })
  })
})
