import { AddressBookTrackingStrategy } from '../AddressBookTrackingStrategy'
import { trackEvent } from '@/src/services/analytics'
import { selectTotalContactCount } from '@/src/store/addressBookSlice'
import { RootState } from '@/src/store'

jest.mock('@/src/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/src/store/addressBookSlice', () => ({
  selectTotalContactCount: jest.fn(),
}))

const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>
const mockSelectTotalContactCount = selectTotalContactCount as jest.MockedFunction<typeof selectTotalContactCount>

describe('AddressBookTrackingStrategy', () => {
  let strategy: AddressBookTrackingStrategy
  let mockStore: { getState: jest.Mock; dispatch: jest.Mock }
  let mockState: RootState

  beforeEach(() => {
    strategy = new AddressBookTrackingStrategy()
    mockState = {
      addressBook: {
        contacts: {
          '0x1': { value: '0x1', name: 'Alice', chainIds: ['1'] },
          '0x2': { value: '0x2', name: 'Bob', chainIds: ['1'] },
        },
        selectedContact: null,
      },
    } as unknown as RootState

    mockStore = {
      getState: jest.fn().mockReturnValue(mockState),
      dispatch: jest.fn(),
    }

    jest.clearAllMocks()
    mockSelectTotalContactCount.mockReturnValue(2)
    mockTrackEvent.mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should track contact added event', () => {
    const action = { type: 'addressBook/addContact', payload: { value: '0x3', name: 'Charlie', chainIds: ['1'] } }

    strategy.execute(mockStore, action)

    expect(mockSelectTotalContactCount).toHaveBeenCalledWith(mockState)
    expect(mockTrackEvent).toHaveBeenCalled()
  })

  it('should track contact edited event', () => {
    const action = {
      type: 'addressBook/updateContact',
      payload: { value: '0x1', name: 'Alice Updated', chainIds: ['1'] },
    }

    strategy.execute(mockStore, action)

    expect(mockSelectTotalContactCount).toHaveBeenCalledWith(mockState)
    expect(mockTrackEvent).toHaveBeenCalled()
  })

  it('should track contact removed event', () => {
    const action = { type: 'addressBook/removeContact', payload: '0x1' }

    strategy.execute(mockStore, action)

    expect(mockSelectTotalContactCount).toHaveBeenCalledWith(mockState)
    expect(mockTrackEvent).toHaveBeenCalled()
  })

  it('should not track events for unrelated actions', () => {
    const action = { type: 'some/otherAction', payload: {} }

    strategy.execute(mockStore, action)

    expect(mockSelectTotalContactCount).not.toHaveBeenCalled()
    expect(mockTrackEvent).not.toHaveBeenCalled()
  })

  it('should handle errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    mockSelectTotalContactCount.mockImplementation(() => {
      throw new Error('Selector error')
    })

    const action = { type: 'addressBook/addContact', payload: { value: '0x3', name: 'Charlie', chainIds: ['1'] } }

    expect(() => strategy.execute(mockStore, action)).not.toThrow()
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })
})
