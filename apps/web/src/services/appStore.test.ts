import { getAppStore } from './appStore'
import { makeStore, setStoreInstance } from '@/store'

jest.mock('@/store', () => ({
  makeStore: jest.fn(() => ({ dispatch: jest.fn() })),
  setStoreInstance: jest.fn(),
}))

it('initializes the production store only when requested and reuses it', () => {
  expect(makeStore).not.toHaveBeenCalled()
  const store = getAppStore()
  expect(setStoreInstance).toHaveBeenCalledWith(store)
  expect(getAppStore()).toBe(store)
  expect(makeStore).toHaveBeenCalledTimes(1)
})
