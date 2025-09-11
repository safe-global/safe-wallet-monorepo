export function invariant<T extends unknown>(condition: T, error: string): asserts condition {
  if (condition) {
    return
  }

  throw new Error(error)
}

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
