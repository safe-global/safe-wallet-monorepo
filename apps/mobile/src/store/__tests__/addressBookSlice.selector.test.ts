import { selectTotalContactCount } from '../addressBookSlice'
import { RootState } from '../index'

describe('addressBookSlice selectors', () => {
  describe('selectTotalContactCount', () => {
    it('should return 0 when no contacts exist', () => {
      const state = {
        addressBook: {
          contacts: {},
          selectedContact: null,
        },
      } as unknown as RootState

      const result = selectTotalContactCount(state)
      expect(result).toBe(0)
    })

    it('should return correct count when contacts exist', () => {
      const state = {
        addressBook: {
          contacts: {
            '0x1': { value: '0x1', name: 'Alice', chainIds: ['1'] },
            '0x2': { value: '0x2', name: 'Bob', chainIds: ['137'] },
            '0x3': { value: '0x3', name: 'Charlie', chainIds: ['1', '137'] },
          },
          selectedContact: null,
        },
      } as unknown as RootState

      const result = selectTotalContactCount(state)
      expect(result).toBe(3)
    })

    it('should return 1 when only one contact exists', () => {
      const state = {
        addressBook: {
          contacts: {
            '0x1': { value: '0x1', name: 'Alice', chainIds: ['1'] },
          },
          selectedContact: null,
        },
      } as unknown as RootState

      const result = selectTotalContactCount(state)
      expect(result).toBe(1)
    })

    it('should handle large number of contacts', () => {
      const contacts: Record<string, { value: string; name: string; chainIds: string[] }> = {}
      for (let i = 0; i < 100; i++) {
        contacts[`0x${i}`] = { value: `0x${i}`, name: `Contact ${i}`, chainIds: ['1'] }
      }

      const state = {
        addressBook: {
          contacts,
          selectedContact: null,
        },
      } as unknown as RootState

      const result = selectTotalContactCount(state)
      expect(result).toBe(100)
    })
  })
})
