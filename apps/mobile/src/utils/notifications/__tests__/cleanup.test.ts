import { classifyNotificationError, createSubscriptionData } from '../cleanup'

describe('notification cleanup utilities', () => {
  describe('classifyNotificationError', () => {
    it('should classify 404 errors as safe', () => {
      const error = { status: 404, message: 'Not found' }
      const result = classifyNotificationError(error)

      expect(result.type).toBe('safe')
      expect(result.message).toBe('Subscription already removed')
    })

    it('should classify server errors as blocking', () => {
      const error = { status: 500, message: 'Internal server error' }
      const result = classifyNotificationError(error)

      expect(result.type).toBe('blocking')
      expect(result.message).toContain('Server error (500)')
    })

    it('should classify rate limiting as blocking', () => {
      const error = { status: 429, message: 'Too many requests' }
      const result = classifyNotificationError(error)

      expect(result.type).toBe('blocking')
      expect(result.message).toContain('Rate limited')
    })

    it('should classify network errors as blocking', () => {
      const error = new Error('Network timeout')
      const result = classifyNotificationError(error)

      expect(result.type).toBe('blocking')
      expect(result.message).toBe('Network error: Cannot verify subscription removal')
    })
  })

  describe('createSubscriptionData', () => {
    it('should create subscription data without delegate address', async () => {
      const result = await createSubscriptionData('0xSafe1', ['1', '137'], 'device123')

      expect(result).toEqual([
        {
          chainId: '1',
          deviceUuid: 'device123',
          safeAddress: '0xSafe1',
        },
        {
          chainId: '137',
          deviceUuid: 'device123',
          safeAddress: '0xSafe1',
        },
      ])
    })

    it('should create subscription data with delegate address', async () => {
      const result = await createSubscriptionData('0xSafe1', ['1'], 'device123', '0xDelegate1')

      expect(result).toEqual([
        {
          chainId: '1',
          deviceUuid: 'device123',
          safeAddress: '0xSafe1',
          signerAddress: '0xDelegate1',
        },
      ])
    })

    it('should handle multiple chains with delegate', async () => {
      const result = await createSubscriptionData('0xSafe1', ['1', '137', '10'], 'device123', '0xDelegate1')

      expect(result).toHaveLength(3)
      expect(result.every((item) => item.signerAddress === '0xDelegate1')).toBe(true)
      expect(result.map((item) => item.chainId)).toEqual(['1', '137', '10'])
    })
  })
})
