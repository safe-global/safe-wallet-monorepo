import { useCallback, useMemo, useState } from 'react'
import useLocalStorage from '@/services/local-storage/useLocalStorage'

/** A policy's intro dialog: shown before its flow until it has been seen once, then skipped. */
export const usePolicyIntro = (seenKey: string, startFlow: () => void) => {
  const [hasSeen = false, setHasSeen] = useLocalStorage<boolean>(seenKey)
  const [isOpen, setIsOpen] = useState(false)

  // Any dismissal counts as shown: an explainer that returns after you closed it reads as a bug.
  const close = useCallback(() => {
    setIsOpen(false)
    setHasSeen(true)
  }, [setHasSeen])

  const request = useCallback(() => {
    if (hasSeen) {
      startFlow()
      return
    }
    setIsOpen(true)
  }, [hasSeen, startFlow])

  const proceed = useCallback(() => {
    close()
    startFlow()
  }, [close, startFlow])

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) close()
    },
    [close],
  )

  return useMemo(() => ({ isOpen, request, proceed, onOpenChange }), [isOpen, request, proceed, onOpenChange])
}
