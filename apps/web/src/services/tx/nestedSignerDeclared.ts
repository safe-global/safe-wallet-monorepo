import type { DeclaredAttribution } from '@safe-global/utils/utils/declaredAttribution'

const declaredByChildHash = new Map<string, DeclaredAttribution>()

// Exposes the child flow's attribution to the nested Safe wallet for the duration of `send`
export const withChildDeclared = async <T>(
  childSafeTxHash: string,
  declared: DeclaredAttribution | undefined,
  send: () => Promise<T>,
): Promise<T> => {
  if (!declared) {
    return send()
  }

  const key = childSafeTxHash.toLowerCase()
  declaredByChildHash.set(key, declared)
  try {
    return await send()
  } finally {
    // An overlapping call for the same hash may have replaced the entry
    if (declaredByChildHash.get(key) === declared) {
      declaredByChildHash.delete(key)
    }
  }
}

export const getChildDeclared = (childSafeTxHash: string): DeclaredAttribution | undefined =>
  declaredByChildHash.get(childSafeTxHash.toLowerCase())
