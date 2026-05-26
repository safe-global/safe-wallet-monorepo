import { createMMKV } from 'react-native-mmkv'
import { createMmkvStorage } from '../mmkvStorageAdapter'

// react-native-mmkv is mocked in apps/mobile/src/tests/jest.setup.tsx with
// a shared in-memory Map across all createMMKV() instances. Clearing
// between tests prevents key leakage.
beforeEach(() => {
  ;(createMMKV as jest.Mock).mockClear()
  // Wipe the shared map by clearing any keys this test may have set.
  // We do this via the raw mock so each test starts clean.
  const raw = createMMKV({ id: 'reset' })
  raw.clearAll()
})

describe('createMmkvStorage', () => {
  it('creates an MMKV instance with the supplied id', () => {
    createMmkvStorage('safe_wc_dapp')
    expect(createMMKV).toHaveBeenCalledWith({ id: 'safe_wc_dapp' })
  })

  describe('setItem + getItem round-trip', () => {
    it('stores and retrieves strings', async () => {
      const storage = createMmkvStorage('test')
      await storage.setItem('greeting', 'hello')
      await expect(storage.getItem('greeting')).resolves.toBe('hello')
    })

    it('stores and retrieves numbers', async () => {
      const storage = createMmkvStorage('test')
      await storage.setItem('count', 42)
      await expect(storage.getItem('count')).resolves.toBe(42)
    })

    it('stores and retrieves booleans', async () => {
      const storage = createMmkvStorage('test')
      await storage.setItem('flag', true)
      await expect(storage.getItem('flag')).resolves.toBe(true)
    })

    it('stores and retrieves plain objects', async () => {
      const storage = createMmkvStorage('test')
      const value = { topic: 'abc', expiry: 1000, accounts: ['eip155:1:0xabc'] }
      await storage.setItem('session', value)
      await expect(storage.getItem('session')).resolves.toEqual(value)
    })

    it('stores and retrieves arrays', async () => {
      const storage = createMmkvStorage('test')
      const value = [1, 'two', { three: 3 }]
      await storage.setItem('list', value)
      await expect(storage.getItem('list')).resolves.toEqual(value)
    })
  })

  describe('getItem', () => {
    it('returns undefined for a missing key', async () => {
      const storage = createMmkvStorage('test')
      await expect(storage.getItem('does-not-exist')).resolves.toBeUndefined()
    })
  })

  describe('getKeys', () => {
    it('returns an empty array when nothing is stored', async () => {
      const storage = createMmkvStorage('test')
      await expect(storage.getKeys()).resolves.toEqual([])
    })

    it('returns every stored key', async () => {
      const storage = createMmkvStorage('test')
      await storage.setItem('a', 1)
      await storage.setItem('b', 2)
      await storage.setItem('c', 3)
      const keys = await storage.getKeys()
      expect(keys.sort()).toEqual(['a', 'b', 'c'])
    })
  })

  describe('getEntries', () => {
    it('returns an empty array when nothing is stored', async () => {
      const storage = createMmkvStorage('test')
      await expect(storage.getEntries()).resolves.toEqual([])
    })

    it('returns every key paired with its JSON-parsed value', async () => {
      const storage = createMmkvStorage('test')
      await storage.setItem('str', 'hello')
      await storage.setItem('obj', { x: 1 })

      const entries = await storage.getEntries()
      const map = new Map(entries)

      expect(map.get('str')).toBe('hello')
      expect(map.get('obj')).toEqual({ x: 1 })
      expect(entries).toHaveLength(2)
    })
  })

  describe('removeItem', () => {
    it('removes a stored key', async () => {
      const storage = createMmkvStorage('test')
      await storage.setItem('tmp', 'value')
      await storage.removeItem('tmp')
      await expect(storage.getItem('tmp')).resolves.toBeUndefined()
      await expect(storage.getKeys()).resolves.toEqual([])
    })

    it('is a no-op for a missing key', async () => {
      const storage = createMmkvStorage('test')
      await expect(storage.removeItem('never-stored')).resolves.toBeUndefined()
    })
  })
})
