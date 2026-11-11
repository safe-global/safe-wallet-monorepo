import { useState } from 'react'

/** Open state of the read-only gas details. */
export const useDetailsToggle = () => {
  const [open, setOpen] = useState(false)
  return { open, onOpenChange: setOpen }
}
