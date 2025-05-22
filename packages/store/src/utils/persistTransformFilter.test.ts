import createFilter, {
  createWhitelistFilter,
  createBlacklistFilter,
  persistFilter,
  Path,
} from './persistTransformFilter'

// Interface for the transform results to fix typings
interface TransformResult {
  in: (state: Record<string, unknown>, key: string, config?: unknown) => Record<string, unknown>
  out: (state: Record<string, unknown>, key: string, config?: unknown) => Record<string, unknown>
}

describe('redux-persist-transform-filter', () => {
  describe('persistFilter', () => {
    it('should be a function', () => {
      expect(typeof persistFilter).toBe('function')
    })

    it('should return a subset, given one key', () => {
      expect(persistFilter({ a: 'a', b: 'b', c: 'c' }, 'a')).toEqual({ a: 'a' })
    })

    it('should return a subset, given an array of keys', () => {
      expect(persistFilter({ a: 'a', b: 'b', c: 'c' }, ['a'])).toEqual({ a: 'a' })
      expect(persistFilter({ a: 'a', b: 'b', c: 'c' }, ['a', 'b'])).toEqual({ a: 'a', b: 'b' })
    })

    it('should return a subset, given one key path', () => {
      expect(persistFilter({ a: { b: 'b', c: 'c' }, d: 'd' }, 'a.b')).toEqual({ a: { b: 'b' } })
      expect(persistFilter({ a: { b: 'b', c: 'c' }, d: 'd' }, 'a.c')).toEqual({ a: { c: 'c' } })
    })

    it('should return a subset, given an array of key paths', () => {
      expect(persistFilter({ a: { b: 'b', c: 'c' }, d: 'd' }, ['a.b'])).toEqual({ a: { b: 'b' } })
      expect(persistFilter({ a: { b: 'b', c: 'c' }, d: 'd' }, [['a', 'b']])).toEqual({ a: { b: 'b' } })
      expect(persistFilter({ a: { b: 'b', c: 'c' }, d: 'd' }, ['a.b', 'a.c'])).toEqual({ a: { b: 'b', c: 'c' } })
      expect(
        persistFilter({ a: { b: 'b', c: 'c' }, d: 'd' }, [
          ['a', 'b'],
          ['a', 'c'],
        ]),
      ).toEqual({ a: { b: 'b', c: 'c' } })
    })

    it('should return a subset, given an object that contains a path and a filterFunction', () => {
      const store = { a: { id1: { x: true, b: 'b' }, id2: { x: true, b: 'bb' }, id3: { x: false, b: 'bbb' } }, d: 'd' }
      expect(
        persistFilter(store, [{ path: 'a', filterFunction: (item: unknown) => (item as { x: boolean }).x }]),
      ).toEqual({
        a: { id1: { x: true, b: 'b' }, id2: { x: true, b: 'bb' } },
      })
      expect(
        persistFilter(store, [{ path: 'a', filterFunction: (item: unknown) => (item as { b: string }).b === 'bb' }]),
      ).toEqual({
        a: { id2: { x: true, b: 'bb' } },
      })
    })
  })

  describe('persistFilter (blacklist)', () => {
    it('should return a subset, given one key', () => {
      expect(persistFilter({ a: 'a', b: 'b', c: 'c' }, 'a', 'blacklist')).toEqual({ b: 'b', c: 'c' })
    })

    it('should return a subset, given an array of keys', () => {
      expect(persistFilter({ a: 'a', b: 'b', c: 'c' }, ['a'], 'blacklist')).toEqual({ b: 'b', c: 'c' })
      expect(persistFilter({ a: 'a', b: 'b', c: 'c' }, ['a', 'b'], 'blacklist')).toEqual({ c: 'c' })
    })

    it('should return a subset, given one key path', () => {
      expect(persistFilter({ a: { b: 'b', c: 'c' }, d: 'd' }, 'a.b', 'blacklist')).toEqual({ a: { c: 'c' }, d: 'd' })
      expect(persistFilter({ a: { b: 'b', c: 'c' }, d: 'd' }, 'a.c', 'blacklist')).toEqual({ a: { b: 'b' }, d: 'd' })
    })

    it('should return a subset, given an array of key paths', () => {
      expect(persistFilter({ a: { b: 'b', c: 'c' }, d: 'd' }, ['a.b'], 'blacklist')).toEqual({ a: { c: 'c' }, d: 'd' })
      expect(persistFilter({ a: { b: 'b', c: 'c' }, d: 'd' }, [['a', 'b']], 'blacklist')).toEqual({
        a: { c: 'c' },
        d: 'd',
      })
      expect(persistFilter({ a: { b: 'b', c: 'c' }, d: 'd' }, ['a.b', 'a.c'], 'blacklist')).toEqual({ a: {}, d: 'd' })
      expect(
        persistFilter(
          { a: { b: 'b', c: 'c' }, d: 'd' },
          [
            ['a', 'b'],
            ['a', 'c'],
          ],
          'blacklist',
        ),
      ).toEqual({ a: {}, d: 'd' })
    })

    it('should return a subset, given an object that contains a path and a filterFunction', () => {
      const store = { a: { id1: { x: true, b: 'b' }, id2: { x: true, b: 'bb' }, id3: { x: false, b: 'bbb' } }, d: 'd' }
      expect(
        persistFilter(
          JSON.parse(JSON.stringify(store)),
          [{ path: 'a', filterFunction: (item: unknown) => (item as { x: boolean }).x }],
          'blacklist',
        ),
      ).toEqual({ a: { id3: { x: false, b: 'bbb' } }, d: 'd' })
      expect(
        persistFilter(
          JSON.parse(JSON.stringify(store)),
          [{ path: 'a', filterFunction: (item: unknown) => (item as { b: string }).b === 'bb' }],
          'blacklist',
        ),
      ).toEqual({ a: { id1: { x: true, b: 'b' }, id3: { x: false, b: 'bbb' } }, d: 'd' })
    })

    it('should return a subset, given an object that contains a path and a filterFunction to reduce array', () => {
      const store = { a: [1, 2, 3], b: 'b' }
      const result = persistFilter(
        JSON.parse(JSON.stringify(store)) as Record<string, unknown>,
        [{ path: 'a', filterFunction: (_item: unknown) => true }],
        'blacklist',
      )

      expect(result).toEqual({ a: [], b: 'b' })

      expect(Object.keys(result.a || {}).length).toBe(0)
    })
  })

  describe('createFilter', () => {
    it('should be a function', () => {
      expect(typeof createFilter).toBe('function')
    })

    it('should return an object with in and out functions', () => {
      const myFilter = createFilter('reducerName', 'a.b' as Path, 'a.c' as Path, 'whitelist')
      expect(typeof myFilter).toBe('object')
      expect(myFilter).toHaveProperty('in')
      expect(myFilter).toHaveProperty('out')
      expect(typeof myFilter.in).toBe('function')
      expect(typeof myFilter.out).toBe('function')
    })

    it('should save a subset', () => {
      const myFilter = createFilter('reducerName', ['a.b', 'd'] as Path[], undefined, 'whitelist') as TransformResult

      const result = myFilter.in({ a: { b: 'b', c: 'c' }, d: 'd' }, 'reducerName', {})

      expect(result).toEqual({ a: { b: 'b' }, d: 'd' })
    })

    it('should load a subset', () => {
      const myFilter = createFilter('reducerName', undefined, ['a.b', 'd'] as Path[], 'whitelist') as TransformResult

      const result = myFilter.out({ a: { b: 'b', c: 'c' }, d: 'd' }, 'reducerName', {})

      expect(result).toEqual({ a: { b: 'b' }, d: 'd' })
    })
  })

  describe('createWhitelistFilter', () => {
    it('should be a function', () => {
      expect(typeof createWhitelistFilter).toBe('function')
    })

    it('should return an object with in and out functions', () => {
      const myFilter = createWhitelistFilter('reducerName', 'a.b' as Path, 'a.c' as Path)

      expect(typeof myFilter).toBe('object')
      expect(myFilter).toHaveProperty('in')
      expect(myFilter).toHaveProperty('out')
      expect(typeof myFilter.in).toBe('function')
      expect(typeof myFilter.out).toBe('function')
    })

    it('should save a subset', () => {
      const myFilter = createWhitelistFilter('reducerName', ['a.b', 'd'] as Path[]) as TransformResult

      const result = myFilter.in({ a: { b: 'b', c: 'c' }, d: 'd' }, 'reducerName', {})

      expect(result).toEqual({ a: { b: 'b' }, d: 'd' })
    })

    it('should load a subset', () => {
      const myFilter = createWhitelistFilter('reducerName', undefined, ['a.b', 'd'] as Path[]) as TransformResult

      const result = myFilter.out({ a: { b: 'b', c: 'c' }, d: 'd' }, 'reducerName', {})

      expect(result).toEqual({ a: { b: 'b' }, d: 'd' })
    })
  })

  describe('createBlacklistFilter', () => {
    it('should export functions', () => {
      expect(typeof createBlacklistFilter).toBe('function')
    })

    it('should return an object with in and out functions', () => {
      const myFilter = createBlacklistFilter('reducerName', 'a.b' as Path, 'a.c' as Path)
      expect(typeof myFilter).toBe('object')
      expect(myFilter).toHaveProperty('in')
      expect(myFilter).toHaveProperty('out')
      expect(typeof myFilter.in).toBe('function')
      expect(typeof myFilter.out).toBe('function')
    })

    it('should save a subset', () => {
      const state = { a: { b: 'b', c: 'c' }, d: 'd' }
      const myFilter = createBlacklistFilter('reducerName', ['a.b', 'd'] as Path[]) as TransformResult

      const result = myFilter.in(state, 'reducerName', {})

      expect(result).toEqual({ a: { c: 'c' } })
      expect(state).toEqual({ a: { b: 'b', c: 'c' }, d: 'd' })
    })

    it('should load a subset', () => {
      const state = { a: { b: 'b', c: 'c' }, d: 'd' }
      const myFilter = createBlacklistFilter('reducerName', undefined, ['a.b', 'd'] as Path[]) as TransformResult

      const result = myFilter.out(state, 'reducerName', {})

      expect(result).toEqual({ a: { c: 'c' } })
      expect(state).toEqual({ a: { b: 'b', c: 'c' }, d: 'd' })
    })
  })
})
