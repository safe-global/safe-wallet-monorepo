import { type ReactElement, useEffect, useState } from 'react'

const RenderAfterMount = ({ children }: { children: ReactElement }): ReactElement | null => {
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])
  return isMounted ? children : null
}

export default RenderAfterMount
