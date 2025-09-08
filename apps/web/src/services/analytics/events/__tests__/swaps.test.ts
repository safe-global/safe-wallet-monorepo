import { SWAP_EVENTS, SWAP_LABELS } from '../swaps'

describe('Swap Events', () => {
  describe('SWAP_EVENTS', () => {
    it('should contain OPEN_SWAPS event', () => {
      expect(SWAP_EVENTS.OPEN_SWAPS).toEqual({
        action: 'Open swaps',
        category: 'swap',
      })
    })

    it('should have consistent structure', () => {
      Object.values(SWAP_EVENTS).forEach((event) => {
        expect(event).toHaveProperty('action')
        expect(event).toHaveProperty('category')
        expect(typeof event.action).toBe('string')
        expect(typeof event.category).toBe('string')
      })
    })
  })

  describe('SWAP_LABELS', () => {
    it('should contain newTransaction label', () => {
      expect(SWAP_LABELS.newTransaction).toBe('newTransaction')
    })

    it('should contain all expected labels', () => {
      const expectedLabels = [
        'dashboard',
        'sidebar',
        'asset',
        'dashboard_assets',
        'promoWidget',
        'safeAppsPromoWidget',
        'newTransaction',
      ]

      expectedLabels.forEach((labelKey) => {
        expect(SWAP_LABELS[labelKey as keyof typeof SWAP_LABELS]).toBeDefined()
        expect(typeof SWAP_LABELS[labelKey as keyof typeof SWAP_LABELS]).toBe('string')
      })
    })

    it('should have consistent naming convention', () => {
      Object.values(SWAP_LABELS).forEach((label) => {
        expect(typeof label).toBe('string')
        // Labels should be camelCase or lowercase
        expect(label).not.toMatch(/\s/)
      })
    })
  })
})
