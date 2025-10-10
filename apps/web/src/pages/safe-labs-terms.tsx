import type { ReactElement } from 'react'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import SafeLabsTerms from '@/components/terms/safe-labs-terms'

const NewTerms = () => {
  const isOfficialHost = useIsOfficialHost()

  if (!isOfficialHost) {
    return null
  }

  return <SafeLabsTerms />
}

NewTerms.getLayout = (page: ReactElement) => page

export default NewTerms
