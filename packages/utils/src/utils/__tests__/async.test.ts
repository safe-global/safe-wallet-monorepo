import { processInBatches } from '../async'

describe('processInBatches', () => {
  it('should return empty array for empty input', async () => {
    const result = await processInBatches([], async (x: number) => x * 2)
    expect(result).toEqual([])
  })

  it('should use fast path (Promise.all) when items <= batchSize', async () => {
    const items = [1, 2, 3]
    const result = await processInBatches(items, async (x) => x * 2, 5)
    expect(result).toEqual([2, 4, 6])
  })

  it('should process in batches when items > batchSize', async () => {
    const callOrder: number[] = []
    const items = [1, 2, 3, 4, 5]

    const result = await processInBatches(
      items,
      async (x) => {
        callOrder.push(x)
        return x * 10
      },
      2,
    )

    expect(result).toEqual([10, 20, 30, 40, 50])
  })

  it('should cap concurrency at batchSize', async () => {
    let maxConcurrent = 0
    let currentConcurrent = 0
    const items = [1, 2, 3, 4, 5, 6]

    await processInBatches(
      items,
      async (x) => {
        currentConcurrent++
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent)
        await new Promise((r) => setTimeout(r, 10))
        currentConcurrent--
        return x
      },
      2,
    )

    expect(maxConcurrent).toBe(2)
  })

  it('should preserve result order with variable timing', async () => {
    const items = [1, 2, 3, 4, 5]

    const result = await processInBatches(
      items,
      async (x) => {
        // Reverse delay so later items resolve faster
        await new Promise((r) => setTimeout(r, (6 - x) * 5))
        return x
      },
      2,
    )

    expect(result).toEqual([1, 2, 3, 4, 5])
  })

  it('should propagate errors', async () => {
    const items = [1, 2, 3]

    await expect(
      processInBatches(
        items,
        async (x) => {
          if (x === 2) throw new Error('fail')
          return x
        },
        5,
      ),
    ).rejects.toThrow('fail')
  })

  it('should use fast path when items exactly equal batchSize', async () => {
    let maxConcurrent = 0
    let currentConcurrent = 0
    const items = [1, 2, 3]

    await processInBatches(
      items,
      async (x) => {
        currentConcurrent++
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent)
        await new Promise((r) => setTimeout(r, 10))
        currentConcurrent--
        return x
      },
      3,
    )

    // All 3 should run concurrently (fast path)
    expect(maxConcurrent).toBe(3)
  })

  it('should handle batchSize of 1 (fully sequential)', async () => {
    let maxConcurrent = 0
    let currentConcurrent = 0
    const items = [1, 2, 3, 4]

    const result = await processInBatches(
      items,
      async (x) => {
        currentConcurrent++
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent)
        await new Promise((r) => setTimeout(r, 5))
        currentConcurrent--
        return x * 2
      },
      1,
    )

    expect(result).toEqual([2, 4, 6, 8])
    expect(maxConcurrent).toBe(1)
  })
})
