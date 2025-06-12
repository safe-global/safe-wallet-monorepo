import { createAddressCopyEvent } from '../copy'
import { EventType } from '../../types'

describe('Copy Analytics Events', () => {
  describe('createAddressCopyEvent', () => {
    it('should create correct event structure with pathname', () => {
      const pathname = '/(tabs)/index'
      const event = createAddressCopyEvent(pathname)

      expect(event).toEqual({
        eventName: EventType.META,
        eventCategory: 'copy',
        eventAction: 'Address copied',
        eventLabel: pathname,
      })
    })

    it('should handle different pathnames', () => {
      const pathnames = ['/signers', '/accounts-sheet', '/confirm-transaction']

      pathnames.forEach((pathname) => {
        const event = createAddressCopyEvent(pathname)
        expect(event.eventLabel).toBe(pathname)
        expect(event.eventName).toBe(EventType.META)
        expect(event.eventCategory).toBe('copy')
        expect(event.eventAction).toBe('Address copied')
      })
    })

    it('should handle dynamic routes', () => {
      const dynamicPath = '/transactions/123'
      const event = createAddressCopyEvent(dynamicPath)

      expect(event.eventLabel).toBe(dynamicPath)
      expect(event.eventName).toBe(EventType.META)
    })
  })
})
