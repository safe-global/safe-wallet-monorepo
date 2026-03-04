export async function processInBatches<T, R>(items: T[], fn: (item: T) => Promise<R>, batchSize = 30): Promise<R[]> {
  if (items.length <= batchSize) {
    return Promise.all(items.map(fn))
  }

  const results: R[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize)
    const chunkResults = await Promise.all(chunk.map(fn))
    results.push(...chunkResults)
  }
  return results
}
