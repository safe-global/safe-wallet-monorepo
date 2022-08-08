import type { NextPage } from 'next'
import LoadSafe from '@/components/load-safe'
import { useEffect, useState } from 'react'
import useSafeAddress from '@/hooks/useSafeAddress'

const LoadSafeWithAddress: NextPage = () => {
  const safeAddress = useSafeAddress()
  const [id, setId] = useState<string>(safeAddress)

  const initialData = {
    safeAddress: { address: safeAddress },
  }

  // This is a hack to force remounting if the query param changes but not the path
  useEffect(() => {
    setId(safeAddress)
  }, [safeAddress])

  return (
    <main>
      <LoadSafe key={id} initialStep={1} initialData={[undefined, initialData]} />
    </main>
  )
}

export default LoadSafeWithAddress
